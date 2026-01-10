import { generateWithGroq } from './groq';
import { SEO_EXPERT_SYSTEM_PROMPT } from './prompts';
import { GenerateContentRequest, GenerateContentResponse } from '@/types/api';

function extractJSON(text: string): any {
  // Try 1: Look for JSON in code blocks
  const codeBlockMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1]);
    } catch (e) {
      console.log('Failed to parse JSON from code block');
    }
  }

  // Try 2: Look for JSON between curly braces
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch (e) {
      console.log('Failed to parse JSON from curly braces');
    }
  }

  // Try 3: Clean and try entire text
  try {
    const cleaned = text.trim();
    return JSON.parse(cleaned);
  } catch (e) {
    console.log('Failed to parse entire text as JSON');
  }

  return null;
}

export async function generateSEOContent(
  request: GenerateContentRequest
): Promise<GenerateContentResponse> {
  const userPrompt = `
# İçerik Talebi

**Konu**: ${request.topic}
**Ana Anahtar Kelime**: ${request.mainKeyword}
**Kelime Sayısı**: ${request.wordCount}
**İçerik Tipi**: ${request.contentType}
**Ton**: ${request.tone}
${request.intent ? `**Arama Niyeti**: ${request.intent}` : ''}

${request.competitorUrls && request.competitorUrls.length > 0 ? `
**Rakip URL'ler**:
${request.competitorUrls.map(url => `- ${url}`).join('\n')}
` : ''}

${request.additionalInstructions ? `
**Ek Talimatlar**: ${request.additionalInstructions}
` : ''}

ÇOK ÖNEMLİ: Yanıtında SADECE JSON formatında veri döndür. Hiçbir açıklama, yorum veya ek metin ekleme. Direkt JSON ile başla ve JSON ile bitir.
`;

  console.log('=== Generating content with Groq ===');
  console.log('Request:', { topic: request.topic, keyword: request.mainKeyword });

  const response = await generateWithGroq(userPrompt, SEO_EXPERT_SYSTEM_PROMPT);

  console.log('=== Raw Groq Response (first 500 chars) ===');
  console.log(response.substring(0, 500));

  const parsed = extractJSON(response);

  if (!parsed) {
    console.error('=== Failed to extract JSON ===');
    console.error('Full response:', response);
    throw new Error('AI response did not contain valid JSON. Please try again.');
  }

  console.log('=== Successfully parsed JSON ===');
  console.log('Keys:', Object.keys(parsed));

  // Validate required fields
  if (!parsed.meta || !parsed.seo || !parsed.content || !parsed.fullMarkdown) {
    console.error('=== Missing required fields ===');
    console.error('Parsed:', parsed);
    throw new Error('AI response missing required fields');
  }

  return parsed as GenerateContentResponse;
}
