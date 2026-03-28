/**
 * Calculates streak based on completions and frequency
 *
 * @param {string[]} dates - Array of dates (YYYY-MM-DD), sorted DESC
 * @param {string} frequency - 'daily' | 'weekly' | 'monthly'
 * @returns {number} - Consecutive periods in streak
 */
function calculateStreak(dates, frequency = 'daily') {
  if (!dates || dates.length === 0) return 0;

  // Sort date DESC (newest first)
  const sorted = [...new Set(dates)].sort((a, b) => (a > b ? -1 : 1));
  const today = new Date(); today.setHours(0, 0, 0, 0);

  if (frequency === 'daily') {
    return calculateDailyStreak(sorted, today);
  } else if (frequency === 'weekly') {
    return calculateWeeklyStreak(sorted, today);
  } else if (frequency === 'monthly') {
    return calculateMonthlyStreak(sorted, today);
  }

  return 0;
}

function calculateDailyStreak(sortedDates, today) {
  let streak = 0;
  let expected = new Date(today);

  for (const dateStr of sortedDates) {
    const date = new Date(dateStr);
    date.setHours(0, 0, 0, 0);

    const diffDays = Math.round((expected - date) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      // Completed on the right day
      streak++;
      expected.setDate(expected.getDate() - 1);
    } else if (diffDays === 1 && streak === 0) {
      // Allow yesterday as a start if not done today yet
      streak++;
      expected = new Date(date);
      expected.setDate(expected.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

function calculateWeeklyStreak(sortedDates, today) {
  let streak = 0;
  const getWeekKey = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const monday = new Date(d);
    monday.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
    return monday.toISOString().slice(0, 10);
  };

  const weeks = [...new Set(sortedDates.map(getWeekKey))].sort((a, b) =>
    a > b ? -1 : 1,
  );

  const currentWeek = getWeekKey(today);

  for (let i = 0; i < weeks.length; i++) {
    const expectedWeek = new Date(currentWeek);
    expectedWeek.setDate(expectedWeek.getDate() - i * 7);
    const expectedKey = expectedWeek.toISOString().slice(0, 10);

    if (weeks[i] === expectedKey) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

function calculateMonthlyStreak(sortedDates, today) {
  let streak = 0;
  const getMonthKey = (date) => date.slice(0, 7); // YYYY-MM

  const months = [...new Set(sortedDates.map(getMonthKey))].sort((a, b) =>
    a > b ? -1 : 1,
  );

  const currentMonth = getMonthKey(today.toISOString());

  for (let i = 0; i < months.length; i++) {
    const expected = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const expectedKey = expected.toISOString().slice(0, 7);

    if (months[i] === expectedKey) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

module.exports = { calculateStreak };