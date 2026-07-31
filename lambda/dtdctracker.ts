import { SQSEvent, SQSBatchResponse } from 'aws-lambda';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import {RekognitionClient,DetectTextCommand,} from "@aws-sdk/client-rekognition";
import { wrapper } from "axios-cookiejar-support";
import { CookieJar } from "tough-cookie";
import axios from "axios";



const sqsClient = new SQSClient({});
const QUEUE_URL = process.env.QUEUEURL!;

const rekognition = new RekognitionClient({
  region:"ap-south-1",
})


  async function solvecaptcha(imgurl:string):Promise<string>{
    if(imgurl.includes(",")){
      imgurl = imgurl.split(",",2)[1];
    }
    const imgdata = Buffer.from(imgurl, 'base64');

    const response = await rekognition.send(
      new DetectTextCommand({
        Image:{
          Bytes:imgdata
        }
      })
    );
    const words =
      response.TextDetections
        ?.filter((d) => d.Type === "WORD")
        .map((d) => d.DetectedText || "") || [];

    return words.join("").trim();

  }




  async function trackDTDC(trackingnumber:string){
    const jar = new CookieJar()
    const session = wrapper(
    axios.create({
      jar,
      withCredentials: true,
      timeout: 30000,
    })
  );

  const baseHeaders = {
    Accept: "application/json, text/plain, */*",
    Origin: "https://www.dtdc.com",
    Referer: "https://www.dtdc.com/track-your-shipment/",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  };

  console.log("Step 0 - Visiting tracking page...");
  await session.get("https://www.dtdc.com/track-your-shipment/", {
    headers: baseHeaders,
  });

  console.log("Step 1 - Generating captcha...");
  
  const captchaRes = await session.get(
    "https://www.dtdc.com/wp-json/custom/v1/generate-captcha",
    {
      headers: baseHeaders,
    }
  );

  const captchaKey = captchaRes.data.key;
  const captchaImage = captchaRes.data.image;

  console.log("Captcha key:", captchaKey);

  console.log("Step 2 - Solving captcha...");

  const captchavalue = await solvecaptcha(captchaImage)
  console.log("Solved:", captchavalue);

  console.log("Step 3 - Validating captcha...");

  const validateres = await session.post(
    "https://www.dtdc.com/wp-json/custom/v1/captcha/validate",
    {
        "captchaKey": captchaKey,
        "captchaValue": captchavalue,
    },
    {

    headers: {
      ...baseHeaders,
      "Content-Type": "application/json",
    },
    }
  )

  const validatedata = validateres.data;

  console.log(validatedata)

  if (!validatedata.success) {
    return {
      success: false,
      message: `Captcha failed: ${JSON.stringify(validatedata)}`, 
    };
  }
  const token = validatedata.token;

const res = await session.post(
  "https://www.dtdc.com/wp-json/custom/v1/domestic/track",
  {
    trackType: "cnno",
    trackNumber: trackingnumber,
    token,
  },
  {
    headers: {
      ...baseHeaders,
      "Content-Type": "application/json",
    },
  }
);
  const data = res.data;
  if (data.statusCode === 200) {
        const latest = data.statuses[0];
        return {
          success: true,
          tracking_number: data.shipmentNo,
          status: latest.statusDescription,
          date_time: latest.statusTimestamp,
          location: latest.actCityName,
          branch: latest.actBranchName,
          remarks: latest.remarks,
      };
    
  }

  return {
  success: false,
  message: "Tracking request failed",
};
}



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


      

      const data = await trackDTDC(trackingNumber)

  
      if (!data?.success ) {
      console.log(`DTDC API error for ${trackingNumber}`);
      throw new Error(data.message);
      }

      const newStatus = data.status
      

      if (!newStatus) {
        console.log(`No status found for ${trackingNumber}, skipping`);
        continue;
      }

      console.log(`${trackingNumber}: ${currentStatus} → ${newStatus}`);

      // ④ only send to updater queue if status changed
      if (currentStatus !== newStatus) {
        await sqsClient.send(new SendMessageCommand({
          QueueUrl: QUEUE_URL,
          MessageBody: JSON.stringify({
            trackingNumber,
            status: newStatus,
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