const {
  dynamo,
  QueryCommand,
} = require('../../lib/dynamodb');
const response = require('../../lib/response');
const { calculateStreak } = require('../../lib/calculateStreak');

const HABITS_TABLE      = process.env.HABITS_TABLE;
const COMPLETIONS_TABLE = process.env.COMPLETIONS_TABLE;
const USER_INDEX        = 'UserIdIndex'; // userId = PK
const USER_DATE_INDEX   = 'UserIdDateIndex'; 
// Argument: "userId + completedDate - effektiv BETWEEN-filtrering utan att scanna hela tabellen"
const HABIT_INDEX = 'HabitIdDateIndex'; // search for completions per specific habit

// GET /statistics
module.exports.getStatistics = async (event) => {
  try {
    const userId = event.requestContext.authorizer.claims.sub;

    // 1. Get all habits
    const habitsResult = await dynamo.send(
      new QueryCommand({
        TableName: HABITS_TABLE,
        IndexName: USER_INDEX,
        KeyConditionExpression: 'userId = :uid',
        ExpressionAttributeValues: { ':uid': userId },
      }),
    );
    const habits = habitsResult.Items || [];

    // 2. Get all completions for the user (last 30 days)
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30); // ex. 1 april - 30 dagar = 2 mars
    const from = thirtyDaysAgo.toISOString().slice(0, 10);
    const to   = today.toISOString().slice(0, 10);

    const completionsResult = await dynamo.send(
      new QueryCommand({
        TableName: COMPLETIONS_TABLE,
        IndexName: USER_DATE_INDEX,
        KeyConditionExpression: 'userId = :uid AND completedDate BETWEEN :from AND :to',
        // Källa BETWEEN: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Query.KeyConditionExpressions.html
        ExpressionAttributeValues: { ':uid': userId, ':from': from, ':to': to },
      }),
    );
    const allCompletions = completionsResult.Items || [];

    // 3. Calculate statistics for each habit.
    const habitStats = await Promise.all(
      habits.map(async (habit) => {
        // Completions for this habit in the last 30 days
        const habitCompletions = allCompletions.filter(
          (c) => c.habitId === habit.habitId,
        ); // Källa N+1: https://www.sqlshack.com/what-is-n1-selects-problem-in-orm-object-relational-mapping/

        // Get all completions for streak calculation
        const allHabitCompletions = await dynamo.send(
          new QueryCommand({
            TableName: COMPLETIONS_TABLE,
            IndexName: HABIT_INDEX,
            KeyConditionExpression: 'habitId = :hid',
            ExpressionAttributeValues: { ':hid': habit.habitId },
            ScanIndexForward: false,
            Limit: 90,
          }),
        ); // Källa: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Query.html#Query.Count

        const dates = (allHabitCompletions.Items || []).map((c) => c.completedDate);
        const streak = calculateStreak(dates, habit.frequency);

        // Completion percentage last 30 days
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
        }; // Källa: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/min
      }),
    );

    // 4. Aggregated statistics
    const totalCompletions  = allCompletions.length;
    const bestStreak        = Math.max(...habitStats.map((h) => h.streak), 0);
    const avgCompletionRate = habits.length > 0
      ? Math.round(habitStats.reduce((sum, h) => sum + h.completionRate, 0) / habits.length)
      : 0; // Källa reduce: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce
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