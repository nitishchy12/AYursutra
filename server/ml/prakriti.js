const { runPython } = require('./pythonBridge');

function classifyPrakriti(answers = {}) {
  return runPython('classify-prakriti', { answers });
}

module.exports = { classifyPrakriti };
