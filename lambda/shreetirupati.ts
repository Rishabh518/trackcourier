import { SendMessage$, SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs';
import * as cheerio from 'cheerio';

const sqsclient = new SQSClient({})
const queueurl = process.env.QUEUEURL

async function Track(TRACKING_NUMBER:any) {
  try {
    // STEP 1 — Get page
    const BASE_URL = 'http://www.shreetirupaticourier.net';
    const pageRes = await fetch(`${BASE_URL}/TopHeader.aspx`);

    const pageHtml = await pageRes.text();

    const $ = cheerio.load(pageHtml);

    const viewState =
      $('input[name="__VIEWSTATE"]').val() as string;

    const viewStateGenerator =
      $('input[name="__VIEWSTATEGENERATOR"]').val() as string;

    const eventValidation =
      $('input[name="__EVENTVALIDATION"]').val() as string;

    const cookies = pageRes.headers.get('set-cookie') ?? '';

    // STEP 2 — Submit tracking
    const formData = new URLSearchParams({
      __VIEWSTATE: viewState,
      __VIEWSTATEGENERATOR: viewStateGenerator,
      __EVENTVALIDATION: eventValidation,
      trackingno: TRACKING_NUMBER,
      btnTrack: 'Go',
    });

    const trackRes = await fetch(`${BASE_URL}/TopHeader.aspx`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Cookie: cookies,
      },
      body: formData.toString(),
    });

    const trackHtml = await trackRes.text();

    // STEP 3 — Get iframe URL
    const $$ = cheerio.load(trackHtml);

    const iframeSrc = $$('iframe').attr('src');

    if (!iframeSrc) {
      throw new Error('Iframe not found');
    }

    const iframeUrl = iframeSrc.startsWith('http')
      ? iframeSrc
      : `${BASE_URL}/${iframeSrc.replace(/^\//, '')}`;

    // STEP 4 — Open iframe
    const iframeRes = await fetch(iframeUrl, {
      headers: {
        Cookie: cookies,
      },
    });

    const iframeHtml = await iframeRes.text();

    // STEP 5 — Parse latest status
    const $$$ = cheerio.load(iframeHtml);

    let latestStatus = '';

    $$$('table tr').each((_, row) => {
      const cols = $$$(row)
        .find('td')
        .map((_, td) => $$$(td).text().trim())
        .get();

      // Find STATUS row
      if (cols[0]?.includes('STATUS') && cols[1]) {
        latestStatus = cols[1];
      }
    });

    // Clean unwanted text
    latestStatus = latestStatus
      .replace(/For Any Query[\s\S]*/i, '')
      .trim();

    const result = {
      trackingNumber: TRACKING_NUMBER,
      latestStatus,
    };

    return result.latestStatus

  } catch (err) {
    console.error(err);
  }
}

export const handler=async(event:any,context:any)=>{
    console.log("ShreeTirupati Function invoked");
    console.log("Event: ",event);
    const failedItems: { itemIdentifier: string }[] = [];
    for(const record of event.Records){
    const messageId = record.messageId
    
    try {
            const payload = JSON.parse(record.body)
            const trackingNumber = payload.trackingNumber;
            const custName = payload.custName;
            const currentStatus = payload.status;
            const custEmail = payload.custEmail;
            const partner = payload.partner;
            const invoiceRef = payload.invoiceRef;
          console.log(`Processing ${trackingNumber}, current status: ${currentStatus}`);
          let isinitial=false;
            if(currentStatus === "initial"){
              isinitial = true
            }
          const res = await Track(trackingNumber)
          console.log(res)
          let newStatus = res
          
          if(!newStatus){
                console.log(`No status found for ${trackingNumber}, skipping`);
                continue;
          }

          if(newStatus==="STATUS"){
            newStatus="initial"
          }

          if(newStatus.includes("Delivered")){
                newStatus="Delivered"
          }


          if(newStatus!=currentStatus){
            await sqsclient.send(new SendMessageCommand({
              QueueUrl:queueurl,
              MessageBody:JSON.stringify({
                trackingNumber,
                newStatus,
                status:newStatus,
                custName,
                custEmail,
                invoiceRef,
                partner,
                isinitial
              })
            }))
            console.log(`✓ Status update sent for ${trackingNumber}`);
          }
          else{
            console.log(`No change for ${trackingNumber}, skipping`);
          }

    }
    catch(err){
        console.error(`✗ Failed for message ${messageId}:`, err);
      failedItems.push({ itemIdentifier: messageId });
    }
}
  return { batchItemFailures: failedItems };
}