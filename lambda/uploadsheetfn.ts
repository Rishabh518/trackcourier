import { google } from 'googleapis';
import { DynamoDBStreamEvent, DynamoDBStreamHandler, DynamoDBRecord } from 'aws-lambda';

function getGoogleAuth() {
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}
function extractField(record: DynamoDBRecord, field: string): string {
  return record.dynamodb?.NewImage?.[field]?.S ?? '';
}
export const handler = async(event:any,context:any)=>{
    const auth = getGoogleAuth();
    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.SPREADSHEET_ID!;
    const sheetName = process.env.SHEET_NAME!;


    const rows = event.Records.map((record?:any) => [
    extractField(record, 'dispatchDate'),
    extractField(record, 'companyName'),
    extractField(record, 'customerName'),
    extractField(record, 'customerEmail'),
    extractField(record, 'trackingNumber'),
    extractField(record, 'invoiceRef'),
    extractField(record, 'partner'),
    extractField(record, 'state'),
    extractField(record, 'pincode'),
    extractField(record, 'address'),
    extractField(record, 'status'),
    
    
  ]);
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${sheetName}!A1`,
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: rows },
  });


  console.log(`✓ Appended ${rows.length} row(s) to Google Sheets`);

}