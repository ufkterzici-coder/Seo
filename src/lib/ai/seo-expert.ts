import { generateWithGroq } from './groq';
import { SEO_EXPERT_SYSTEM_PROMPT } from './prompts';
import { GenerateContentRequest, GenerateContentResponse } from '@/types/api';

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

Lütfen yukarıdaki bilgilere göre SEO optimize edilmiş, Türkçe bir içerik üret. Sadece JSON formatında döndür.
`;

  const response = await generateWithGroq(userPrompt, SEO_EXPERT_SYSTEM_PROMPT);

  try {
    // Try to extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return parsed as GenerateContentResponse;
  } catch (error) {
    console.error('Failed to parse Groq response:', error);
    console.log('Raw response:', response);
    throw new Error('Failed to parse AI response');
  }
}
