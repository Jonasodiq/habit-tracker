const { analyzePatterns } = require('../analyzePatterns');
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
  [{ completionId: 'c1', habitId: 'h1', completedDate: new Date().toISOString().slice(0, 10) }]
);
result3.forEach((i) => console.log(`[${i.type}] ${i.message}`));

// Test 4: Perfect week
console.log('\n=== Test 4: Perfekt vecka ===');
const perfectCompletions = [];
['h1', 'h2'].forEach((habitId) => {
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    perfectCompletions.push({
      completionId: `${habitId}_${i}`,
      habitId,
      completedDate: d.toISOString().slice(0, 10),
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