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

    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD ISO 8601
    // https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/HowItWorks.NamingRulesDataTypes.html

    const existing = await dynamo.send(
      new QueryCommand({
        TableName: TABLE,
        IndexName: HABIT_INDEX, // Källa GSI: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/GSI.html
        KeyConditionExpression: 'habitId = :hid AND completedDate = :date',
        ExpressionAttributeValues: { ':hid': habitId, ':date': today },
        Limit: 1, // Argument: "Limit: 1 minimerar dataöverföring och kostnad i DynamoDB, DynamoDB slutar söka direkt när den hittar ett resultat — effektivt"
                  // Källa: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Query.html
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

// GET /completions?habitId=xxx&from=2024-01-01&to=2024-12-31
module.exports.getCompletions = async (event) => {
  try {
    const userId = event.requestContext.authorizer.claims.sub;
    const { habitId, from, to } = event.queryStringParameters || {};

    let result;

    if (habitId) {
      // Get completions for specific habit
      const params = {
        TableName: TABLE,
        IndexName: HABIT_INDEX,
        KeyConditionExpression: from && to
          ? 'habitId = :hid AND completedDate BETWEEN :from AND :to'
          : 'habitId = :hid',
        ExpressionAttributeValues: {
          ':hid': habitId,
          ...(from && to ? { ':from': from, ':to': to } : {}),
        },
        ScanIndexForward: false,
      };
      result = await dynamo.send(new QueryCommand(params));
    } else {
      // Get all completions for the user
      const params = {
        TableName: TABLE,
        IndexName: USER_INDEX,
        KeyConditionExpression: from && to
          ? 'userId = :uid AND completedDate BETWEEN :from AND :to'
          : 'userId = :uid',
        ExpressionAttributeValues: {
          ':uid': userId,
          ...(from && to ? { ':from': from, ':to': to } : {}),
        },
        ScanIndexForward: false,
      };
      result = await dynamo.send(new QueryCommand(params));
    }
     /*
      if (habitId) {
        // Sök på specifik vana via HABIT_INDEX
      } else {
        // Sök på alla användarens completions via USER_INDEX
      }
        Argument: Samma endpoint hanterar två olika användningsfall beroende på om habitId skickas med eller inte.
        Minskar antalet endpoints i API:t.
    */

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

    // Autentisering
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
