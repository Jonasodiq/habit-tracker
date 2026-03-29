const { formatDateKey, getCurrentDateKey, parseDateKey, shiftDateKey } = require('./date');

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
  const todayKey = getCurrentDateKey();

  if (frequency === 'daily') {
    return calculateDailyStreak(sorted, todayKey);
  } else if (frequency === 'weekly') {
    return calculateWeeklyStreak(sorted, todayKey);
  } else if (frequency === 'monthly') {
    return calculateMonthlyStreak(sorted, todayKey);
  }

  return 0;
}

function calculateDailyStreak(sortedDates, todayKey) {
  let streak = 0;
  let expectedKey = todayKey;
  const yesterdayKey = shiftDateKey(todayKey, -1);

  for (const dateKey of sortedDates) {
    if (dateKey === expectedKey) {
      // Completed on the right day
      streak++;
      expectedKey = shiftDateKey(expectedKey, -1);
    } else if (dateKey === yesterdayKey && streak === 0) {
      // Allow yesterday as a start if not done today yet
      streak++;
      expectedKey = shiftDateKey(dateKey, -1);
    } else {
      break;
    }
  }

  return streak;
}

function calculateWeeklyStreak(sortedDates, todayKey) {
  let streak = 0;
  const getWeekKey = (dateKey) => {
    const d = parseDateKey(dateKey);
    const day = d.getUTCDay();
    const monday = new Date(d);
    monday.setUTCDate(d.getUTCDate() - (day === 0 ? 6 : day - 1));
    return formatDateKey(monday);
  };

  const weeks = [...new Set(sortedDates.map(getWeekKey))].sort((a, b) =>
    a > b ? -1 : 1,
  );

  const currentWeek = getWeekKey(todayKey);

  for (let i = 0; i < weeks.length; i++) {
    const expectedKey = shiftDateKey(currentWeek, -i * 7);

    if (weeks[i] === expectedKey) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

function calculateMonthlyStreak(sortedDates, todayKey) {
  let streak = 0;
  const getMonthKey = (date) => date.slice(0, 7); // YYYY-MM

  const months = [...new Set(sortedDates.map(getMonthKey))].sort((a, b) =>
    a > b ? -1 : 1,
  );

  const today = parseDateKey(todayKey);
  const currentMonth = getMonthKey(todayKey);

  for (let i = 0; i < months.length; i++) {
    const expected = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - i, 1, 12));
    const expectedKey = formatDateKey(expected).slice(0, 7);

    if (months[i] === expectedKey) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

module.exports = { calculateStreak };
