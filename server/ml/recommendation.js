const { runPython } = require('./pythonBridge');

function recommendTherapy(profile = {}) {
  return runPython('recommend-therapy', { profile });
}

module.exports = { recommendTherapy };
