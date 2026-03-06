const {
  dynamo,
  QueryCommand,
} = require('../../lib/dynamodb');
const response = require('../../lib/response');
const { calculateStreak } = require('../../lib/calculateStreak');

const HABITS_TABLE      = process.env.HABITS_TABLE;
const COMPLETIONS_TABLE = process.env.COMPLETIONS_TABLE;
const USER_INDEX        = 'UserIdIndex';
const USER_DATE_INDEX   = 'UserIdDateIndex';
const HABIT_INDEX       = 'HabitIdDateIndex';

// GET /statistics
module.exports.getStatistics = async (event) => {
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

    // 2. Hämta alla completions för användaren (senaste 30 dagarna)
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    const from = thirtyDaysAgo.toISOString().slice(0, 10);
    const to   = today.toISOString().slice(0, 10);

    const completionsResult = await dynamo.send(
      new QueryCommand({
        TableName: COMPLETIONS_TABLE,
        IndexName: USER_DATE_INDEX,
        KeyConditionExpression: 'userId = :uid AND completedDate BETWEEN :from AND :to',
        ExpressionAttributeValues: { ':uid': userId, ':from': from, ':to': to },
      }),
    );
    const allCompletions = completionsResult.Items || [];

    // 3. Beräkna statistik per vana
    const habitStats = await Promise.all(
      habits.map(async (habit) => {
        // Completions för denna vana senaste 30 dagarna
        const habitCompletions = allCompletions.filter(
          (c) => c.habitId === habit.habitId,
        );

        // Hämta alla completions för streak-beräkning
        const allHabitCompletions = await dynamo.send(
          new QueryCommand({
            TableName: COMPLETIONS_TABLE,
            IndexName: HABIT_INDEX,
            KeyConditionExpression: 'habitId = :hid',
            ExpressionAttributeValues: { ':hid': habit.habitId },
            ScanIndexForward: false,
            Limit: 90,
          }),
        );

        const dates = (allHabitCompletions.Items || []).map((c) => c.completedDate);
        const streak = calculateStreak(dates, habit.frequency);

        // Completion-procent senaste 30 dagarna
        const completionRate = Math.round((habitCompletions.length / 30) * 100);

        return {
          habitId:        habit.habitId,
          name:           habit.name,
          icon:           habit.icon,
          color:          habit.color,
          frequency:      habit.frequency,
          streak:         streak,
          completions30d: habitCompletions.length,
          completionRate: Math.min(completionRate, 100),
        };
      }),
    );

    // 4. Aggregerad statistik
    const totalCompletions  = allCompletions.length;
    const bestStreak        = Math.max(...habitStats.map((h) => h.streak), 0);
    const avgCompletionRate = habits.length > 0
      ? Math.round(habitStats.reduce((sum, h) => sum + h.completionRate, 0) / habits.length)
      : 0;
    const todayStr          = today.toISOString().slice(0, 10);
    const completedToday    = allCompletions.filter((c) => c.completedDate === todayStr).length;

    return response.success({
      summary: {
        totalHabits:      habits.length,
        totalCompletions,
        completedToday,
        bestStreak,
        avgCompletionRate,
        periodDays: 30,
      },
      habits: habitStats,
    });
  } catch (err) {
    console.error('getStatistics error:', err);
    return response.serverError('Kunde inte hämta statistik');
  }
};