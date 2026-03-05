const { dynamo, GetCommand, UpdateCommand } = require('../../../lib/dynamodb');
const response = require('../../../lib/response');

const TABLE = process.env.USERS_TABLE;

// PATCH /auth/users/me
module.exports.updateUser = async (event) => {
  try {
    const userId = event.requestContext.authorizer.claims.sub;
    const body = JSON.parse(event.body || '{}');
    const { name } = body;

    if (!name) {
      return response.badRequest('name krävs');
    }

    // Kontrollera att användaren finns
    const existing = await dynamo.send(
      new GetCommand({
        TableName: TABLE,
        Key: { userId },
      }),
    );

    if (!existing.Item) {
      return response.notFound('Användaren hittades inte');
    }

    // Uppdatera namn
    const result = await dynamo.send(
      new UpdateCommand({
        TableName: TABLE,
        Key: { userId },
        UpdateExpression: 'SET #name = :name, updatedAt = :updatedAt',
        ExpressionAttributeNames: { '#name': 'name' },
        ExpressionAttributeValues: {
          ':name': name,
          ':updatedAt': new Date().toISOString(),
        },
        ReturnValues: 'ALL_NEW',
      }),
    );

    return response.success({ user: result.Attributes });
  } catch (err) {
    console.error('updateUser error:', err);
    return response.serverError('Kunde inte uppdatera användare');
  }
};