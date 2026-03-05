const { dynamo, GetCommand } = require('../../../lib/dynamodb');
const response = require('../../../lib/response');

const TABLE = process.env.USERS_TABLE;

// GET /auth/users/me
module.exports.getUser = async (event) => {
  try {
    const userId = event.requestContext.authorizer.claims.sub;

    const result = await dynamo.send(
      new GetCommand({
        TableName: TABLE,
        Key: { userId },
      }),
    );

    if (!result.Item) {
      return response.notFound('Användaren hittades inte');
    }

    return response.success({ user: result.Item });
  } catch (err) {
    console.error('getUser error:', err);
    return response.serverError('Kunde inte hämta användare');
  }
};