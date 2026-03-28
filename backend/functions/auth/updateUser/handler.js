const { CognitoIdentityProviderClient, AdminUpdateUserAttributesCommand } = require('@aws-sdk/client-cognito-identity-provider');
const { dynamo, GetCommand, UpdateCommand } = require('../../../lib/dynamodb');
const response = require('../../../lib/response');

const TABLE           = process.env.USERS_TABLE;
const USER_POOL_ID    = process.env.COGNITO_USER_POOL_ID;
const cognito = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION || 'eu-north-1' });

// PATCH /auth/users/me
module.exports.updateUser = async (event) => {
  try {
    const userId   = event.requestContext.authorizer.claims.sub;
    const username = event.requestContext.authorizer.claims['cognito:username'] || userId;
    const body     = JSON.parse(event.body || '{}');
    const { name } = body;

    if (!name) {
      return response.badRequest('name krävs');
    }

    // Check that the user exists
    const existing = await dynamo.send(
      new GetCommand({ TableName: TABLE, Key: { userId } })
    );

    if (!existing.Item) {
      return response.notFound('Användaren hittades inte');
    }

    // Update Cognito
    await cognito.send(
      new AdminUpdateUserAttributesCommand({
        UserPoolId: USER_POOL_ID,
        Username:   username,
        UserAttributes: [
          { Name: 'name', Value: name },
        ],
      })
    );

    // Update DynamoDB
    const result = await dynamo.send(
      new UpdateCommand({
        TableName: TABLE,
        Key: { userId },
        UpdateExpression: 'SET #name = :name, updatedAt = :updatedAt',
        ExpressionAttributeNames: { '#name': 'name' },
        ExpressionAttributeValues: {
          ':name':      name,
          ':updatedAt': new Date().toISOString(),
        },
        ReturnValues: 'ALL_NEW',
      })
    );

    return response.success({ user: result.Attributes });
  } catch (err) {
    console.error('updateUser error:', err);
    return response.serverError('Kunde inte uppdatera användare');
  }
};