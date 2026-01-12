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

  // Parse additional instructions to extract specific requirements
  const instructions = request.additionalInstructions || '';
  const lines = instructions.split('\n');

  // Extract H2 headings from instructions
  let requiredH2s: string[] = [];
  let requiredFAQs: string[] = [];
  let contentGaps: string[] = [];
  let minimumFAQCount = 4; // default

  let inH2Section = false;
  let inFAQSection = false;
  let inContentGapSection = false;

  lines.forEach(line => {
    if (line.includes('## Kullanılacak H2 Başlıkları:')) {
      inH2Section = true;
      inFAQSection = false;
      inContentGapSection = false;
    } else if (line.includes('## Bu soruları SSS bölümüne ekle:')) {
      inFAQSection = true;
      inH2Section = false;
      inContentGapSection = false;
    } else if (line.includes('## Content Gap')) {
      inContentGapSection = true;
      inH2Section = false;
      inFAQSection = false;
    } else if (line.includes('##')) {
      inH2Section = false;
      inFAQSection = false;
      inContentGapSection = false;
    } else if (line.trim().startsWith('- ')) {
      const content = line.trim().substring(2);
      if (inH2Section) {
        requiredH2s.push(content);
      } else if (inFAQSection) {
        requiredFAQs.push(content);
      } else if (inContentGapSection) {
        contentGaps.push(content);
      }
    }
  });

  if (requiredFAQs.length > 0) {
    minimumFAQCount = Math.max(requiredFAQs.length, 4);
  }

  const userPrompt = `
# ⚠️ ZORUNLU İÇERİK GEREKSİNİMLERİ ⚠️

## 📏 ZORUNLU KELIME SAYISI
**MİNİMUM KELIME SAYISI: ${request.wordCount} KELIME**
⚠️ Bu mutlak bir gerekliliktir. ${request.wordCount} kelimeden az içerik KABUL EDİLMEZ!
⚠️ Her section UZUN ve detaylı olmalı - kısa geçiştirme yasak!
⚠️ Hedef: ${Math.ceil(request.wordCount * 1.1)}-${Math.ceil(request.wordCount * 1.2)} kelime arası

${requiredH2s.length > 0 ? `
## 📝 ZORUNLU H2 BAŞLIKLARI (MUTLAKA KULLANILMALI)
Aşağıdaki H2 başlıklarını TAM OLARAK ve SIRASIYLA kullanmalısın:
${requiredH2s.map((h, idx) => `${idx + 1}. ${h}`).join('\n')}

⚠️ Bu başlıkları atlama, değiştirme veya farklı sırada kullanma!
⚠️ Her başlık altında EN AZ 300-400 kelime detaylı içerik yaz!
` : ''}

${requiredFAQs.length > 0 ? `
## ❓ ZORUNLU SSS SORULARI (MUTLAKA EKLENMELI)
Aşağıdaki soruları SSS bölümüne ekle ve DETAYLI cevapla:
${requiredFAQs.map((q, idx) => `${idx + 1}. ${q}`).join('\n')}

⚠️ Her cevap EN AZ 100-150 kelime olmalı!
⚠️ Toplamda EN AZ ${minimumFAQCount} soru-cevap olmalı!
` : ''}

${contentGaps.length > 0 ? `
## 🎯 ZORUNLU KONU EKLEMELERİ (Rakiplerin Atladığı Konular)
Aşağıdaki konuları içeriğe MUTLAKA dahil et:
${contentGaps.map((gap, idx) => `${idx + 1}. ${gap}`).join('\n')}

⚠️ Bu konuları detaylı şekilde işle, geçiştirme!
` : ''}

---

# 📋 İçerik Detayları

**Konu**: ${request.topic}
**Ana Anahtar Kelime**: ${request.mainKeyword}
**İçerik Tipi**: ${request.contentType}
**Ton**: ${request.tone}
${request.intent ? `**Arama Niyeti**: ${request.intent}` : ''}

${request.secondaryKeywords && request.secondaryKeywords.length > 0 ? `
**Kullanılacak Anahtar Kelimeler**:
${request.secondaryKeywords.slice(0, 15).join(', ')}
(Bu kelimeleri doğal şekilde içeriğe serpişir)
` : ''}

${request.competitorUrls && request.competitorUrls.length > 0 ? `
**Rakip Analizi Yapıldı**: ${request.competitorUrls.length} rakip incelendi
(Bu rakiplerden daha uzun ve daha kapsamlı içerik üret)
` : ''}

---

# 🎯 KRİTİK KURALLAR

## JSON Formatı
1. Yanıtında SADECE geçerli JSON formatında veri döndür
2. Hiçbir açıklama, yorum veya ek metin ekleme
3. TÜRKÇE karakterler kullan (ş, ğ, ü, ö, ç, ı)
4. Direkt { ile başla ve } ile bitir

## İçerik Uzunluğu (EN ÖNEMLİ!)
5. ⚠️ İçerik MUTLAKA ${request.wordCount}+ kelime olmalı
6. ⚠️ Giriş: EN AZ 200 kelime
7. ⚠️ Her H2 section: EN AZ 350-500 kelime
8. ⚠️ Her H3 subsection: EN AZ 150-200 kelime
9. ⚠️ Her FAQ cevabı: EN AZ 100-150 kelime
10. ⚠️ Sonuç: EN AZ 200 kelime

## İçerik Kalitesi
11. Detaylı, kapsamlı ve bilgilendirici yaz
12. Örnekler, açıklamalar ve pratik bilgiler ekle
13. Kısa cümlelerle geçiştirme - her konuyu derinlemesine işle
14. Liste, tablo, örnek senaryolar kullan
15. Her paragraf 4-6 cümle içermeli

## FAQ Gereksinimleri
16. ⚠️ EN AZ ${minimumFAQCount} adet soru-cevap ekle
17. ⚠️ Her cevap 100-150 kelime arası olmalı
18. ⚠️ content.faq dizisine ekle, boş bırakma!

⚠️⚠️⚠️ TEKRAR UYARI: ${request.wordCount} KELİMEDEN AZ İÇERİK ÜRETİRSEN BAŞARISIZ SAYILIR! ⚠️⚠️⚠️
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
