import { SendMessage$, SendMessageCommand, SQSClient } from "@aws-sdk/client-sqs";

const sqsclient = new SQSClient({})
const queueurl = process.env.QUEUEURL

export const handler = async(event:any,context:any) =>{

    console.log("Shree Maruti Function invoked");
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
            let isinitial=false;
            if(currentStatus === "initial"){
                isinitial = true
            }
            
            console.log(`Processing ${trackingNumber}, current status: ${currentStatus}`);
            

            const response = await fetch(`https://apis-hubops.innofulfill.com/tracking/v2/${trackingNumber}`,{
                method:"GET",
                headers:{
                    "accept":"*/*"                
                },
            });
            const data = await response.json();

            let newStatus = data.statuses[0]?.status;

            if(!newStatus){
                console.log(`No status found for ${trackingNumber}, skipping`);
                continue;
            }

            if(newStatus === "delivered"){
                newStatus="Delivered"
            }

            if(newStatus != currentStatus){
                await sqsclient.send(new SendMessageCommand({
                    QueueUrl: queueurl,
                    MessageBody: JSON.stringify({
                        trackingNumber,
                        status: newStatus,
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

    catch (err) {
        console.error(`✗ Failed for message ${messageId}:`, err);
      failedItems.push({ itemIdentifier: messageId });
    }
        }
    return { batchItemFailures: failedItems };
}