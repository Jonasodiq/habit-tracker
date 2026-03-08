const {
  dynamo,
  QueryCommand,
} = require('../../lib/dynamodb');
const response = require('../../lib/response');
const { analyzePatterns } = require('../../lib/analyzePatterns');
const { calculateStreak } = require('../../lib/calculateStreak');

const HABITS_TABLE      = process.env.HABITS_TABLE;
const COMPLETIONS_TABLE = process.env.COMPLETIONS_TABLE;
const USER_INDEX        = 'UserIdIndex';
const USER_DATE_INDEX   = 'UserIdDateIndex';
const HABIT_INDEX       = 'HabitIdDateIndex';

// GET /insights
module.exports.getInsights = async (event) => {
  try {
    const userId = event.requestContext.authorizer.claims.sub;

    // 1. Hämta alla vanor
    const habitsResult = await dynamo.send(
      new QueryCommand({
        TableName: HABITS_TABLE,
        IndexName: USER_INDEX,
        KeyConditionExpression: 'userId = :uid',
        ExpressionAttributeValues: { ':uid': userId },
      }),
    );
    const habits = habitsResult.Items || [];

    if (habits.length === 0) {
      return response.success({
        insights: [],
        message: 'Skapa vanor för att få personliga insikter!',
      });
    }

    // 2. Hämta completions senaste 30 dagarna
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    const from = thirtyDaysAgo.toLocaleDateString('sv-SE');
    const to   = today.toLocaleDateString('sv-SE');

    const completionsResult = await dynamo.send(
      new QueryCommand({
        TableName: COMPLETIONS_TABLE,
        IndexName: USER_DATE_INDEX,
        KeyConditionExpression: 'userId = :uid AND completedDate BETWEEN :from AND :to',
        ExpressionAttributeValues: { ':uid': userId, ':from': from, ':to': to },
        ScanIndexForward: false,
      }),
    );
    const completions = completionsResult.Items || [];

    // 3. Beräkna streak per vana och lägg till på habit-objektet
    const habitsWithStreak = await Promise.all(
      habits.map(async (habit) => {
        const result = await dynamo.send(
          new QueryCommand({
            TableName: COMPLETIONS_TABLE,
            IndexName: HABIT_INDEX,
            KeyConditionExpression: 'habitId = :hid',
            ExpressionAttributeValues: { ':hid': habit.habitId },
            ScanIndexForward: false,
            Limit: 90,
          }),
        );
        const dates = (result.Items || []).map((c) => c.completedDate);
        const streak = calculateStreak(dates, habit.frequency);
        return { ...habit, streak };
      }),
    );

    // 4. Kör analyzePatterns
    const insights = analyzePatterns(habitsWithStreak, completions);

    // 5. Bygg svar med metadata
    const enrichedInsights = insights.map((insight, index) => ({
      id:       `insight_${index + 1}`,
      type:     insight.type,
      message:  insight.message,
      habitId:  insight.habitId || null,
      value:    insight.value,
      priority: insight.priority,
    }));

    return response.success({
      insights: enrichedInsights,
      generatedAt: new Date().toISOString(),
      dataPoints: completions.length,
      habitsAnalyzed: habits.length,
    });
  } catch (err) {
    console.error('getInsights error:', err);
    return response.serverError('Kunde inte generera insikter');
  }
};