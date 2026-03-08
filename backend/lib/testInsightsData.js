// Testdata för att verifiera insiktsalgoritmen
const testData = {
  habits: [
    { habitId: 'h1', name: 'Träna', icon: '💪', color: '#FF6B6B', frequency: 'daily' },
    { habitId: 'h2', name: 'Läsa', icon: '📚', color: '#4ECDC4', frequency: 'daily' },
    { habitId: 'h3', name: 'Meditation', icon: '🧘', color: '#45B7D1', frequency: 'daily' },
  ],
  // Scenario 1: h1 stark, h2 svag, h3 medel
  completions: [
    // Träna — 25/30 dagar (83%) — streak 10
    ...Array.from({ length: 25 }, (_, i) => ({
      completionId: `c1_${i}`,
      habitId: 'h1',
      completedDate: new Date(Date.now() - i * 86400000).toISOString().slice(0, 10),
    })),
    // Läsa — 5/30 dagar (17%) — streak 1
    ...Array.from({ length: 5 }, (_, i) => ({
      completionId: `c2_${i}`,
      habitId: 'h2',
      completedDate: new Date(Date.now() - i * 6 * 86400000).toISOString().slice(0, 10),
    })),
    // Meditation — 15/30 dagar (50%) — streak 3
    ...Array.from({ length: 15 }, (_, i) => ({
      completionId: `c3_${i}`,
      habitId: 'h3',
      completedDate: new Date(Date.now() - i * 2 * 86400000).toISOString().slice(0, 10),
    })),
  ],
};

// Förväntade insikter med testdata:
// 1. struggling  → Läsa (17%)
// 2. consistency → Träna (83%)
// 3. best_streak → Träna (10 dagar)

module.exports = { testData };