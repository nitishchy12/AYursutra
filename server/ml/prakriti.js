const { runPython } = require('./pythonBridge');

const explanations = {
  Vata: 'Your responses show a Vata tendency: movement, variability, creativity, and sensitivity. Favor warmth, routine, grounding meals, oil massage, and steady rest.',
  Pitta: 'Your responses show a Pitta tendency: focus, intensity, sharp digestion, and warmth. Favor cooling foods, calm pacing, hydration, shade, and regular relaxation.',
  Kapha: 'Your responses show a Kapha tendency: steadiness, endurance, calm, and structure. Favor light warm meals, active movement, variety, and stimulating routines.',
};

function classifyLocally(answers = {}) {
  const scores = { vata: 0, pitta: 0, kapha: 0 };
  Object.values(answers).forEach((answer) => {
    const key = String(answer || '').toLowerCase();
    if (scores[key] !== undefined) scores[key] += 1;
  });

  const total = Object.values(scores).reduce((sum, score) => sum + score, 0) || 1;
  const winner = Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];
  const prakriti = winner.charAt(0).toUpperCase() + winner.slice(1);

  return {
    prakriti,
    scores,
    confidence: Math.round((scores[winner] / total) * 100),
    explanation: explanations[prakriti],
  };
}

async function classifyPrakriti(answers = {}) {
  try {
    return await runPython('classify-prakriti', { answers });
  } catch (error) {
    console.warn(`Prakriti ML unavailable; using local scorer (${error.message}).`);
    return classifyLocally(answers);
  }
}

module.exports = { classifyPrakriti, classifyLocally };
