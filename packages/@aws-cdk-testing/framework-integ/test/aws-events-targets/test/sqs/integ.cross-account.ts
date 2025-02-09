import { IntegTest } from '@aws-cdk/integ-tests-alpha';
import { App, Duration, PhysicalName, Stack } from 'aws-cdk-lib';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as sqs from 'aws-cdk-lib/aws-sqs';

const sourceAccount = process.env.CDK_INTEG_ACCOUNT || process.env.CDK_DEFAULT_ACCOUNT || '123456789012';
const targetAccount = process.env.CDK_INTEG_CROSS_ACCOUNT || '234567890123';

const app = new App();
const sourceStack = new Stack(app, 'lambda-events-cross-account-source', {
  env: { account: sourceAccount, region: 'us-east-1' },
});
const targetStack = new Stack(app, 'lambda-events-cross-account-target', {
  env: { account: targetAccount, region: 'us-east-1' },
});

const queue = new sqs.Queue(targetStack, 'MyQueue', {
  queueName: PhysicalName.GENERATE_IF_NEEDED,
});

const timer = new events.Rule(sourceStack, 'Timer', {
  schedule: events.Schedule.rate(Duration.minutes(1)),
});

const role = new iam.Role(sourceStack, 'Role', {
  assumedBy: new iam.ServicePrincipal('events.amazonaws.com'),
  roleName: PhysicalName.GENERATE_IF_NEEDED,
});

timer.addTarget(new targets.SqsQueue(queue, { role }));

new IntegTest(app, 'Integ', { testCases: [sourceStack] });

app.synth();
