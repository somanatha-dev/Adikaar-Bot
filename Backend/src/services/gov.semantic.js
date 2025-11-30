const { GoogleGenAI } = require('@google/genai');
const ai = new GoogleGenAI({});

// Base phrases representing Indian government identity & scheme domain.
const GOV_SEMANTIC_PHRASES = [
  'Procedure to apply for Aadhaar card in India',
  'Steps for PAN card application through income tax portal',
  'Government welfare scheme benefits and eligibility',
  'Indian voter ID enrolment process and required documents',
  'Subsidy and yojana application guidelines for residents',
  'PM Kisan registration farmer support',
  'Ayushman Bharat health insurance eligibility and documents',
  'Procedure for updating Aadhaar biometrics for child',
  'Government pension PF and EPFO account basics'
];

let centroidVector = null; // Float32Array or number[]
let phraseVectors = null;
let initializing = false;

async function embed(text) {
  const resp = await ai.models.embedContent({
    model: 'gemini-embedding-001',
    contents: text,
    config: { outputDimensionality: 768 }
  });
  return resp.embeddings[0].values;
}

function cosine(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i]*b[i]; na += a[i]*a[i]; nb += b[i]*b[i]; }
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

async function initIfNeeded() {
  if (centroidVector || initializing) return;
  initializing = true;
  phraseVectors = [];
  for (const p of GOV_SEMANTIC_PHRASES) {
    try { phraseVectors.push(await embed(p)); } catch { /* ignore */ }
  }
  if (phraseVectors.length) {
    centroidVector = new Array(phraseVectors[0].length).fill(0);
    for (const v of phraseVectors) {
      for (let i = 0; i < v.length; i++) centroidVector[i] += v[i];
    }
    for (let i = 0; i < centroidVector.length; i++) centroidVector[i] /= phraseVectors.length;
  }
  initializing = false;
}

async function semanticScore(query) {
  await initIfNeeded();
  if (!centroidVector) return 0;
  let vec;
  try { vec = await embed(query); } catch { return 0; }
  return cosine(vec, centroidVector);
}

module.exports = { semanticScore };
