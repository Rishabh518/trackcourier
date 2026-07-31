import {ScanCommand,DynamoDBClient, DeleteItemCommand} from '@aws-sdk/client-dynamodb'
import {SQSClient, SendMessageCommand} from '@aws-sdk/client-sqs'

const client = new DynamoDBClient({})
const sqsclient = new SQSClient({})

export const handler = async(event:any ,context:any)=>{
    try {
        const result = await client.send(new ScanCommand({
            TableName:process.env.TABLE_NAME
    
        }));

       const data = result.Items ?? []
    
       let body =[]
       for (const item of data){
            const status = item.status?.S;
            const trackingnumber = item.trackingNumber?.S;
            const partnername = item.partner?.S
            const custname = item.customerName?.S
            const custemail = item.customerEmail?.S
            const invoiceref = item.invoiceRef?.S 

            console.log(`Status of ${trackingnumber}: ${status}`);

            if(status ==="Delivered"){
                await client.send(new DeleteItemCommand({
                    TableName:process.env.TABLE_NAME,
                    Key:{trackingNumber:{S:trackingnumber!}}
                }))
                console.log(`Deleted item with tracking number: ${trackingnumber}`);
            }
            else{
                body.push({
                    trackingNumber:trackingnumber,
                    partner:partnername,
                    status:status,
                    custName:custname,
                    custEmail:custemail,
                    invoiceRef:invoiceref
                })
            }
            console.log("sending to Queue")
        }

        for (const i of body){
            if(i.partner==="dtdc"){
                    await sqsclient.send(
                        new SendMessageCommand({
                            QueueUrl:process.env.DTDCQUEUE,
                            MessageBody:JSON.stringify(i)
                        })
                    )
                console.log(`Sent ${i.trackingNumber} to DTDC queue`)
            }
            if(i.partner=="trackon"){
                await sqsclient.send(
                    new SendMessageCommand({
                        QueueUrl:process.env.TRACKONQUEUE,
                        MessageBody:JSON.stringify(i)
                    })
                )
                console.log(`Sent ${i.trackingNumber} to Trackon queue`)
            }
            if(i.partner==="shreemaruti"){
                await sqsclient.send(
                        new SendMessageCommand({
                            QueueUrl:process.env.SHREEMARUTIQUEUE,
                            MessageBody:JSON.stringify(i)
                        })
                    )
                console.log(`Sent ${i.trackingNumber} to Shree Maruti queue`)
            }

            if(i.partner === "tirupaticourier"){
                await sqsclient.send(
                    new SendMessageCommand({
                        QueueUrl:process.env.TRIRUPATIQUEUE,
                        MessageBody:JSON.stringify(i)
                    })
                )
                console.log(`Sent ${i.trackingNumber} to TirupatiCourier queue`)
            }


        }

        console.log("This is the tracking details: ",body)



    } catch (error) {
    console.error("Error processing records:", error);
    throw error;    
    }
}