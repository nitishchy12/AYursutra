const { GoogleGenerativeAI } = require('@google/generative-ai');

function fallbackAnswer({ patient, context }) {
  return `Based on your ${patient?.prakriti || 'current'} profile, keep your routine steady, follow your therapy instructions, hydrate well, and report any unusual symptoms such as severe pain, dizziness, fever, breathlessness, or worsening discomfort to your practitioner. Context reviewed: ${context}`;
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
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
      systemInstruction: system,
    });
    const result = await model.generateContent(`${context}\n\nPatient question: ${message}`);
    return result.response.text();
  } catch (error) {
    console.warn('Gemini advisor failed:', error.message);
    return fallbackAnswer({ patient, context });
  }
}

module.exports = { askAdvisor };
