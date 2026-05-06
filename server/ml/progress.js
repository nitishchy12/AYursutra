const { runPython } = require('./pythonBridge');

function predictProgress(points = [], target = 8) {
  return runPython('predict-progress', { points, target });
}

module.exports = { predictProgress };
