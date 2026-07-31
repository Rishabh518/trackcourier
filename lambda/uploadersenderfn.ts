import { DynamoDBClient, UpdateItemCommand } from '@aws-sdk/client-dynamodb'
import { google } from 'googleapis';
import nodemailer from 'nodemailer'
import { dispatchedEmail, statusUpdatedEmail, deliveredEmail } from './emailtemplate';
import { content } from 'googleapis/build/src/apis/content';
import { readFileSync } from 'fs';
import { join } from 'path';


const client = new DynamoDBClient({})



const auth = new google.auth.GoogleAuth({
    credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },

    scopes: [
        "https://www.googleapis.com/auth/spreadsheets",
    ],
});

const sheets = google.sheets({
    version: "v4",
    auth,
});

const transporter = nodemailer.createTransport({
    service: "gmail",

    auth: {
        user: process.env.SENDERMAIL,
        pass: process.env.SENDERPASS,
    },
});




export const handler = async (event: any, context: any) => {
    const failed_items = []

    for (const record of event.Records) {
        const message_id = record.messageId;
        try {
            const payload = JSON.parse(record.body)
            const trackingNumber = payload.trackingNumber
            const currentStatus = payload.status
            const custName = payload.custName
            const custEmail = payload.custEmail
            const partner = payload.partner
            const invoiceRef = payload.invoiceRef
            const isinitial = payload.isinitial

            console.log(`Processing ${trackingNumber}`);
            const lastcheckedate = new Date().toISOString()

            await client.send(
                new UpdateItemCommand({
                    TableName: process.env.TABLE_NAME,
                    Key: {
                        trackingNumber: {
                            S: trackingNumber
                        }

                    },
                    UpdateExpression: `SET #status = :status, #lastcheckedat = :lastcheckedat`,
                    ExpressionAttributeNames: {
                        "#status": "status", "#lastcheckedat": "lastcheckedat"
                    },
                    ExpressionAttributeValues: {
                        ":status": {
                            S: currentStatus
                        },
                        ":lastcheckedat": {
                            S: lastcheckedate
                        }
                    }



                })
            )
            console.log(`Updated ${trackingNumber} to ${currentStatus}`);
            const spreadsheetId = process.env.SPREADSHEET_ID!;
            const sheetName = process.env.SHEET_NAME!;

            const rowsdata = await sheets.spreadsheets.values.get({
                spreadsheetId,
                range: `${sheetName}!A:L`
            })

            const rows = rowsdata.data.values ?? []

            const indexrow = rows.findIndex(
                (row, i) => i > 0 && row[4] === trackingNumber
            )
            if (indexrow === -1) {
                console.warn(`${trackingNumber} not found in sheet`);
                continue;
            }
            const sheetrow = indexrow + 1

            await sheets.spreadsheets.values.update({
                spreadsheetId,
                range: `${sheetName}!k${sheetrow}`,
                valueInputOption: 'RAW',
                requestBody: {
                    values: [[currentStatus]]
                }
            })
            if (currentStatus === "Delivered") {
                const currentdate = new Date().toISOString().split("T")[0];
                await sheets.spreadsheets.values.update({
                    spreadsheetId,
                    range: `${sheetName}!L${sheetrow}`,
                    valueInputOption: 'RAW',
                    requestBody: {
                        values: [[currentdate]]
                    }
                })
            }
            // ── Email Templates ───────────────────────────────────────────────────

    
            let emailHtml: string;
            let subject: string;
            let attachments
            const dispatchimg = readFileSync(join(process.cwd(), 'public', 'dispatched.png'));
            const deliveredimg = readFileSync(join(process.cwd(), 'public', 'delivered.png'));
            const statuschangeimg = readFileSync(join(process.cwd(), 'public', 'statuschange.png'));
            const ryanlogo = readFileSync(join(process.cwd(), 'public', 'Ryanlogo.png'));    
            if (currentStatus?.toLowerCase() === "delivered") {
            // ③ delivered email
            emailHtml = deliveredEmail(custName, trackingNumber, invoiceRef, partner);
            subject   = `Your order has been delivered Ref ${invoiceRef} `;
            attachments = [{
                        filename: 'Ryanlogo.png',
                        content:ryanlogo,
                        cid: 'ryanlogo'
                    },
                    {
                        filename: 'delivered.png',
                        content:deliveredimg,
                        cid: 'delivered'

                    },
                ]

            } else if (isinitial) {
            // ① first dispatch email — when status = Initial/Booked
            emailHtml = dispatchedEmail(custName, trackingNumber, invoiceRef, partner, currentStatus);
            subject   = `Your order has been dispatched Ref ${invoiceRef}`;
            attachments = [{
                        filename: 'Ryanlogo.png',
                        content:ryanlogo,
                        cid: 'ryanlogo'
                    },
                    {
                        filename: 'dispatched.png',
                        content:dispatchimg,
                        cid: 'dispatch'

                    },
                ]

            } else {
            // ② status changed email
            emailHtml = statusUpdatedEmail(custName, trackingNumber, invoiceRef, partner, currentStatus);
            subject   = `Shipment update for your order Ref ${invoiceRef}`;
            attachments = [{
                        filename: 'Ryanlogo.png',
                        content:ryanlogo,
                        cid: 'ryanlogo'
                    },
                    {
                        filename: 'statuschange.png',
                        content:statuschangeimg,
                        cid: 'statuschange'

                    },
                ]
            }
        
            
    const mailOption = {
        from: `"Ryan lab Enterprises" <${process.env.SENDERMAIL}>`,
                to: custEmail,
                bcc:['paruluni9809@gmail.com','inforyanlab@gmail.com'],
                subject: subject,
                html: emailHtml,
                attachments: attachments
            }
            const info = await transporter.sendMail(mailOption);

            console.log("Mail has been sent!", info)
        }


        catch (error) {
            console.log("Failed processing", error)
            failed_items.push({
                itemIdentifier: message_id
            })
        }
    }





    return {
        batchItemFailures: failed_items
    }


}