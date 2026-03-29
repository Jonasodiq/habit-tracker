const APP_TIME_ZONE = 'Europe/Stockholm';

const dateFormatter = new Intl.DateTimeFormat('sv-SE', {
  timeZone: APP_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

function pad(value) {
  return String(value).padStart(2, '0');
}

function formatDateKey(date) {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

function parseDateKey(dateKey) {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12));
}

function getCurrentDateKey(now = new Date()) {
  return dateFormatter.format(now);
}

function shiftDateKey(dateKey, days) {
  const date = parseDateKey(dateKey);
  date.setUTCDate(date.getUTCDate() + days);
  return formatDateKey(date);
}

function shiftMonthKey(dateKey, months) {
  const date = parseDateKey(dateKey);
  date.setUTCMonth(date.getUTCMonth() + months);
  return formatDateKey(date);
}

function getDateRange(days, endDateKey = getCurrentDateKey()) {
  return {
    from: shiftDateKey(endDateKey, -(days - 1)),
    to: endDateKey,
  };
}

module.exports = {
  APP_TIME_ZONE,
  formatDateKey,
  getCurrentDateKey,
  getDateRange,
  parseDateKey,
  shiftDateKey,
  shiftMonthKey,
};
