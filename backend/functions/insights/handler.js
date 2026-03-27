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
Argument: " 1 API-anrop per användare per dag istället för varje sidladdning. Caching minskar kostnaden"

// === Get cache ===
async function getCachedInsights(userId) {
  try {
    const result = await dynamo.send(
      new GetCommand({ TableName: CACHE_TABLE, Key: { userId } })
    );
    if (!result.Item) return null;

    const now = Math.floor(Date.now() / 1000); // Källa Unix-time: https://en.wikipedia.org/wiki/Unix_time
    if (result.Item.ttl < now) return null; // Källa DynamoDB TTL: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/TTL.html

    return result.Item.insights;
  } catch (err) {
    console.error('Cache read error:', err);
    return null;
  }
}

// === Save cache ===
async function cacheInsights(userId, insights) {
  try {
    const ttl = Math.floor(Date.now() / 1000) + CACHE_TTL_HOURS * 3600; // Converts 24 hours to seconds
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

// === Bygg prompt för Claude  === 
function buildPrompt(habits, completions) {
  const today = new Date().toLocaleDateString('sv-SE');
  const completedToday = completions.filter((c) => c.completedDate === today).length;

  const streaksText = habits
    .map((h) => `- ${h.icon} ${h.name}: ${h.streak || 0} dagar i rad (${h.frequency})`)
    .join('\n'); // line breaks
    // Källa: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map

  const totalCompletions = completions.length;
  const avgPerDay = habits.length > 0
    ? Math.round((totalCompletions / 30) * 10) / 10 // round ex. 2.3
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
  // Källa prompt engineering: https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview

// === Call Claude API  === 
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
  return data.content[0].text; // https://platform.claude.com/docs/en/api/messages
}

// === GET /insights  === 
module.exports.getInsights = async (event) => {
  try {
    console.log('EVENT:', JSON.stringify(event));
    console.log('REQUEST CONTEXT:', JSON.stringify(event.requestContext));
    
    const userId = event.requestContext.authorizer.claims.sub;

    // 1. Check cache
    const cached = await getCachedInsights(userId);
    if (cached) {
      return response.success({ ...cached, fromCache: true });
    } // Källa spread: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax

    // 2. Get habits
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

    // 3. Get completions (last 30 days)
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

    // 4. Calculate the amount for each habit
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

    // 5. Call Claude, fallback to analyzePatterns
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
    } // Källa resilience patterns: https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/resiliency-and-the-components-of-reliability.html

    const result = {
      type: source,
      aiInsight,
      fallbackInsights,
      generatedAt: new Date().toISOString(),
      dataPoints: completions.length,
      habitsAnalyzed: habits.length,
      fromCache: false,
    };

    // 6. Cacha result
    await cacheInsights(userId, result);

    return response.success(result);
  } catch (err) {
    console.error('getInsights error:', err);
    return response.serverError('Kunde inte generera insikter');
  }
};

// POST /insights/tips
module.exports.getHabitTips = async (event) => {
  try {
    const userId = event.requestContext.authorizer.claims.sub;
    const body   = JSON.parse(event.body || '{}');
    const { habitName, habitIcon, habitFrequency } = body;

    if (!habitName) {
      return response.badRequest('habitName krävs');
    }

    const prompt = `Du är en motiverande coach. En användare kämpar med vanan "${habitIcon} ${habitName}" (${habitFrequency}).

    Ge 3 konkreta, praktiska tips på svenska för att förbättra denna vana.

    Format:
    1. [Tips rubrik]: [Förklaring på 1-2 meningar]
    2. [Tips rubrik]: [Förklaring på 1-2 meningar]  
    3. [Tips rubrik]: [Förklaring på 1-2 meningar]

    Avsluta med en kort motiverande mening. Max 150 ord totalt.`;

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':    'application/json',
        'x-api-key':       ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model:      'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages:   [{ role: 'user', content: prompt }],
      }),
    });

    if (!res.ok) {
      throw new Error(`Claude API error: ${res.status}`);
    }

    const data = await res.json();
    const tips = data.content[0].text;

    return response.success({ tips, habitName });
  } catch (err) {
    console.error('getHabitTips error:', err);
    return response.serverError('Kunde inte generera tips');
  }
};