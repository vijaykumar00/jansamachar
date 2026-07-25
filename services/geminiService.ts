// JanSamachar — Gemini AI Service
// Powers: news summaries, language translation, explain-in-simple-language

import { API_CONFIG, DEMO_MODE } from '../constants/api';

// Try gemini-2.0-flash first (latest free model), fall back to 1.5-flash
const GEMINI_MODELS = [
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-flash-latest',
];
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

interface GeminiRequest {
  contents: Array<{
    parts: Array<{ text: string }>;
  }>;
  generationConfig?: {
    maxOutputTokens?: number;
    temperature?: number;
  };
}

async function callGemini(prompt: string, maxTokens = 300): Promise<string> {
  if (!API_CONFIG.GEMINI_API_KEY || API_CONFIG.GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY') {
    throw new Error('Gemini API key not configured');
  }

  const body: GeminiRequest = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { maxOutputTokens: maxTokens, temperature: 0.3 },
  };

  // Try each model in order until one works
  let lastError = '';
  for (const model of GEMINI_MODELS) {
    try {
      const url = `${GEMINI_BASE}/${model}:generateContent?key=${API_CONFIG.GEMINI_API_KEY}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.warn(`Gemini model ${model} failed (${res.status}):`, errText);
        lastError = `${res.status}: ${errText}`;
        continue; // try next model
      }

      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return text;
    } catch (err: any) {
      console.warn(`Gemini model ${model} error:`, err.message);
      lastError = err.message;
    }
  }

  throw new Error(`All Gemini models failed. Last error: ${lastError}`);
}

/**
 * Generates a concise 3-bullet AI summary of a news article
 * Returns in Hindi + English
 */
export async function summarizeNews(
  title: string,
  description: string,
  language: 'hi' | 'en' | 'both' = 'both'
): Promise<string> {
  if (DEMO_MODE) {
    return getDemoSummary(language);
  }

  const langInstruction =
    language === 'hi'
      ? 'Respond ONLY in Hindi (Devanagari script).'
      : language === 'en'
      ? 'Respond ONLY in English.'
      : 'Respond in both Hindi (Devanagari) and English. First Hindi, then English.';

  const prompt = `You are a trusted Indian news analyst. Analyze this news and provide:
1. A 3-bullet point summary in simple, clear language that any common person can understand
2. What this means for ordinary Indians
3. Who is accountable (if applicable)

${langInstruction}

News Title: ${title}
News Description: ${description}

Keep each bullet under 20 words. Be factual and neutral.`;

  try {
    return await callGemini(prompt, 400);
  } catch (err) {
    console.warn('Gemini summarize failed:', err);
    return getDemoSummary(language);
  }
}

/**
 * Translates news to a target Indian language
 */
export async function translateNews(text: string, targetLang: string): Promise<string> {
  if (DEMO_MODE) return text;

  const langNames: Record<string, string> = {
    hi: 'Hindi',
    ta: 'Tamil',
    te: 'Telugu',
    bn: 'Bengali',
    mr: 'Marathi',
    gu: 'Gujarati',
    kn: 'Kannada',
    ml: 'Malayalam',
    pa: 'Punjabi',
  };

  const prompt = `Translate the following news text to ${langNames[targetLang] || targetLang}. 
Keep it natural, conversational, and easy to understand for common people.
Only output the translation, nothing else.

Text: ${text}`;

  try {
    return await callGemini(prompt, 500);
  } catch {
    return text;
  }
}

/**
 * Explains complex govt document / RTI / legal order in simple language
 */
export async function explainDocument(documentText: string, language: 'hi' | 'en' = 'hi'): Promise<string> {
  if (DEMO_MODE) {
    return language === 'hi'
      ? '• यह दस्तावेज़ सरकारी नीति के बारे में है\n• इसका सामान्य नागरिकों पर प्रभाव पड़ सकता है\n• अधिक जानकारी के लिए RTI दायर करें'
      : '• This document relates to government policy\n• It may affect ordinary citizens\n• Consider filing RTI for more details';
  }

  const langInstruction = language === 'hi' ? 'Respond in Hindi (Devanagari script).' : 'Respond in English.';

  const prompt = `You are helping ordinary Indian citizens understand a government document. 
Explain this document in very simple, everyday language:
- What is this about? (1 line)
- What does it mean for common people? (2-3 bullets)
- What action can citizens take if needed? (1 bullet)

${langInstruction}

Document excerpt: ${documentText.substring(0, 1000)}`;

  try {
    return await callGemini(prompt, 300);
  } catch {
    return 'Unable to generate explanation. Please try again.';
  }
}

/**
 * Fact-checks a claim against known information
 */
export async function factCheck(claim: string): Promise<{ verdict: string; explanation: string }> {
  if (DEMO_MODE) {
    return {
      verdict: 'Checking...',
      explanation: 'AI fact-checking requires Gemini API key. Please configure in settings.',
    };
  }

  const prompt = `As an Indian fact-checker, analyze this claim:
"${claim}"

Respond with:
VERDICT: [TRUE / FALSE / MISLEADING / UNVERIFIED / PARTIALLY TRUE]
EXPLANATION: (2-3 sentences explaining why, with context for Indian audience)

Be strictly factual. Do not take political sides.`;

  try {
    const response = await callGemini(prompt, 200);
    const verdictMatch = response.match(/VERDICT:\s*(.+)/i);
    const explanationMatch = response.match(/EXPLANATION:\s*([\s\S]+)/i);
    return {
      verdict: verdictMatch?.[1]?.trim() || 'UNVERIFIED',
      explanation: explanationMatch?.[1]?.trim() || response,
    };
  } catch {
    return { verdict: 'ERROR', explanation: 'Fact check failed. Please try again.' };
  }
}

function getDemoSummary(language: 'hi' | 'en' | 'both'): string {
  const hi = '• यह खबर भारत की राजनीति से जुड़ी है\n• इसका आम नागरिकों पर सीधा असर पड़ सकता है\n• सरकार की जवाबदेही ज़रूरी है';
  const en = '• This news relates to Indian politics\n• It may directly impact ordinary citizens\n• Government accountability is essential';

  if (language === 'hi') return hi;
  if (language === 'en') return en;
  return `${hi}\n\n${en}`;
}
