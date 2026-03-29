/**
* Analyzes behavioral patterns from habits and completions.
* Returns insights sorted by priority.
 */

const { getCurrentDateKey, shiftDateKey, shiftMonthKey } = require('./date');

// Swedish weekday
const WEEKDAYS = ['Söndag', 'Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag'];
// Created once at module level and reused, not inside the function
// Källa: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/const

function analyzePatterns(habits, completions) {
  if (!habits.length || !completions.length) return [];
  // Guard clause: protects against empty data and unnecessary calculations
  // Källa: https://en.wikipedia.org/wiki/Guard_(computer_science)

  const insights = [];
  const todayStr = getCurrentDateKey();
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

  function countInRange(dates, from, to) {
    return dates.filter((date) => date >= from && date <= to).length;
  }

  function getExpectedCompletions(days, frequency) {
    return (
      frequency === 'daily'  ? days :
      frequency === 'weekly' ? days / 7 :
      days / 30
    );
  }

  // Completion rate last N days per habit (DRY principle)
  function getRate(habitId, days, frequency) {
    const sinceStr = shiftDateKey(todayStr, -(days - 1));
    const count = (completionsByHabit[habitId] || []).filter((d) => d >= sinceStr).length;
    const expected = getExpectedCompletions(days, frequency);

    return Math.min(count / expected, 1);
  }

  function getPeriodBounds(frequency) {
    if (frequency === 'daily') {
      return {
        current: { from: todayStr, to: todayStr },
        previous: { from: shiftDateKey(todayStr, -1), to: shiftDateKey(todayStr, -1) },
        messageSuffix: 'idag',
      };
    }

    if (frequency === 'weekly') {
      return {
        current: { from: shiftDateKey(todayStr, -6), to: todayStr },
        previous: { from: shiftDateKey(todayStr, -13), to: shiftDateKey(todayStr, -7) },
        messageSuffix: 'den här veckan',
      };
    }

    const currentMonth = todayStr.slice(0, 7);
    const previousMonth = shiftMonthKey(todayStr, -1).slice(0, 7);

    return {
      current: { from: `${currentMonth}-01`, to: `${currentMonth}-31` },
      previous: { from: `${previousMonth}-01`, to: `${previousMonth}-31` },
      messageSuffix: 'den här månaden',
    };
  }

  // Unique days (data basis for analysis)
  const allDates = [...new Set(completions.map((c) => c.completedDate))];
  const totalDays = allDates.length;

 
  // === 1. Struggling with ===
  if (totalDays >= 7) {
    let weakest = null;
    let weakestRate = 1; // 1 = 100%

    habits.forEach((h) => {
      const rate = getRate(h.habitId, 30, h.frequency);
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
    const { current, previous, messageSuffix } = getPeriodBounds(h.frequency);
    const doneCurrent = countInRange(dates, current.from, current.to) > 0;
    const donePrevious = countInRange(dates, previous.from, previous.to) > 0;
    const hasEarlierHistory = dates.some((date) => date < previous.from);

    if (doneCurrent && !donePrevious && hasEarlierHistory) {
      insights.push({
        type: 'comeback',
        priority: 2,
        habitId: h.habitId,
        message: `🎉 Comeback! Du tappade ${h.icon} ${h.name} ett tag men är igång igen ${messageSuffix}!`,
        value: 1,
      });
    }
  });

  // === 3. Perfect week ===
  const currentWeek = { from: shiftDateKey(todayStr, -6), to: todayStr };
  const weeklyRelevantHabits = habits.filter((habit) => habit.frequency !== 'monthly');

  if (weeklyRelevantHabits.length > 0) {
    const perfectWeek = weeklyRelevantHabits.every((habit) => {
      const dates = completionsByHabit[habit.habitId] || [];
      const completionsThisWeek = countInRange(dates, currentWeek.from, currentWeek.to);

      return habit.frequency === 'daily'
        ? completionsThisWeek >= 7
        : completionsThisWeek >= 1;
    });
    // Källa: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/every

    if (perfectWeek) {
      insights.push({
        type: 'perfect_week',
        priority: 3,
        habitId: null,
        message: `⭐ Perfekt vecka! Du höll alla dagliga och veckovisa vanor den här veckan.`,
        value: weeklyRelevantHabits.length,
      });
    }
  }

  // === 4. Consistency ===
  if (totalDays >= 14) {
    const avgRate = habits.reduce((sum, h) => sum + getRate(h.habitId, 14, h.frequency), 0) / habits.length;
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
      const periodDays = h.frequency === 'monthly' ? 30 : 7;
      const comparisonLabel = h.frequency === 'monthly' ? 'förra månaden' : 'förra veckan';
      const currentStart = shiftDateKey(todayStr, -(periodDays - 1));
      const previousStart = shiftDateKey(todayStr, -((periodDays * 2) - 1));
      const previousEnd = shiftDateKey(todayStr, -periodDays);
      const dates = completionsByHabit[h.habitId] || [];

      const previousCount = countInRange(dates, previousStart, previousEnd);
      const currentCount = countInRange(dates, currentStart, todayStr);
      const expected = getExpectedCompletions(periodDays, h.frequency);
      const previousRate = Math.min(previousCount / expected, 1);
      const currentRate = Math.min(currentCount / expected, 1);
      const diff = Math.round((currentRate - previousRate) * 100);

      if (diff >= 20) {
        insights.push({
          type: 'improvement',
          priority: 5,
          habitId: h.habitId,
          message: `📈 ${h.icon} ${h.name} förbättras! Upp ${diff}% jämfört med ${comparisonLabel}.`,
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
