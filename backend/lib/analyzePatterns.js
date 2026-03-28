/**
* Analyzes behavioral patterns from habits and completions.
* Returns insights sorted by priority.
 */

// Swedish weekday
const WEEKDAYS = ['Söndag', 'Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag'];
// Created once at module level and reused, not inside the function
// Källa: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/const

function analyzePatterns(habits, completions) {
  if (!habits.length || !completions.length) return [];
  // Guard clause: protects against empty data and unnecessary calculations
  // Källa: https://en.wikipedia.org/wiki/Guard_(computer_science)

  const insights = [];
  const now = new Date();
  const todayStr = now.toLocaleDateString('sv-SE'); // YYYY-MM-DD i lokal tid
  const today = new Date(todayStr + 'T12:00:00'); // Middag för att undvika DST
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  const yesterdayStr = yesterday.toLocaleDateString('sv-SE');
  // Källa DST: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date

  // ===== Help functions =====

  // Completions by habitId
  const completionsByHabit = {};
  habits.forEach((h) => completionsByHabit[h.habitId] = []);
  completions.forEach((c) => {
    if (completionsByHabit[c.habitId]) {
      completionsByHabit[c.habitId].push(c.completedDate);
    } 
  }); // Efficient lookup O(1) lookups, instead of O(n²) filters
  // Källa: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object

  // Completion rate last N days per habit (DRY principle)
  function getRate(habitId, days) {
    const since = new Date(today);
    since.setDate(today.getDate() - days);
    const sinceStr = since.toISOString().slice(0, 10);
    const count = (completionsByHabit[habitId] || []).filter((d) => d >= sinceStr).length;
    return count / days; // 0.0–1.0
    // Källa ISO-datum: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toISOString
  }

  // Unique days (data basis for analysis)
  const allDates = [...new Set(completions.map((c) => c.completedDate))];
  const totalDays = allDates.length;

 
  // === 1. Struggling with ===
  if (totalDays >= 7) {
    let weakest = null;
    let weakestRate = 1; // 1 = 100%

    habits.forEach((h) => {
      const rate = getRate(h.habitId, 30);
      const habitStreak = h.streak || 0;
    if (rate < 0.30 && rate < weakestRate && habitStreak < 5) {
        weakestRate = rate;
        weakest = h;
      }
    });

    if (weakest) {
      insights.push({
        type: 'struggling',
        priority: 1,
        habitId: weakest.habitId,
        message: `⚠️ ${weakest.icon} ${weakest.name} behöver lite extra kärlek — bara ${Math.round(weakestRate * 100)}% den senaste månaden.`,
        value: Math.round(weakestRate * 100),
      });
    }
  }

  // === 2. Comeback ===
  habits.forEach((h) => {
    const dates = completionsByHabit[h.habitId] || [];
    const doneToday     = dates.includes(todayStr);
    const doneYesterday = dates.includes(yesterdayStr);

    // Done today but NOT yesterday → comeback
    if (doneToday && !doneYesterday && dates.length >= 2) {
      insights.push({
        type: 'comeback',
        priority: 2,
        habitId: h.habitId,
        message: `🎉 Comeback! Du bröt din streak för ${h.icon} ${h.name} men är igång igen idag!`,
        value: 1,
      });
    }
  });

  // === 3. Perfect week ===
  if (totalDays >= 7) {
    const last7 = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      return d.toLocaleDateString('sv-SE');
    });

    const perfectWeek = habits.length > 0 && habits.every((h) => {
        const dates = completionsByHabit[h.habitId] || [];
        return last7.every((date) => dates.includes(date));
    });
    // Källa: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/every

    if (perfectWeek) {
      insights.push({
        type: 'perfect_week',
        priority: 3,
        habitId: null,
        message: `⭐ Perfekt vecka! Alla vanor klara 7 dagar i rad — fantastiskt jobbat!`,
        value: 7,
      });
    }
  }

  // === 4. Consistency ===
  if (totalDays >= 14) {
    const avgRate = habits.reduce((sum, h) => sum + getRate(h.habitId, 14), 0) / habits.length;
    // Källa: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce

    if (avgRate >= 0.80) {
      insights.push({
        type: 'consistency',
        priority: 4,
        habitId: null,
        message: `💪 Imponerande! Du klarar ${Math.round(avgRate * 100)}% av dina vanor de senaste 14 dagarna.`,
        value: Math.round(avgRate * 100),
      });
    }
  }

  // === 5. Improvement ===
  if (totalDays >= 14) {
    habits.forEach((h) => {
      const week1Start = new Date(today); week1Start.setDate(today.getDate() - 14);
      const week1End   = new Date(today); week1End.setDate(today.getDate() - 8);
      const week2Start = new Date(today); week2Start.setDate(today.getDate() - 7);

      const w1 = (completionsByHabit[h.habitId] || []).filter(
        (d) => d >= week1Start.toISOString().slice(0, 10) && d <= week1End.toISOString().slice(0, 10)
      ).length;
      const w2 = (completionsByHabit[h.habitId] || []).filter(
        (d) => d >= week2Start.toISOString().slice(0, 10)
      ).length;

      const diff = Math.round(((w2 - w1) / 7) * 100);
      if (diff >= 20) {
        insights.push({
          type: 'improvement',
          priority: 5,
          habitId: h.habitId,
          message: `📈 ${h.icon} ${h.name} förbättras! Upp ${diff}% jämfört med förra veckan.`,
          value: diff,
        });
      }
    });
  }

  // === 6. Best streak ===
  let bestStreakHabit = null;
  let bestStreakValue = 0;

  habits.forEach((h) => {
    const streak = h.streak || 0;
    if (streak >= 3 && streak > bestStreakValue) {
      bestStreakValue = streak;
      bestStreakHabit = h;
    }
  });

  if (bestStreakHabit) {
    insights.push({
      type: 'best_streak',
      priority: 6,
      habitId: bestStreakHabit.habitId,
      message: `🔥 ${bestStreakHabit.icon} ${bestStreakHabit.name} har en streak på ${bestStreakValue} dagar — håll i det!`,
      value: bestStreakValue,
    });
  }

  // === 7. Best day of the week ===
  if (totalDays >= 14) {
    const dayCount = [0, 0, 0, 0, 0, 0, 0]; // index 0=Söndag, 1=Måndag, ...
    completions.forEach((c) => {
      const day = new Date(c.completedDate + 'T12:00:00').getDay();
      dayCount[day]++;
    });

    const maxCount = Math.max(...dayCount); // Math.max(0,5,3,7,4,2) -> 7
    const bestDayIndex = dayCount.indexOf(maxCount);

    if (maxCount >= 3) {
      insights.push({
        type: 'best_day',
        priority: 7,
        habitId: null,
        message: `📅 Du är bäst på ${WEEKDAYS[bestDayIndex]}ar — ${maxCount} completions den dagen!`,
        // WEEKDAYS[bestDayIndex] converts index (3) to name ('Onsdag')
        value: maxCount,
      });
    }
  }

  // === 8. Most completed ===
  let mostCompletedHabit = null;
  let mostCompletedCount = 0;

  habits.forEach((h) => {
    const count = (completionsByHabit[h.habitId] || []).length;
    if (count >= 5 && count > mostCompletedCount) {
      mostCompletedCount = count;
      mostCompletedHabit = h;
    }
  });

  if (mostCompletedHabit) {
    insights.push({
      type: 'most_completed',
      priority: 8,
      habitId: mostCompletedHabit.habitId,
      message: `🏆 ${mostCompletedHabit.icon} ${mostCompletedHabit.name} är din mest trogna vana med ${mostCompletedCount} genomföranden!`,
      value: mostCompletedCount,
    });
  }

  // Sort by priority and return top 3
  return insights
    .sort((a, b) => a.priority - b.priority)
    // Källa: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort
    .slice(0, 3); // max 3 insights
}

module.exports = { analyzePatterns };