const { runPython } = require('./pythonBridge');

function findAnomalies(feedback = []) {
  return runPython('find-anomalies', { feedback });
}

module.exports = { findAnomalies };
