import { API_CONFIG, DEMO_MODE } from '../constants/api';

const GEMINI_MODELS = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-flash-latest'];
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

interface GeminiRequest {
  contents: Array<{ parts: Array<{ text: string }> }>;
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

  let lastError = '';
  for (const model of GEMINI_MODELS) {
    try {
      const res = await fetch(`${GEMINI_BASE}/${model}:generateContent?key=${API_CONFIG.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        lastError = `${res.status}: ${await res.text()}`;
        continue;
      }

      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return text;
    } catch (err) {
      lastError = err instanceof Error ? err.message : 'Unknown Gemini error';
    }
  }

  throw new Error(`All Gemini models failed. Last error: ${lastError}`);
}

export async function summarizeNews(
  title: string,
  description: string,
  language: 'hi' | 'en' | 'both' = 'both'
): Promise<string> {
  if (DEMO_MODE) return getDemoSummary(language);

  const langInstruction =
    language === 'hi'
      ? 'Respond only in Hindi using Devanagari script.'
      : language === 'en'
      ? 'Respond only in English.'
      : 'Respond in Hindi first, then English.';

  const prompt = `You are a neutral Indian news analyst. Summarize this story in simple language.

Rules:
- Use 3 bullets
- Keep each bullet under 20 words
- Mention uncertainty when the story is developing
- Do not present AI output as verified fact

${langInstruction}

Title: ${title}
Description: ${description}`;

  try {
    return await callGemini(prompt, 400);
  } catch (err) {
    console.warn('Gemini summarize failed:', err);
    return getDemoSummary(language);
  }
}

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

  try {
    return await callGemini(
      `Translate this news text to ${langNames[targetLang] || targetLang}. Keep it natural and concise.\n\n${text}`,
      500
    );
  } catch {
    return text;
  }
}

export async function explainDocument(documentText: string, language: 'hi' | 'en' = 'hi'): Promise<string> {
  if (DEMO_MODE) {
    return language === 'hi'
      ? '• यह दस्तावेज सरकारी नीति से जुड़ा है\n• इसका असर आम नागरिकों पर पड़ सकता है\n• पुष्टि के लिए मूल स्रोत या RTI देखें'
      : '• This document relates to government policy\n• It may affect ordinary citizens\n• Check the original source or file an RTI for more detail';
  }

  const langInstruction = language === 'hi' ? 'Respond in Hindi using Devanagari script.' : 'Respond in English.';

  try {
    return await callGemini(
      `Explain this government or civic document for ordinary Indian citizens.
- What is it about?
- What does it mean for common people?
- What action can citizens take?

${langInstruction}

Document excerpt: ${documentText.substring(0, 1000)}`,
      300
    );
  } catch {
    return 'Unable to generate explanation. Please try again.';
  }
}

export async function factCheck(claim: string): Promise<{ verdict: string; explanation: string }> {
  if (DEMO_MODE) {
    return {
      verdict: 'UNVERIFIED',
      explanation: 'AI fact-checking requires Gemini API configuration. Verify this claim with trusted fact-check sources.',
    };
  }

  try {
    const response = await callGemini(
      `Fact-check this claim for an Indian audience:
"${claim}"

Return:
VERDICT: TRUE / FALSE / MISLEADING / UNVERIFIED / PARTIALLY TRUE
EXPLANATION: 2 short sentences with context.`,
      220
    );
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
  const hi = '• यह खबर सार्वजनिक हित से जुड़ी है\n• इसका असर आम नागरिकों पर पड़ सकता है\n• पुष्टि के लिए मूल स्रोत जरूर देखें';
  const en = '• This story relates to public interest\n• It may affect ordinary citizens\n• Check the original source before acting on it';

  if (language === 'hi') return hi;
  if (language === 'en') return en;
  return `${hi}\n\n${en}`;
}
