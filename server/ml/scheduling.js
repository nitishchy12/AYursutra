const { runPython } = require('./pythonBridge');

function scoreSlots({ therapyType, preferredTimes = [], practitioners = [], booked = [], date }) {
  return runPython('score-slots', { therapyType, preferredTimes, practitioners, booked, date });
}

module.exports = { scoreSlots };
