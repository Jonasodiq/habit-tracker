const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
  ScanCommand,
} = require('@aws-sdk/lib-dynamodb');

// Create the client
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'eu-north-1',
});
const dynamo = DynamoDBDocumentClient.from(client);

module.exports = {
  dynamo,
  PutCommand,
  GetCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
  ScanCommand,
};

/*        Design Choices Summary
  Choice / Tool                   | Reason / Benefit                            | Source
  --------------------------------|---------------------------------------------|------------------------------------------------------------
  AWS SDK v3                      | More modern, smaller bundle size,           | AWS migration guide: https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/migrating.html
                                  | better TypeScript support                   |
  DynamoDBDocumentClient          | Automatic type conversion, simpler code     | AWS docs: https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/Package/-aws-sdk-lib-dynamodb/
  Environment variable for region | Lambda automatically sets AWS_REGION        | Lambda env vars: https://docs.aws.amazon.com/lambda/latest/dg/configuration-envvars.html
  Single library file             | Single point of change if SDK is updated    | General coding practice (DRY)
*/
