const { runPython } = require('./pythonBridge');

function patientAnalytics(payload = {}) {
  return runPython('patient-analytics', payload);
}

function adminAnalytics(payload = {}) {
  return runPython('admin-analytics', payload);
}

module.exports = { patientAnalytics, adminAnalytics };
