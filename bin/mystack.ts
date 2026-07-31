import * as cdk from 'aws-cdk-lib';
import { mainstack } from '../lib/mainstack';

const app = new cdk.App();
new mainstack(app,"mainstck",{})
