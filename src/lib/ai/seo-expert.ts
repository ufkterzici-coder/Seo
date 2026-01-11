import { generateWithGroq } from './groq';
import { generateWithClaude } from './claude';
import { SEO_EXPERT_SYSTEM_PROMPT } from './prompts';
import { GenerateContentRequest, GenerateContentResponse } from '@/types/api';

function cleanJSON(text: string): string {
  let cleaned = text.replace(/^\uFEFF/, '');
  cleaned = cleaned.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
  cleaned = cleaned.replace(/\r\n/g, '\n');
  cleaned = cleaned.replace(/\r/g, '\n');
  cleaned = cleaned.trim();
  return cleaned;
}

function extractJSON(text: string): any {
  const cleaned = cleanJSON(text);
  
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    console.log('Failed to parse cleaned text directly');
  }

  const codeBlockMatch = cleaned.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
  if (codeBlockMatch) {
    try {
      const json = cleanJSON(codeBlockMatch[1]);
      return JSON.parse(json);
    } catch (e) {
      console.log('Failed to parse JSON from code block');
    }
  }

  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    try {
      const jsonStr = cleaned.substring(firstBrace, lastBrace + 1);
      return JSON.parse(jsonStr);
    } catch (e) {
      console.log('Failed to parse JSON between braces:', e);
    }
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
**Hedef Kelime Sayısı**: ${request.wordCount} kelime (ÇOK ÖNEMLİ: Bu sayıyı mutlaka karşılayın!)
**İçerik Tipi**: ${request.contentType}
**Ton**: ${request.tone}
${request.intent ? `**Arama Niyeti**: ${request.intent}` : ''}

${request.secondaryKeywords && request.secondaryKeywords.length > 0 ? `
**İkincil Anahtar Kelimeler**: ${request.secondaryKeywords.join(', ')}
(Bu kelimeleri içerikte doğal şekilde kullan)
` : ''}

${request.competitorUrls && request.competitorUrls.length > 0 ? `
**Rakip URL'ler**:
${request.competitorUrls.map(url => `- ${url}`).join('\n')}
` : ''}

${request.additionalInstructions ? `
**Ek Talimatlar**: ${request.additionalInstructions}
` : ''}

KRİTİK KURALLAR:
1. Yanıtında SADECE geçerli JSON formatında veri döndür
2. Hiçbir açıklama, yorum veya ek metin ekleme
3. TÜRKÇE karakterler kullan, başka dil karakterleri kullanma
4. İngilizce kelimeler yerine Türkçe kullan
5. Direkt { ile başla ve } ile bitir
6. İçerik MUTLAKA ${request.wordCount} kelime veya daha uzun olmalı
7. Her section en az 200-300 kelime içermeli
8. Detaylı, kapsamlı ve bilgilendirici yaz
9. Örnekler, açıklamalar ve detaylar ekle
10. Kısa cümlelerle geçiştirme, her konuyu derinlemesine işle
`;

  console.log('=== Generating content with AI ===');
  console.log('Provider:', request.aiProvider || 'groq');
  console.log('Topic:', request.topic);
  console.log('Target word count:', request.wordCount);

  let response: string;

  try {
    if (request.aiProvider === 'claude') {
      response = await generateWithClaude(userPrompt, SEO_EXPERT_SYSTEM_PROMPT, 'claude-3-5-sonnet-20241022');
    } else {
      response = await generateWithGroq(userPrompt, SEO_EXPERT_SYSTEM_PROMPT, 'llama-3.3-70b-versatile');
    }
  } catch (error: any) {
    console.error('AI Provider Error:', error);
    throw new Error(`Failed to generate content: ${error.message}`);
  }

  console.log('=== Raw AI Response ===');
  console.log('Length:', response.length);
  console.log('First 300 chars:', response.substring(0, 300));

  const parsed = extractJSON(response);

  if (!parsed) {
    console.error('=== Failed to extract JSON ===');
    throw new Error('AI response did not contain valid JSON. Please try again.');
  }

  console.log('=== Successfully parsed JSON ===');
  console.log('Keys:', Object.keys(parsed));

  if (!parsed.meta || !parsed.seo || !parsed.content) {
    console.error('=== Missing required fields ===');
    throw new Error('AI response missing required fields (meta, seo, content)');
  }

  if (!parsed.fullMarkdown) {
    console.log('Warning: fullMarkdown missing, generating from content');
    parsed.fullMarkdown = generateMarkdownFromContent(parsed);
  }

  // Log actual word count
  const actualWordCount = parsed.fullMarkdown.split(/\s+/).filter(Boolean).length;
  console.log('Generated word count:', actualWordCount, '/ Target:', request.wordCount);

  if (actualWordCount < request.wordCount * 0.7) {
    console.warn('WARNING: Generated content is significantly shorter than requested!');
  }

  return parsed as GenerateContentResponse;
}

function generateMarkdownFromContent(data: any): string {
  let markdown = `# ${data.structure?.h1 || 'Untitled'}\n\n`;
  
  if (data.content?.introduction) {
    markdown += `${data.content.introduction}\n\n`;
  }
  
  if (data.content?.sections) {
    data.content.sections.forEach((section: any) => {
      markdown += `## ${section.heading}\n\n${section.content}\n\n`;
      
      if (section.subsections) {
        section.subsections.forEach((sub: any) => {
          markdown += `### ${sub.heading}\n\n${sub.content}\n\n`;
        });
      }
    });
  }
  
  if (data.content?.faq && data.content.faq.length > 0) {
    markdown += `## Sıkça Sorulan Sorular\n\n`;
    data.content.faq.forEach((faq: any) => {
      markdown += `### ${faq.question}\n\n${faq.answer}\n\n`;
    });
  }
  
  if (data.content?.conclusion) {
    markdown += `## Sonuç\n\n${data.content.conclusion}\n`;
  }
  
  return markdown;
}
