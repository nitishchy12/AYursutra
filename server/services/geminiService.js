const { GoogleGenerativeAI } = require('@google/generative-ai');

const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504]);

function currentTherapySummary(therapies = []) {
  return therapies.length
    ? therapies.map((therapy) => `${therapy.therapyType} (${therapy.status})`).join(', ')
    : 'no active therapy sessions recorded';
}

function fallbackAnswer({ patient, therapies = [], feedback = [], message = '' }) {
  const prakriti = patient?.prakriti || 'current';
  const question = message.toLowerCase();
  const therapySummary = currentTherapySummary(therapies);
  const latestFeedback = feedback[0]
    ? ` Your latest feedback shows overall rating ${feedback[0].overallRating || 'not noted'} and symptom improvement ${feedback[0].symptomImprovement || 'not noted'}.`
    : '';

  if (/precaution|avoid|careful|before|after|post|pre/i.test(question)) {
    return `For your ${prakriti} profile, keep precautions simple and steady: avoid heavy meals before therapy, stay hydrated with warm water, rest after sessions, and avoid sudden cold exposure or strenuous activity the same day. Since your recorded therapy context is ${therapySummary}, follow the specific instructions from your practitioner first.`;
  }

  if (/recover|progress|improv|healing|better|status/i.test(question)) {
    return `For recovery progress, watch trends rather than one symptom: sleep quality, digestion, energy, pain, mood, and how long relief lasts after each session.${latestFeedback} With your ${prakriti} profile and ${therapySummary}, improvement is usually a steady pattern of fewer flare-ups and better daily stamina. If symptoms worsen or new severe symptoms appear, contact your practitioner.`;
  }

  if (/report|urgent|danger|symptom|practitioner|doctor|fever|pain|dizziness|breath/i.test(question)) {
    return `Report severe or worsening pain, fever, dizziness, breathlessness, fainting, persistent vomiting, allergic swelling, unusual bleeding, or symptoms that feel sharply different from your normal pattern. For your ${prakriti} profile, also mention digestion changes, sleep disruption, heat or cold sensitivity, and any reaction after therapy.`;
  }

  if (/therapy|session|treatment|recommend|book|which/i.test(question)) {
    return `Based on your ${prakriti} profile and ${therapySummary}, choose therapy with your current goal in mind: Shirodhara for stress and sleep, Abhyanga for grounding and stiffness, Nasya for sinus or clarity concerns, and Panchakarma only with practitioner supervision. Share your symptoms, medications, and recent feedback before booking.`;
  }

  if (/diet|food|eat|meal|drink/i.test(question)) {
    return `For your ${prakriti} profile, favor freshly cooked, easy-to-digest meals and avoid extremes. Vata usually benefits from warm and grounding foods, Pitta from cooling and less spicy meals, and Kapha from light, warm, stimulating meals. Keep hydration steady and adjust based on your practitioner advice.`;
  }

  return `For your ${prakriti} profile, the next best step is to keep routine, meals, sleep, and therapy instructions consistent while tracking the exact symptom you asked about. Your recorded therapy context is ${therapySummary}. Ask your practitioner promptly if symptoms become severe, sudden, or unusual.`;
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
    return fallbackAnswer({ patient, therapies, feedback, message });
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
  return fallbackAnswer({ patient, therapies, feedback, message });
}

module.exports = { askAdvisor };
