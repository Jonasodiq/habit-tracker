const { randomUUID } = require('crypto');
const {
  dynamo,
  PutCommand,
  GetCommand,
  DeleteCommand,
  QueryCommand,
} = require('../../lib/dynamodb');
const response = require('../../lib/response');

const TABLE = process.env.COMPLETIONS_TABLE;
const USER_INDEX = 'UserIdDateIndex';
const HABIT_INDEX = 'HabitIdDateIndex';

// POST /completions. Body: { habitId }
module.exports.completeHabit = async (event) => {
  try {
    const userId = event.requestContext.authorizer.claims.sub;
    const body = JSON.parse(event.body || '{}');
    const { habitId } = body;

    if (!habitId) {
      return response.badRequest('habitId krävs');
    }

    const today = new Date().toISOString().slice(0, 10);

    const existing = await dynamo.send(
      new QueryCommand({
        TableName: TABLE,
        IndexName: HABIT_INDEX,
        KeyConditionExpression: 'habitId = :hid AND completedDate = :date',
        ExpressionAttributeValues: { ':hid': habitId, ':date': today },
        Limit: 1,
      }),
    );

    if (existing.Items && existing.Items.length > 0) {
      return response.success({
        message: 'Redan markerad idag',
        completion: existing.Items[0],
      });
    }

    const item = {
      completionId: randomUUID(),
      userId: userId,
      habitId: habitId,
      completedDate: today,
      createdAt: new Date().toISOString(),
    };

    await dynamo.send(new PutCommand({ TableName: TABLE, Item: item }));

    return response.created({ completion: item });
  } catch (err) {
    console.error('completeHabit error:', err);
    return response.serverError('Kunde inte markera vana');
  }
};

// GET /completions
module.exports.getCompletions = async (event) => {
  try {
    const userId = event.requestContext.authorizer.claims.sub;

    const result = await dynamo.send(
      new QueryCommand({
        TableName: TABLE,
        IndexName: USER_INDEX,
        KeyConditionExpression: 'userId = :uid',
        ExpressionAttributeValues: { ':uid': userId },
        ScanIndexForward: false,
      }),
    );

    return response.success({ completions: result.Items });
  } catch (err) {
    console.error('getCompletions error:', err);
    return response.serverError('Kunde inte hämta completions');
  }
};

// DELETE /completions/{completionId}
module.exports.deleteCompletion = async (event) => {
  try {
    const userId = event.requestContext.authorizer.claims.sub;
    const { completionId } = event.pathParameters;

    if (!completionId) {
      return response.badRequest('completionId krävs');
    }

    const existing = await dynamo.send(
      new GetCommand({
        TableName: TABLE,
        Key: { completionId },
      }),
    );

    if (!existing.Item) {
      return response.notFound('Completion hittades inte');
    }

    if (existing.Item.userId !== userId) {
      return response.badRequest('Du äger inte denna completion');
    }

    await dynamo.send(
      new DeleteCommand({
        TableName: TABLE,
        Key: { completionId },
      }),
    );

    return response.success({ message: 'Completion raderad', completionId });
  } catch (err) {
    console.error('deleteCompletion error:', err);
    return response.serverError('Kunde inte radera completion');
  }
};
