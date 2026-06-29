const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

/**
 * Helper to fetch from Gemini REST API
 */
async function callGemini(apiKey, prompt, useSearch = false) {
  if (!apiKey) throw new Error('API Key missing');

  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.7,
    }
  };

  if (useSearch) {
    payload.tools = [{ googleSearch: {} }];
  }

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to communicate with Gemini');
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  
  if (!text) throw new Error('Invalid response from Gemini');
  
  return text;
}

export async function generateTechTips(apiKey) {
  const prompt = `You are an expert software engineer. Generate 5 fresh, advanced, and insightful developer productivity tips or technical facts.
Format your entire response strictly as a JSON array of objects. Do not include markdown code block formatting like \`\`\`json.
Each object must have exactly two keys:
"title": A string containing the tip (max 120 characters).
"tags": An array of exactly 3 relevant short strings.
Example: [{"title": "Use CSS 'content-visibility: auto' to skip rendering off-screen elements", "tags": ["css", "performance", "web"]}]`;

  const text = await callGemini(apiKey, prompt, false);
  
  try {
    // Clean up potential markdown formatting if the model disobeys
    const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleanText);
    
    if (!Array.isArray(parsed)) throw new Error('Expected JSON array');
    
    return parsed.map((tip, i) => ({
      id: `ai-tip-${Date.now()}-${i}`,
      title: tip.title,
      badge: 'AI Tip',
      stat: '✨',
      meta: ['Gemini 2.5 Flash'],
      tags: tip.tags || ['ai', 'tip']
    }));
  } catch (err) {
    console.error('Failed to parse Gemini tips JSON:', text, err);
    throw new Error('Gemini returned malformed JSON');
  }
}

export async function summarizeArticle(apiKey, title, url) {
  const prompt = `Summarize the following technology article or GitHub repository in exactly 3 concise bullet points. 
Title: "${title}"
URL: ${url}
Focus on the main technical takeaways, purpose, or news value. Return ONLY the 3 bullet points, each starting with "- ". Do not add any introductory or concluding text. Use the googleSearch tool to fetch context about this URL or title if you need to.`;

  const text = await callGemini(apiKey, prompt, true);
  return text.trim();
}
