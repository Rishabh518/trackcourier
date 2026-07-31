import { SQSEvent, SQSBatchResponse } from 'aws-lambda';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import * as cheerio from 'cheerio';

const sqsClient = new SQSClient({});
const QUEUE_URL = process.env.QUEUEURL!;
const TRACKON_URL = 'https://www.trackon.in/courier-tracking';

export const handler = async (event: SQSEvent): Promise<SQSBatchResponse> => {
  const failedItems: { itemIdentifier: string }[] = [];

  for (const record of event.Records) {
    const messageId = record.messageId;
    try {
      // ① parse SQS message
      const payload       = JSON.parse(record.body);
      const trackingNumber = payload.trackingNumber;
      const currentStatus  = payload.status;
      const custName       = payload.custName;
      const custEmail      = payload.custEmail;
      const partner        = payload.partner;
      const invoiceRef     = payload.invoiceRef;

      console.log(`Processing ${trackingNumber}, current status: ${currentStatus}`);
      let isinitial=false;
      if(currentStatus === "initial"){
        isinitial = true
      }
      // ② GET the page to extract CSRF token + cookie
      const getRes = await fetch(TRACKON_URL, {
        headers: {
          'Accept':     '*/*',
          'Referer':    TRACKON_URL,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        },
      });

      const getHtml = await getRes.text();

      // ③ parse CSRF token from HTML using cheerio (replaces BeautifulSoup)
      const $        = cheerio.load(getHtml);
      const formToken = $('input[name="__RequestVerificationToken"]').val() as string;

      if (!formToken) {
        console.log(`CSRF token not found for ${trackingNumber}`);
        failedItems.push({ itemIdentifier: messageId });
        continue;
      }

      // ④ extract cookie from response headers
      const setCookieHeader = getRes.headers.get('set-cookie') ?? '';
      const cookieToken     = setCookieHeader
        .split(';')
        .find(c => c.trim().startsWith('__RequestVerificationToken'))
        ?.split('=')[1] ?? '';

      console.log(`FORM TOKEN: ${formToken}`);
      console.log(`COOKIE TOKEN: ${cookieToken}`);

      // ⑤ POST tracking request
      const formData = new URLSearchParams();
      formData.append('awbSingleTrackingId', trackingNumber);
      formData.append('__RequestVerificationToken', formToken);

      const postRes = await fetch(TRACKON_URL, {
        method: 'POST',
        headers: {
          'Accept':       '*/*',
          'Content-Type': 'application/x-www-form-urlencoded',
          'Referer':      TRACKON_URL,
          'User-Agent':   'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          'Cookie':       `__RequestVerificationToken=${cookieToken}`,
        },
        body: formData.toString(),
        signal: AbortSignal.timeout(60_000), // 60s timeout
      });

      console.log(`STATUS: ${postRes.status}`);

      if (postRes.status !== 200) {
        console.log(`Trackon error for ${trackingNumber}`);
        failedItems.push({ itemIdentifier: messageId });
        continue;
      }

      // ⑥ parse tracking events from response HTML
      const postHtml = await postRes.text();
      const $2       = cheerio.load(postHtml);
      const events: { date: string; transactionNumber: string; location: string; event: string }[] = [];

      $2('#divtrackStatus table tbody tr').each((_, row) => {
        const cols = $2(row).find('td');
        if (cols.length >= 5) {
          events.push({
            date:              $2(cols[0]).text().trim(),
            transactionNumber: $2(cols[1]).text().trim(),
            location:          $2(cols[2]).text().trim(),
            event:             $2(cols[4]).text().trim(),
          });
        }
      });

      console.log(`TOTAL ROWS: ${events.length}`);

      // ⑦ guard — no events found
      if (events.length === 0) {
        console.log(`No events found for ${trackingNumber}, skipping`);
        continue;
      }

      let newStatus = events[0].event;
      console.log(`${trackingNumber}: ${currentStatus} → ${newStatus}`);

      // ⑧ only send to updater queue if status 
      if (newStatus.includes("DELIVERED")) {
        newStatus = "Delivered"
      }
      if (currentStatus !== newStatus) {
        await sqsClient.send(new SendMessageCommand({
          QueueUrl:    QUEUE_URL,
          MessageBody: JSON.stringify({
            trackingNumber,
            status:    newStatus,
            custName,
            custEmail,
            invoiceRef,
            partner,
            isinitial
          }),
        }));
        console.log(`✓ Status update sent for ${trackingNumber}`);
      } else {
        console.log(`No change for ${trackingNumber}, skipping`);
      }

    } catch (err) {
      console.error(`✗ Failed for message ${messageId}:`, err);
      failedItems.push({ itemIdentifier: messageId });
    }
  }

  return { batchItemFailures: failedItems };
};