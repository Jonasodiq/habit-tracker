const { analyzePatterns } = require('../analyzePatterns');
const { getCurrentDateKey, shiftDateKey } = require('../date');
const { testData } = require('./testInsightsData');

// Test 1: Normal dataset
console.log('\n=== Test 1: Normal dataset ===');
const result1 = analyzePatterns(testData.habits, testData.completions);
result1.forEach((i) => console.log(`[${i.type}] ${i.message}`));

// Test 2: Empty data
console.log('\n=== Test 2: Tom data ===');
const result2 = analyzePatterns([], []);
console.log('Insikter:', result2.length, '(förväntat: 0)');

// Test 3: Too little data (below thresholds)
console.log('\n=== Test 3: För lite data ===');
const result3 = analyzePatterns(
  [{ habitId: 'h1', name: 'Träna', icon: '💪', color: '#FF6B6B', frequency: 'daily', streak: 2 }],
  [{ completionId: 'c1', habitId: 'h1', completedDate: getCurrentDateKey() }]
);
result3.forEach((i) => console.log(`[${i.type}] ${i.message}`));

// Test 4: Perfect week
console.log('\n=== Test 4: Perfekt vecka ===');
const perfectCompletions = [];
['h1', 'h2'].forEach((habitId) => {
  for (let i = 0; i < 7; i++) {
    perfectCompletions.push({
      completionId: `${habitId}_${i}`,
      habitId,
      completedDate: shiftDateKey(getCurrentDateKey(), -i),
    });
  }
});
const result4 = analyzePatterns(
  [
    { habitId: 'h1', name: 'Träna', icon: '💪', color: '#FF6B6B', frequency: 'daily', streak: 7 },
    { habitId: 'h2', name: 'Läsa', icon: '📚', color: '#4ECDC4', frequency: 'daily', streak: 7 },
  ],
  perfectCompletions
);
result4.forEach((i) => console.log(`[${i.type}] ${i.message}`));

// Test 5: Mixed frequencies should still allow perfect week
console.log('\n=== Test 5: Perfekt vecka med weekly/monthly ===');
const mixedFrequencyResult = analyzePatterns(
  [
    { habitId: 'h1', name: 'Träna', icon: '💪', color: '#FF6B6B', frequency: 'daily', streak: 7 },
    { habitId: 'h2', name: 'Planera', icon: '🗓️', color: '#4ECDC4', frequency: 'weekly', streak: 2 },
    { habitId: 'h3', name: 'Budget', icon: '💸', color: '#45B7D1', frequency: 'monthly', streak: 1 },
  ],
  [
    ...Array.from({ length: 7 }, (_, i) => ({
      completionId: `daily_${i}`,
      habitId: 'h1',
      completedDate: shiftDateKey(getCurrentDateKey(), -i),
    })),
    {
      completionId: 'weekly_1',
      habitId: 'h2',
      completedDate: shiftDateKey(getCurrentDateKey(), -2),
    },
  ],
);
mixedFrequencyResult.forEach((i) => console.log(`[${i.type}] ${i.message}`));

// Test 6: Weekly comeback
console.log('\n=== Test 6: Weekly comeback ===');
const weeklyComebackResult = analyzePatterns(
  [
    { habitId: 'h1', name: 'Veckoplanera', icon: '📝', color: '#FF6B6B', frequency: 'weekly', streak: 1 },
  ],
  [
    {
      completionId: 'old_week',
      habitId: 'h1',
      completedDate: shiftDateKey(getCurrentDateKey(), -15),
    },
    {
      completionId: 'current_week',
      habitId: 'h1',
      completedDate: shiftDateKey(getCurrentDateKey(), -2),
    },
  ],
);
weeklyComebackResult.forEach((i) => console.log(`[${i.type}] ${i.message}`));

// Test
// node lib/testAnalyzePatterns.js

/**
=== Test 1: Normal dataset ===
    [struggling] ⚠️ 📚 Läsa behöver lite extra kärlek — bara 17% den senaste månaden.
    [comeback] 🎉 Comeback! Du bröt din streak för 📚 Läsa men är igång igen idag!
    [comeback] 🎉 Comeback! Du bröt din streak för 🧘 Meditation men är igång igen idag!

Normal dataset✅ struggling korrekt
Normal dataset✅ comeback korrekt

=== Test 2: Empty data ===
    Insikter: 0 (förväntat: 0)

Empty data✅ 0 insikter

=== Test 3: Too little data ===

Too little data✅ Inga insikter (under tröskel)

=== Test 4: Perfect week ===
    [perfect_week] ⭐ Perfekt vecka! Alla vanor klara 7 dagar i rad — fantastiskt jobbat!
    [best_streak] 🔥 💪 Träna har en streak på 7 dagar — håll i det!
    [most_completed] 🏆 💪 Träna är din mest trogna vana med 7 genomföranden!

Perfect week✅ perfect_week + best_streak + most_completed
 */
