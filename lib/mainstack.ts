import * as cdk from 'aws-cdk-lib';
import {Construct} from 'constructs'
import { aws_apigateway as apigateway}  from 'aws-cdk-lib';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { aws_lambda as lambda } from 'aws-cdk-lib';
import { aws_dynamodb as dynamo} from 'aws-cdk-lib';
import { aws_lambda_event_sources as eventsources } from 'aws-cdk-lib';
import * as event from 'aws-cdk-lib/aws-events'
import * as target from "aws-cdk-lib/aws-events-targets"
import * as sqs from 'aws-cdk-lib/aws-sqs'
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';

export class mainstack extends cdk.Stack{
    constructor(scope:Construct,id:string,props?:cdk.StackProps){
        super(scope,id,props);


        const table = new dynamo.Table(this,'trackmetable',{
            partitionKey:{name:"trackingNumber",type:dynamo.AttributeType.STRING},
            tableName:"TrackmeTrackings",
            removalPolicy:cdk.RemovalPolicy.DESTROY,
            stream:dynamo.StreamViewType.NEW_IMAGE
        })


        const uploaderfn = new NodejsFunction(this,'uploadingfunction',{
            runtime:lambda.Runtime.NODEJS_22_X,
            entry:"./lambda/uploaderfn.ts",
            handler:"handler",
            timeout: cdk.Duration.seconds(30),
            environment:{
                TABLE_NAME:table.tableName
            }
            
        })
        
        const uploadsheet = new NodejsFunction(this,'uploadsheet',{
            runtime:lambda.Runtime.NODEJS_22_X,
            entry:"./lambda/uploadsheetfn.ts",
            handler:"handler",
            timeout: cdk.Duration.seconds(30),
            environment:{
                GOOGLE_CLIENT_EMAIL:"apprenons@ace-connection-499407-s9.iam.gserviceaccount.com",
                GOOGLE_PRIVATE_KEY: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDpLZsppcqPBEzG\niCo/4WzIkyP+Cn/So7vb1sdR4zurIXSfOvH83MFm+KLmYl/4mPM+ASgI1FX9iVEF\nc/9iyT2yl6Wses5VPqVpoM4DQb2HB4ROvcPYLch1sYt7sTDN+yyzWJBrT8xHQGqu\nKNCiRQeDrI8misUx7Z9H4tg1m5kd2MK4e8+HycsYSzm9yo8C86GVbxBzqueaeNn7\nK5PFrMTbrPoqbpMuRN6SurhO/lj9tiawb0bJMKra0JCV8vg5Ucfop1rcnT3y4tx/\nPQs6oR+XRNThmARL97K93C9j/OdphxiHB1MNdCCVrifYFoBUIjGhhO45zjM8VrcJ\nzcdpGfl3AgMBAAECggEAV16LQPOqDiRiUBE9I2pnxE+9sLZmZpqLDThQvtIRzXFf\nrTn86e4dWWPYRdKeext0KMtuIMDO54zIGu73xh/5Si2gGhx5q18pw4ZJKtc7GJks\nbgSUmS+uaMr5pIMj8kom2ZxZoJvpwtjUICWS5vpOcnv5t0tP0AFlKR5KPOvsV03l\nrBAvoVlGUXmfJ+HN4tSH11Ul0HeruV1mMGVuJY8lzKdKEN32INBzxMe/OUNrXqiH\nDiS5kux4mkiaVc5PVr3+PdOuhoUyJccj+1Yrjfnqi5U8D6j4O+lCuf6cS/Bp1TFm\np4K4qi+p6a08gCqdmRPY4NhL5PdvLqCFu3dZ9TU8AQKBgQD3nynLUYOtRpI88GE3\nUNJ1s/LBv0b2Gwwt7G8sgbwJoQtNiSWdqd0HgJSMyFBjaQSoWktXb3VupZHHpO0z\neHYjZFVoACHQE3M8M1BsYcXSu0Sfj5bl9OaEP/3iXX0WK3D2eBD4W6cXKZXMK2HN\nZPrkh0L6gRJieboMRqlLLxCzgQKBgQDxEVYQihUp14+yhJecnswIWnLfA3sge8jr\nIcFhhXBCLJvZf4yGRdPsCJAhlz+yQSBbh8Qxfcf1dH4UelX9FHQsVm3tFWgIDPWs\n3UUplV6m1WoW/qJViuKobpeNgnfAK5RSFomY5wHpgd8p8/CQCLNvv6FFm8I8XjMz\n1Q/+08DI9wKBgFDgJklm1UgZ3ZeTt1zWw/Z3kJkhPS8ShHbXWzRBJ0ZJ2CQ54BRP\nr4ZMw7f7kO33FfNaknL7T3KVFzkKsAJ4nLVQhuiR6nlIcQG/jMvpXzBFw9MNle6D\nf2rAb86oVDuScrG9Y2WKoddZ2Lg3jxkDm0Jav1CMKZIKSe7KgW6x75WBAoGBAK0S\n0UOWn5Mm3FhCsccUi1AEACz1BtVPifSmi3xEnVAlTs9cr7tHLttrWm+Dc4u7Dkwo\nsUcHEyS6ujphipLkuHOMqedpUwNUqp2tTxaH0yjcWAqiTlI0IH7kx5IldWxW3WoC\nHE/WqpzHTT2FkdUXKhy07EhZh55n00MHWTCPPv4JAoGADT3sthYAbQPzOV78OovI\nzixjoKCHeyJ+zlccW0Zp2LoQZLOMfeDx36twK0FuHqHn/homCb2spijBwExkhcq6\nldCsLz6pVMxxkunDjqBcaSk6BZcA1hnCQ+Am6bQ2msPMGZTUMMAwf4z9NXAzqFW2\n+VHz7muFnEXZ5ZCR57SWxUI=\n-----END PRIVATE KEY-----\n",
                SPREADSHEET_ID: '17E1Udg8Dey5ABwRup9lZrQ5faCcBr-LBa47gc5EdlAE', 
                SHEET_NAME: 'Shipments',               
            }
        })

        table.grantReadWriteData(uploaderfn)

        uploadsheet.addEventSource(new eventsources.DynamoEventSource(
            table,
            {
                startingPosition:lambda.StartingPosition.LATEST,
                batchSize:5,
                retryAttempts:2,
                filters:[
                    lambda.FilterCriteria.filter({
                        eventName:lambda.FilterRule.isEqual("INSERT")
                    })
                ]
            }
        ))


        const apigtw = new apigateway.RestApi(this,'uploadingtable',{
            defaultCorsPreflightOptions: {
                allowOrigins: ["https://ryantracking.vercel.app"],
                allowMethods: apigateway.Cors.ALL_METHODS,
                allowHeaders: ['Content-Type', 'Authorization', 'X-Amz-Date', 'X-Api-Key'],
            }
        })
        const upload = apigtw.root.addResource('inputdata')

        upload.addMethod('POST',new apigateway.LambdaIntegration(uploaderfn))


         const dtdcsqs = new sqs.Queue(this,'dtdctracksqs',{
            queueName:'dtdctrackqueue',
            visibilityTimeout: cdk.Duration.seconds(120),
            retentionPeriod: cdk.Duration.minutes(5)
        })

        const trackonsqs = new sqs.Queue(this,"trackonsqs",{
            queueName:'trackontrackqueue',
            visibilityTimeout: cdk.Duration.seconds(60),
            retentionPeriod: cdk.Duration.seconds(60)
        })

        const shreemarutisqs = new sqs.Queue(this,'shreemaruti',{
            queueName:'ShreeMarutiqueue',
            visibilityTimeout: cdk.Duration.seconds(60),
            retentionPeriod: cdk.Duration.seconds(60)
        })

        const trirupaticouriersqs = new sqs.Queue(this,'tirupaticouriersqs',{
            queueName:"Tirupatisqs",
            visibilityTimeout: cdk.Duration.seconds(60),
            retentionPeriod: cdk.Duration.seconds(60)
        })

        const updatersender = new sqs.Queue(this,'updatersender',{
            queueName:'updaterSender',
            visibilityTimeout: cdk.Duration.seconds(60),
            retentionPeriod: cdk.Duration.seconds(60)
        })

        const dbpullerfn = new NodejsFunction(this,'Dbpullerfn',{
            runtime:lambda.Runtime.NODEJS_22_X,
            entry:'./lambda/dbpullerfn.ts',
            handler:'handler',
            timeout: cdk.Duration.seconds(30),
            environment:{
                TABLE_NAME:table.tableName,
                DTDCQUEUE:dtdcsqs.queueUrl,
                TRACKONQUEUE:trackonsqs.queueUrl,
                SHREEMARUTIQUEUE:shreemarutisqs.queueUrl,
                TRIRUPATIQUEUE:trirupaticouriersqs.queueUrl
            }
        })
        table.grantReadWriteData(dbpullerfn);
        dtdcsqs.grantSendMessages(dbpullerfn);
        trackonsqs.grantSendMessages(dbpullerfn);
        trirupaticouriersqs.grantSendMessages(dbpullerfn)
        shreemarutisqs.grantSendMessages(dbpullerfn); //granting dbpuller to send message to shreemaruti queue

        new event.Rule(this,'DBpuller',{
            schedule:event.Schedule.cron({
                minute:'30',
                hour:'05,11',
            }),
            targets:[new target.LambdaFunction(dbpullerfn)],

        });


        const dtdcfn = new NodejsFunction(this,'DtdcTrackFunction',{
            runtime:lambda.Runtime.NODEJS_22_X,
            entry:'./lambda/dtdctracker.ts',
            handler:'handler',
            timeout: cdk.Duration.seconds(60),
            environment:{
                QUEUEURL:updatersender.queueUrl,
            }
        })

        dtdcfn.addToRolePolicy(new cdk.aws_iam.PolicyStatement({
            actions:["rekognition:DetectText"],
            resources:["*"]
        }))

        const trackonfn = new NodejsFunction(this,'TrackonTrackFunction',{
            runtime:lambda.Runtime.NODEJS_22_X,
            entry:'./lambda/trackontracker.ts',
            handler:'handler',
            timeout: cdk.Duration.seconds(60),
            environment:{
                QUEUEURL:updatersender.queueUrl,
            }
        })

        const shreemarutifn = new NodejsFunction(this,'shreemarutifn',{
            runtime:lambda.Runtime.NODEJS_22_X,
            entry:'./lambda/shreemaruti.ts',
            handler:'handler',
            timeout:cdk.Duration.seconds(60),
            environment:{
                QUEUEURL:updatersender.queueUrl,
            }
        })

        const tirupaticourierfn = new NodejsFunction(this,'tirupaticourierfn',{
            runtime:lambda.Runtime.NODEJS_22_X,
            entry:'./lambda/shreetirupati.ts',
            handler:'handler',
            timeout: cdk.Duration.seconds(60),
            environment:{
                QUEUEURL:updatersender.queueUrl,
            }
        })



        const uploadersenderfn = new NodejsFunction(this,'uploadersenderfn',{
            runtime:lambda.Runtime.NODEJS_22_X,
            entry:'./lambda/uploadersenderfn.ts',
            handler:'handler',
            timeout: cdk.Duration.seconds(60),
            memorySize: 256,
              bundling: {
                commandHooks: {
                beforeBundling() {
                    return [];
                },
                beforeInstall() {
                    return [];
                },
                afterBundling(inputDir: string, outputDir: string) {
                    return [
                    `cp -r ${inputDir}/public ${outputDir}/public`,
                    ];
                },
                },
            },
            environment:{
                TABLE_NAME:table.tableName,
                GOOGLE_CLIENT_EMAIL:"apprenons@ace-connection-499407-s9.iam.gserviceaccount.com",
                GOOGLE_PRIVATE_KEY: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDpLZsppcqPBEzG\niCo/4WzIkyP+Cn/So7vb1sdR4zurIXSfOvH83MFm+KLmYl/4mPM+ASgI1FX9iVEF\nc/9iyT2yl6Wses5VPqVpoM4DQb2HB4ROvcPYLch1sYt7sTDN+yyzWJBrT8xHQGqu\nKNCiRQeDrI8misUx7Z9H4tg1m5kd2MK4e8+HycsYSzm9yo8C86GVbxBzqueaeNn7\nK5PFrMTbrPoqbpMuRN6SurhO/lj9tiawb0bJMKra0JCV8vg5Ucfop1rcnT3y4tx/\nPQs6oR+XRNThmARL97K93C9j/OdphxiHB1MNdCCVrifYFoBUIjGhhO45zjM8VrcJ\nzcdpGfl3AgMBAAECggEAV16LQPOqDiRiUBE9I2pnxE+9sLZmZpqLDThQvtIRzXFf\nrTn86e4dWWPYRdKeext0KMtuIMDO54zIGu73xh/5Si2gGhx5q18pw4ZJKtc7GJks\nbgSUmS+uaMr5pIMj8kom2ZxZoJvpwtjUICWS5vpOcnv5t0tP0AFlKR5KPOvsV03l\nrBAvoVlGUXmfJ+HN4tSH11Ul0HeruV1mMGVuJY8lzKdKEN32INBzxMe/OUNrXqiH\nDiS5kux4mkiaVc5PVr3+PdOuhoUyJccj+1Yrjfnqi5U8D6j4O+lCuf6cS/Bp1TFm\np4K4qi+p6a08gCqdmRPY4NhL5PdvLqCFu3dZ9TU8AQKBgQD3nynLUYOtRpI88GE3\nUNJ1s/LBv0b2Gwwt7G8sgbwJoQtNiSWdqd0HgJSMyFBjaQSoWktXb3VupZHHpO0z\neHYjZFVoACHQE3M8M1BsYcXSu0Sfj5bl9OaEP/3iXX0WK3D2eBD4W6cXKZXMK2HN\nZPrkh0L6gRJieboMRqlLLxCzgQKBgQDxEVYQihUp14+yhJecnswIWnLfA3sge8jr\nIcFhhXBCLJvZf4yGRdPsCJAhlz+yQSBbh8Qxfcf1dH4UelX9FHQsVm3tFWgIDPWs\n3UUplV6m1WoW/qJViuKobpeNgnfAK5RSFomY5wHpgd8p8/CQCLNvv6FFm8I8XjMz\n1Q/+08DI9wKBgFDgJklm1UgZ3ZeTt1zWw/Z3kJkhPS8ShHbXWzRBJ0ZJ2CQ54BRP\nr4ZMw7f7kO33FfNaknL7T3KVFzkKsAJ4nLVQhuiR6nlIcQG/jMvpXzBFw9MNle6D\nf2rAb86oVDuScrG9Y2WKoddZ2Lg3jxkDm0Jav1CMKZIKSe7KgW6x75WBAoGBAK0S\n0UOWn5Mm3FhCsccUi1AEACz1BtVPifSmi3xEnVAlTs9cr7tHLttrWm+Dc4u7Dkwo\nsUcHEyS6ujphipLkuHOMqedpUwNUqp2tTxaH0yjcWAqiTlI0IH7kx5IldWxW3WoC\nHE/WqpzHTT2FkdUXKhy07EhZh55n00MHWTCPPv4JAoGADT3sthYAbQPzOV78OovI\nzixjoKCHeyJ+zlccW0Zp2LoQZLOMfeDx36twK0FuHqHn/homCb2spijBwExkhcq6\nldCsLz6pVMxxkunDjqBcaSk6BZcA1hnCQ+Am6bQ2msPMGZTUMMAwf4z9NXAzqFW2\n+VHz7muFnEXZ5ZCR57SWxUI=\n-----END PRIVATE KEY-----\n",
                SPREADSHEET_ID: '17E1Udg8Dey5ABwRup9lZrQ5faCcBr-LBa47gc5EdlAE', 
                SHEET_NAME: 'Shipments',
                SENDERMAIL:"sales@ryanlabenterprises.com",
                SENDERPASS:"zwvm nyzt kcso qwde"

            }
        })
        
        table.grantReadWriteData(uploadersenderfn)


        dtdcsqs.grantConsumeMessages(dtdcfn)
        trackonsqs.grantConsumeMessages(trackonfn)
        shreemarutisqs.grantConsumeMessages(shreemarutifn)
        trirupaticouriersqs.grantConsumeMessages(tirupaticourierfn)


        updatersender.grantSendMessages(dtdcfn)
        updatersender.grantSendMessages(trackonfn)
        updatersender.grantSendMessages(shreemarutifn)
        updatersender.grantSendMessages(tirupaticourierfn)
        //these fn can send message to updatersender queue
        updatersender.grantConsumeMessages(uploadersenderfn) // This allow uploadersenderfn to allow read from the queue 
        


        dtdcfn.addEventSource(
            new eventsources.SqsEventSource(dtdcsqs,{
                batchSize: 1,
                reportBatchItemFailures:true
            })
        )

        trackonfn.addEventSource(
            new SqsEventSource(trackonsqs,{
                batchSize:1,
                reportBatchItemFailures:true
            })
        )

        shreemarutifn.addEventSource(
            new SqsEventSource(shreemarutisqs,{
                batchSize:1,
                reportBatchItemFailures:true
            })
        )

        tirupaticourierfn.addEventSource(
            new SqsEventSource(trirupaticouriersqs,{
                batchSize:1,
                reportBatchItemFailures:true
            })
        )

        uploadersenderfn.addEventSource(
            new SqsEventSource(updatersender,{
                batchSize:1,
                reportBatchItemFailures:true
            })
        )


        
    }
        
}
