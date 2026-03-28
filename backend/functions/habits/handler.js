const { calculateStreak } = require('../../lib/calculateStreak');
const { QueryCommand: CompletionQueryCommand } = require('../../lib/dynamodb');
const { randomUUID } = require('crypto'); // Källa: https://nodejs.org/api/crypto.html#cryptorandomuuidoptions
// Argument: "Inbyggd modul kräver inget extra npm-paket och är säkrare än Math.random()-baserade ID:n som kan kollidera"
const { dynamo, PutCommand, GetCommand, UpdateCommand, DeleteCommand, QueryCommand } = require('../../lib/dynamodb');
const response = require('../../lib/response');

const TABLE = process.env.HABITS_TABLE;
const USER_INDEX = 'UserIdIndex';


// POST /habits
module.exports.createHabit = async (event) => {
  try {
    const userId = event.requestContext.authorizer.claims.sub;
    // Källa: https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-integrate-with-cognito.html
    const body = JSON.parse(event.body || '{}');
    const { name, description, color, icon, frequency } = body;

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
      frequency: frequency || 'daily',
      isActive: true,
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

    // 1. Get all habits
    const habitsResult = await dynamo.send(
      new QueryCommand({
        TableName: TABLE,
        IndexName: USER_INDEX,
        KeyConditionExpression: 'userId = :uid',
        ExpressionAttributeValues: { ':uid': userId },
        ScanIndexForward: false, // sorts newest-first
      }),
    );

    const habits = habitsResult.Items || [];

    // 2. Calculate streak for each habit in parallel
    const habitsWithStreak = await Promise.all( 
      // Källa: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all
      habits.map(async (habit) => {
        const completions = await dynamo.send(
          new CompletionQueryCommand({
            TableName: process.env.COMPLETIONS_TABLE,
            IndexName: 'HabitIdDateIndex',
            KeyConditionExpression: 'habitId = :hid',
            ExpressionAttributeValues: { ':hid': habit.habitId },
            ScanIndexForward: false,
            Limit: 90, // Max 90 dagar bakåt
          }),
        );

        const dates = (completions.Items || []).map((c) => c.completedDate);
        const streak = calculateStreak(dates, habit.frequency);

        return { ...habit, streak };
      }),
    );

    return response.success({ habits: habitsWithStreak });
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
    const { name, description, color, icon, frequency,isActive } = body;

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
    if (frequency !== undefined) updates.frequency = frequency;
    if (isActive !== undefined) updates.isActive = isActive;

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

    // 1. Verify that the habit exists and is owned by the user
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

    // 2. Get all related completions
    const completions = await dynamo.send(
      new QueryCommand({
        TableName: process.env.COMPLETIONS_TABLE,
        IndexName: 'HabitIdDateIndex',
        KeyConditionExpression: 'habitId = :hid',
        ExpressionAttributeValues: { ':hid': habitId },
      }),
    );

    // 3. Delete all completions
    if (completions.Items && completions.Items.length > 0) {
      await Promise.all(
        completions.Items.map((item) =>
          dynamo.send(
            new DeleteCommand({
              TableName: process.env.COMPLETIONS_TABLE,
              Key: { completionId: item.completionId },
            }),
          ),
        ),
      );
    }

    // 4. Delete the habit
    await dynamo.send(
      new DeleteCommand({
        TableName: TABLE,
        Key: { habitId },
      }),
    );

    return response.success({
      message: 'Vana raderad',
      habitId,
      deletedCompletions: completions.Items?.length ?? 0,
    });
  } catch (err) {
    console.error('deleteHabit error:', err);
    return response.serverError('Kunde inte radera vana');
  }
};
