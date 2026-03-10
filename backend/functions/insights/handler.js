const { dynamo, QueryCommand, PutCommand, GetCommand } = require('../../lib/dynamodb');
const response = require('../../lib/response');
const { analyzePatterns } = require('../../lib/analyzePatterns');
const { calculateStreak } = require('../../lib/calculateStreak');

const HABITS_TABLE      = process.env.HABITS_TABLE;
const COMPLETIONS_TABLE = process.env.COMPLETIONS_TABLE;
const CACHE_TABLE       = process.env.INSIGHTS_CACHE_TABLE;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const USER_INDEX        = 'UserIdIndex';
const HABIT_INDEX       = 'HabitIdDateIndex';

const CACHE_TTL_HOURS = 24;

// ─────────────────────────────────────────────
// Hämta cache
// ─────────────────────────────────────────────
async function getCachedInsights(userId) {
  try {
    const result = await dynamo.send(
      new GetCommand({ TableName: CACHE_TABLE, Key: { userId } })
    );
    if (!result.Item) return null;

    const now = Math.floor(Date.now() / 1000);
    if (result.Item.ttl < now) return null;

    return result.Item.insights;
  } catch (err) {
    console.error('Cache read error:', err);
    return null;
  }
}

// ─────────────────────────────────────────────
// Spara cache
// ─────────────────────────────────────────────
async function cacheInsights(userId, insights) {
  try {
    const ttl = Math.floor(Date.now() / 1000) + CACHE_TTL_HOURS * 3600;
    await dynamo.send(
      new PutCommand({
        TableName: CACHE_TABLE,
        Item: { userId, insights, ttl, cachedAt: new Date().toISOString() },
      })
    );
  } catch (err) {
    console.error('Cache write error:', err);
  }
}

// ─────────────────────────────────────────────
// Bygg prompt för Claude
// ─────────────────────────────────────────────
function buildPrompt(habits, completions) {
  const today = new Date().toLocaleDateString('sv-SE');
  const completedToday = completions.filter((c) => c.completedDate === today).length;

  const streaksText = habits
    .map((h) => `- ${h.icon} ${h.name}: ${h.streak || 0} dagar i rad (${h.frequency})`)
    .join('\n');

  const totalCompletions = completions.length;
  const avgPerDay = habits.length > 0
    ? Math.round((totalCompletions / 30) * 10) / 10
    : 0;

  return `Du är en motiverande coach som hjälper människor bygga bättre vanor. Analysera följande data och ge personliga insikter på svenska.

DATA:
- Antal vanor: ${habits.length}
- Genomförda idag: ${completedToday} av ${habits.length}
- Totala genomföranden senaste 30 dagarna: ${totalCompletions}
- Snitt per dag: ${avgPerDay}

VANOR OCH STREAKS:
${streaksText}

Ge 3 korta personliga insikter:
1. Vad som går bra (specifik vana om möjligt)
2. Konkret förbättringstips (nämn svagaste vanan)
3. Motiverande avslutning

Skriv på svenska, var vänlig och personlig. Max 120 ord totalt. Använd emojis sparsamt.`;
}

// ─────────────────────────────────────────────
// Anropa Claude API
// ─────────────────────────────────────────────
async function callClaude(habits, completions) {
  const prompt = buildPrompt(habits, completions);

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Claude API error: ${res.status} - ${err.error?.message || res.statusText}`);
  }

  const data = await res.json();
  return data.content[0].text;
}

// ─────────────────────────────────────────────
// GET /insights
// ─────────────────────────────────────────────
module.exports.getInsights = async (event) => {
  try {
    console.log('EVENT:', JSON.stringify(event));
    console.log('REQUEST CONTEXT:', JSON.stringify(event.requestContext));
    
    const userId = event.requestContext.authorizer.claims.sub;

    // 1. Kolla cache
    const cached = await getCachedInsights(userId);
    if (cached) {
      return response.success({ ...cached, fromCache: true });
    }

    // 2. Hämta habits
    const habitsResult = await dynamo.send(
      new QueryCommand({
        TableName: HABITS_TABLE,
        IndexName: USER_INDEX,
        KeyConditionExpression: 'userId = :uid',
        ExpressionAttributeValues: { ':uid': userId },
      })
    );
    const habits = habitsResult.Items || [];

    if (habits.length === 0) {
      return response.success({
        type: 'empty',
        aiInsight: null,
        fallbackInsights: [],
        message: 'Skapa vanor för att få personliga insikter!',
        fromCache: false,
      });
    }

    // 3. Hämta completions (senaste 30 dagar)
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    const from = thirtyDaysAgo.toLocaleDateString('sv-SE');
    const to   = today.toLocaleDateString('sv-SE');

    const completionsResult = await dynamo.send(
      new QueryCommand({
        TableName: COMPLETIONS_TABLE,
        IndexName: 'UserIdDateIndex',
        KeyConditionExpression: 'userId = :uid AND completedDate BETWEEN :from AND :to',
        ExpressionAttributeValues: { ':uid': userId, ':from': from, ':to': to },
        ScanIndexForward: false,
      })
    );
    const completions = completionsResult.Items || [];

    // 4. Beräkna streaks per vana
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
          })
        );
        const dates = (result.Items || []).map((c) => c.completedDate);
        return { ...habit, streak: calculateStreak(dates, habit.frequency) };
      })
    );

    // 5. Försök anropa Claude, fallback till analyzePatterns
    let aiInsight = null;
    let fallbackInsights = [];
    let source = 'claude';

    try {
      aiInsight = await callClaude(habitsWithStreak, completions);
    } catch (err) {
      console.error('Claude API failed, using fallback:', err.message);
      source = 'rules';
      fallbackInsights = analyzePatterns(habitsWithStreak, completions).map((i) => ({
        id:      i.type,
        type:    i.type,
        message: i.message,
        value:   i.value,
      }));
    }

    const result = {
      type: source,
      aiInsight,
      fallbackInsights,
      generatedAt: new Date().toISOString(),
      dataPoints: completions.length,
      habitsAnalyzed: habits.length,
      fromCache: false,
    };

    // 6. Cacha resultatet
    await cacheInsights(userId, result);

    return response.success(result);
  } catch (err) {
    console.error('getInsights error:', err);
    return response.serverError('Kunde inte generera insikter');
  }
};