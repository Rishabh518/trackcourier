import { DynamoDBClient,PutItemCommand } from "@aws-sdk/client-dynamodb"



const client = new DynamoDBClient({});
const ALLOWED_ORIGINS = ['https://staging.d1h6jb3oqit0yv.amplifyapp.com', 'https://ryantracking.vercel.app'];
export const handler= async(event:any,context:any)=>{
    const origin = event.headers?.origin || event.headers?.Origin || '';
    const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
    const CORS_HEADERS = {
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Headers': 'Content-Type',
    };
     const body = JSON.parse(event.body);
        console.log('Parsed body:', body);

        const trackingnumber = body.trackingNumber
        const custname = body.customerName
        const custmail = body.customerEmail
        const partner = body.partner
        const dispatchDate = body.dispatchDate
        const state = body.state
        const address = body.address
        const pincode = body.pincode
        const tablename = process.env.TABLE_NAME
        const companyname = body.companyName
        const invoiceref = body.invoiceRef
        const status = "initial"

    const data = await client.send(new PutItemCommand({
        TableName:tablename,
        Item:{
            trackingNumber:{S:trackingnumber},
            customerName:{S:custname},
            customerEmail:{S:custmail},
            partner:{S:partner},
            dispatchDate:{S:dispatchDate},
            state:{S:state},
            address:{S:address},
            pincode:{S:pincode},
            status:{S:status},
            companyName:{S:companyname},
            invoiceRef:{S:invoiceref}
        }
    }))

        return {
            statusCode: 200,
            headers: CORS_HEADERS,
            body: JSON.stringify({ message: 'Saved successfully',data:data }),
        };





}
