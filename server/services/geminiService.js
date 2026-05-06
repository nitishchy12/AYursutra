const { GoogleGenerativeAI } = require('@google/generative-ai');

const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504]);

function fallbackAnswer({ patient, context }) {
  return `Based on your ${patient?.prakriti || 'current'} profile, keep your routine steady, follow your therapy instructions, hydrate well, and report any unusual symptoms such as severe pain, dizziness, fever, breathlessness, or worsening discomfort to your practitioner. Context reviewed: ${context}`;
}

function advisorModels() {
  const configured = [
    process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    ...(process.env.GEMINI_FALLBACK_MODELS || 'gemini-2.5-flash-lite').split(','),
  ]
    .map((model) => model?.trim())
    .filter(Boolean);

  return [...new Set(configured)];
}

function isRetryableGeminiError(error) {
  const message = error?.message || '';
  return RETRYABLE_STATUS_CODES.has(error?.status)
    || /\[(429|500|502|503|504)\b/.test(message)
    || /high demand|overloaded|temporarily|unavailable|try again later/i.test(message);
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function generateWithModel(genAI, modelName, system, prompt) {
  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: system,
  });
  const result = await model.generateContent(prompt);
  return result.response.text();
}

async function askAdvisor({ patient, therapies, feedback, message }) {
  const context = [
    `Patient prakriti: ${patient?.prakriti || 'unknown'}`,
    `Current therapies: ${(therapies || []).map((t) => `${t.therapyType} ${t.status}`).join(', ') || 'none'}`,
    `Recent feedback: ${(feedback || []).map((f) => `rating ${f.overallRating}, improvement ${f.symptomImprovement}`).join('; ') || 'none'}`,
  ].join('\n');
  const system = 'You are an expert Ayurvedic physician specializing in Panchakarma. You have access to the patient context below. Provide personalized, evidence-based Ayurvedic guidance and ask practitioners to review urgent symptoms.';
  if (!process.env.GEMINI_API_KEY) {
    return fallbackAnswer({ patient, context });
  }
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const prompt = `${context}\n\nPatient question: ${message}`;
  let lastError;

  for (const modelName of advisorModels()) {
    for (let attempt = 1; attempt <= 2; attempt += 1) {
      try {
        return await generateWithModel(genAI, modelName, system, prompt);
      } catch (error) {
        lastError = error;
        if (!isRetryableGeminiError(error)) break;
        if (attempt < 2) await wait(500);
      }
    }
  }

  const reason = lastError?.message?.match(/\[(\d{3}[^\]]*)\]/)?.[1] || lastError?.status || lastError?.message || 'unknown error';
  console.warn(`Gemini advisor unavailable; using local fallback answer (${reason}).`);
  return fallbackAnswer({ patient, context });
}

module.exports = { askAdvisor };
