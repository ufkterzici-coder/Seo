import { generateWithGroq } from './groq';
import { SEO_EXPERT_SYSTEM_PROMPT } from './prompts';
import { GenerateContentRequest, GenerateContentResponse } from '@/types/api';

function cleanJSON(text: string): string {
  // Remove BOM and invisible characters
  let cleaned = text.replace(/^\uFEFF/, ''); // Remove BOM
  cleaned = cleaned.replace(/[\u0000-\u001F\u007F-\u009F]/g, ''); // Remove control characters
  
  // Normalize line endings
  cleaned = cleaned.replace(/\r\n/g, '\n');
  cleaned = cleaned.replace(/\r/g, '\n');
  
  // Trim whitespace
  cleaned = cleaned.trim();
  
  return cleaned;
}

function extractJSON(text: string): any {
  const cleaned = cleanJSON(text);
  
  // Try 1: Parse entire cleaned text
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    console.log('Failed to parse cleaned text directly');
  }

  // Try 2: Look for JSON in code blocks
  const codeBlockMatch = cleaned.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
  if (codeBlockMatch) {
    try {
      const json = cleanJSON(codeBlockMatch[1]);
      return JSON.parse(json);
    } catch (e) {
      console.log('Failed to parse JSON from code block');
    }
  }

  // Try 3: Find first { and last } and extract everything between
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    try {
      const jsonStr = cleaned.substring(firstBrace, lastBrace + 1);
      return JSON.parse(jsonStr);
    } catch (e) {
      console.log('Failed to parse JSON between braces:', e);
      console.log('Attempted JSON (first 200 chars):', jsonStr.substring(0, 200));
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

ÇOK ÖNEMLİ: 
1. Yanıtında SADECE geçerli JSON formatında veri döndür
2. Hiçbir açıklama, yorum veya ek metin ekleme
3. TÜRKÇE karakterler kullan, başka dil karakterleri kullanma
4. İngilizce kelimeler yerine Türkçe kullan (örn: "necessary" yerine "zorunlu")
5. Direkt { ile başla ve } ile bitir
`;

  console.log('=== Generating content with Groq ===');
  console.log('Request:', { topic: request.topic, keyword: request.mainKeyword });

  const response = await generateWithGroq(userPrompt, SEO_EXPERT_SYSTEM_PROMPT);

  console.log('=== Raw Groq Response ===');
  console.log('Length:', response.length);
  console.log('First 300 chars:', response.substring(0, 300));
  console.log('Last 100 chars:', response.substring(response.length - 100));

  const parsed = extractJSON(response);

  if (!parsed) {
    console.error('=== Failed to extract JSON ===');
    console.error('Response length:', response.length);
    console.error('First 1000 chars:', response.substring(0, 1000));
    throw new Error('AI response did not contain valid JSON. Please try again.');
  }

  console.log('=== Successfully parsed JSON ===');
  console.log('Keys:', Object.keys(parsed));

  // Validate required fields
  if (!parsed.meta || !parsed.seo || !parsed.content) {
    console.error('=== Missing required fields ===');
    console.error('Available keys:', Object.keys(parsed));
    throw new Error('AI response missing required fields (meta, seo, content)');
  }

  // Ensure fullMarkdown exists
  if (!parsed.fullMarkdown) {
    console.log('Warning: fullMarkdown missing, will generate from content');
    parsed.fullMarkdown = generateMarkdownFromContent(parsed);
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
