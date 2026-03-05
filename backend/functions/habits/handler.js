const { randomUUID } = require('crypto');
const {
  dynamo,
  PutCommand,
  GetCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
} = require('../../lib/dynamodb');
const response = require('../../lib/response');

const TABLE = process.env.HABITS_TABLE;
const USER_INDEX = 'UserIdIndex';


// POST /habits
module.exports.createHabit = async (event) => {
  try {
    const userId = event.requestContext.authorizer.claims.sub;
    const body = JSON.parse(event.body || '{}');
    const { name, description, color, icon } = body;

    if (!name) {
      return response.badRequest('name krävs');
    }

    const item = {
      habitId: randomUUID(),
      userId: userId,
      name: name,
      description: description || '',
      color: color || '#6C63FF',
      icon: icon || '⭐',
      createdAt: new Date().toISOString(),
    };

    await dynamo.send(new PutCommand({ TableName: TABLE, Item: item }));

    return response.created({ habit: item });
  } catch (err) {
    console.error('createHabit error:', err);
    return response.serverError('Kunde inte skapa vana');
  }
};

// GET /habits
module.exports.getHabits = async (event) => {
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

    return response.success({ habits: result.Items });
  } catch (err) {
    console.error('getHabits error:', err);
    return response.serverError('Kunde inte hämta vanor');
  }
};

// PATCH /habits/{habitId}
module.exports.updateHabit = async (event) => {
  try {
    const userId = event.requestContext.authorizer.claims.sub;
    const { habitId } = event.pathParameters;
    const body = JSON.parse(event.body || '{}');
    const { name, description, color, icon } = body;

    if (!habitId) {
      return response.badRequest('habitId krävs');
    }

    const existing = await dynamo.send(
      new GetCommand({
        TableName: TABLE,
        Key: { habitId },
      }),
    );

    if (!existing.Item) {
      return response.notFound('Vanan hittades inte');
    }

    if (existing.Item.userId !== userId) {
      return response.badRequest('Du äger inte denna vana');
    }

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (color !== undefined) updates.color = color;
    if (icon !== undefined) updates.icon = icon;

    if (Object.keys(updates).length === 0) {
      return response.badRequest('Inga fält att uppdatera');
    }

    const setExpressions = Object.keys(updates).map((k) => `#${k} = :${k}`);
    const expressionNames = Object.fromEntries(
      Object.keys(updates).map((k) => [`#${k}`, k]),
    );
    const expressionValues = Object.fromEntries(
      Object.keys(updates).map((k) => [`:${k}`, updates[k]]),
    );

    const result = await dynamo.send(
      new UpdateCommand({
        TableName: TABLE,
        Key: { habitId },
        UpdateExpression: `SET ${setExpressions.join(', ')}`,
        ExpressionAttributeNames: expressionNames,
        ExpressionAttributeValues: expressionValues,
        ReturnValues: 'ALL_NEW',
      }),
    );

    return response.success({ habit: result.Attributes });
  } catch (err) {
    console.error('updateHabit error:', err);
    return response.serverError('Kunde inte uppdatera vana');
  }
};

// DELETE /habits/{habitId}
module.exports.deleteHabit = async (event) => {
  try {
    const userId = event.requestContext.authorizer.claims.sub;
    const { habitId } = event.pathParameters;

    if (!habitId) {
      return response.badRequest('habitId krävs');
    }

    const existing = await dynamo.send(
      new GetCommand({
        TableName: TABLE,
        Key: { habitId },
      }),
    );

    if (!existing.Item) {
      return response.notFound('Vanan hittades inte');
    }

    if (existing.Item.userId !== userId) {
      return response.badRequest('Du äger inte denna vana');
    }

    await dynamo.send(
      new DeleteCommand({
        TableName: TABLE,
        Key: { habitId },
      }),
    );

    return response.success({ message: 'Vana raderad', habitId });
  } catch (err) {
    console.error('deleteHabit error:', err);
    return response.serverError('Kunde inte radera vana');
  }
};
