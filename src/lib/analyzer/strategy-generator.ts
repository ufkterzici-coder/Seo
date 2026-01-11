import { generateWithGroq } from '../ai/groq';
import type {
  CompetitorAnalysis,
  AggregateAnalysis,
  AIStrategy,
  ContentLengthStrategy,
  HeadingStrategy,
  KeywordStrategy,
  MetaStrategy,
  FAQStrategy,
  LinkStrategy,
  SnippetStrategy,
  ContentGapStrategy,
  StrategyChecklist,
} from '@/types/competitor';

const STRATEGY_SYSTEM_PROMPT = `Sen profesyonel bir SEO stratejisti ve içerik danışmanısın.
Rakip analizi verilerini kullanarak detaylı, aksiyon alınabilir stratejiler oluşturuyorsun.

GÖREVIN:
1. Rakip verilerini analiz et
2. Fırsatları tespit et
3. Spesifik, ölçülebilir öneriler sun
4. Her öneri için gerekçe belirt
5. Türkçe içerik üret

KURALLARI:
- Rakipleri kopyalama, onları geç
- Veriye dayalı konuş
- Spesifik sayılar ve örnekler ver
- 2025 trendlerini dahil et
- Kullanıcı odaklı düşün

JSON formatında yanıt ver.`;

export async function generateAIStrategy(
  topic: string,
  mainKeyword: string,
  competitors: CompetitorAnalysis[],
  aggregate: AggregateAnalysis
): Promise<AIStrategy> {
  // 1. İçerik Uzunluğu Stratejisi
  const contentLength = calculateContentLengthStrategy(aggregate);

  // 2. Başlık Yapısı Stratejisi (AI ile)
  const headingStrategy = await generateHeadingStrategy(topic, mainKeyword, competitors, aggregate);

  // 3. Anahtar Kelime Stratejisi (AI ile)
  const keywordStrategy = await generateKeywordStrategy(mainKeyword, competitors, aggregate);

  // 4. Meta Stratejisi (AI ile)
  const metaStrategy = await generateMetaStrategy(topic, mainKeyword, competitors);

  // 5. FAQ Stratejisi (AI ile)
  const faqStrategy = await generateFAQStrategy(topic, competitors, aggregate);

  // 6. Link Stratejisi
  const linkStrategy = calculateLinkStrategy(aggregate);

  // 7. Featured Snippet Stratejisi (AI ile)
  const snippetStrategy = await generateSnippetStrategy(topic, mainKeyword, aggregate);

  // 8. Content Gap Stratejisi (AI ile)
  const contentGap = await generateContentGapStrategy(topic, mainKeyword, competitors);

  // 9. Checklist oluştur
  const checklist = createStrategyChecklist(
    contentLength,
    headingStrategy,
    keywordStrategy,
    faqStrategy
  );

  const criticalRules = [
    'Rakipleri kopyalama, onları GEÇ',
    `Hedef: ${contentLength.recommendedWordCount} kelime (rakip ort: ${contentLength.competitorAverage})`,
    `En az ${headingStrategy.recommendedH2Count} H2 başlık kullan`,
    'Tüm keyword gap\'leri kapat',
    `${faqStrategy.totalQuestionCount} FAQ sorusunu cevapla`,
    'Featured snippet için optimize et',
    'Schema markup ekle',
    '2025 güncel verilerini kullan',
    'SEO + Kullanıcı deneyimi = Öncelik',
  ];

  return {
    contentLength,
    headingStructure: headingStrategy,
    keywords: keywordStrategy,
    meta: metaStrategy,
    faq: faqStrategy,
    links: linkStrategy,
    featuredSnippet: snippetStrategy,
    contentGap,
    checklist,
    criticalRules,
  };
}

// 1. İçerik Uzunluğu Stratejisi (Hesaplama)
function calculateContentLengthStrategy(aggregate: AggregateAnalysis): ContentLengthStrategy {
  const multiplier = 1.4; // %40 daha uzun
  const recommendedWordCount = Math.round(aggregate.averageWordCount * multiplier);

  return {
    competitorAverage: aggregate.averageWordCount,
    competitorMax: aggregate.longestCompetitor.wordCount,
    competitorMin: aggregate.shortestCompetitor.wordCount,
    recommendedWordCount: Math.max(recommendedWordCount, aggregate.longestCompetitor.wordCount + 200),
    multiplier,
    reasoning: `Rakip ortalaması ${aggregate.averageWordCount} kelime. En uzun rakip ${aggregate.longestCompetitor.wordCount} kelime. Sıralamada öne geçmek için en az ${Math.max(recommendedWordCount, aggregate.longestCompetitor.wordCount + 200)} kelime hedefle.`,
  };
}

// 2. Başlık Yapısı Stratejisi (AI)
async function generateHeadingStrategy(
  topic: string,
  mainKeyword: string,
  competitors: CompetitorAnalysis[],
  aggregate: AggregateAnalysis
): Promise<HeadingStrategy> {
  const competitorH2s = competitors.flatMap(c => c.headingStructure.h2);
  const commonH2s = aggregate.commonH2Headings.map(h => h.heading);

  const prompt = `
# BAŞLIK STRATEJİSİ OLUŞTUR

Konu: ${topic}
Ana Anahtar Kelime: ${mainKeyword}

## Rakip H2 Başlıkları:
${competitorH2s.slice(0, 30).map((h, i) => `${i + 1}. ${h}`).join('\n')}

## Ortak H2'ler (Mutlaka Dahil Et):
${commonH2s.map((h, i) => `${i + 1}. ${h}`).join('\n')}

Rakip Ortalama H2 Sayısı: ${aggregate.averageH2Count}

GÖREV:
1. Rakiplerin ATLADIĞI konuları bul
2. Tüm ortak H2'leri dahil et
3. +3-5 yeni, fark yaratan H2 öner
4. Her H2 altında 2-3 H3 öner
5. Toplam H2 sayısı: ${aggregate.averageH2Count + 3} olsun

JSON formatında yanıt ver:
{
  "competitorH2List": ["h2 listesi"],
  "commonH2s": ["ortak h2'ler"],
  "missingTopics": ["eksik konular"],
  "recommendedH2Count": sayı,
  "recommendedH3PerH2": sayı,
  "suggestedH2s": ["önerilen yeni h2'ler"]
}`;

  const response = await generateWithGroq(prompt, STRATEGY_SYSTEM_PROMPT);

  try {
    const parsed = JSON.parse(response);
    return {
      competitorH2List: competitorH2s.slice(0, 20),
      commonH2s,
      missingTopics: parsed.missingTopics || [],
      recommendedH2Count: aggregate.averageH2Count + 3,
      recommendedH3PerH2: 2,
      suggestedH2s: parsed.suggestedH2s || [],
    };
  } catch {
    return {
      competitorH2List: competitorH2s.slice(0, 20),
      commonH2s,
      missingTopics: [],
      recommendedH2Count: aggregate.averageH2Count + 3,
      recommendedH3PerH2: 2,
      suggestedH2s: [],
    };
  }
}

// 3. Anahtar Kelime Stratejisi (AI)
async function generateKeywordStrategy(
  mainKeyword: string,
  competitors: CompetitorAnalysis[],
  aggregate: AggregateAnalysis
): Promise<KeywordStrategy> {
  const allCompetitorKeywords = aggregate.allKeywords.slice(0, 50);

  const prompt = `
# ANAHTAR KELİME STRATEJİSİ

Ana Kelime: ${mainKeyword}

## Rakip Anahtar Kelimeleri:
${allCompetitorKeywords.map((k, i) => `${i + 1}. ${k}`).join('\n')}

GÖREV:
1. Keyword gap'leri tespit et
2. Long-tail fırsatlar bul
3. LSI kelimeleri öner
4. Her kelime için kullanım planı yap

JSON formatında:
{
  "competitorKeywords": ["liste"],
  "keywordGap": ["rakiplerde olmayan ama önemli kelimeler"],
  "longTailOpportunities": ["long-tail kelimeler"],
  "recommendedKeywords": ["kullanılması gereken tüm kelimeler"],
  "usagePlan": {"kelime": "nerede kullanılacak"}
}`;

  const response = await generateWithGroq(prompt, STRATEGY_SYSTEM_PROMPT);

  try {
    const parsed = JSON.parse(response);
    return {
      competitorKeywords: allCompetitorKeywords,
      keywordGap: parsed.keywordGap || [],
      longTailOpportunities: parsed.longTailOpportunities || [],
      recommendedKeywords: parsed.recommendedKeywords || [],
      usagePlan: parsed.usagePlan || {},
    };
  } catch {
    return {
      competitorKeywords: allCompetitorKeywords,
      keywordGap: [],
      longTailOpportunities: [],
      recommendedKeywords: allCompetitorKeywords.slice(0, 20),
      usagePlan: {},
    };
  }
}

// 4. Meta Stratejisi (AI)
async function generateMetaStrategy(
  topic: string,
  mainKeyword: string,
  competitors: CompetitorAnalysis[]
): Promise<MetaStrategy> {
  const competitorTitles = competitors.map(c => c.metaInfo.title).filter(Boolean);
  const titleLengths = competitors.map(c => c.metaInfo.titleLength);
  const avgLength = Math.round(titleLengths.reduce((a, b) => a + b, 0) / titleLengths.length);

  const prompt = `
# META STRATEJİSİ

Konu: ${topic}
Ana Kelime: ${mainKeyword}

## Rakip Title'lar:
${competitorTitles.slice(0, 10).map((t, i) => `${i + 1}. ${t}`).join('\n')}

Ortalama Title Uzunluğu: ${avgLength} karakter

GÖREV:
1. Daha çekici, tıklanabilir title yaz
2. Ana kelimeyi başa al
3. Sayı/yıl ekle (2025)
4. 55-65 karakter arası
5. Meta description öner (150-160 karakter)

JSON formatında:
{
  "competitorTitleFormats": ["format listesi"],
  "averageTitleLength": ${avgLength},
  "suggestedTitle": "önerilen title",
  "suggestedDescription": "önerilen description",
  "reasoning": "neden bu önerileri yaptın"
}`;

  const response = await generateWithGroq(prompt, STRATEGY_SYSTEM_PROMPT);

  try {
    const parsed = JSON.parse(response);
    return {
      competitorTitleFormats: competitorTitles.map(t => {
        if (t.includes('?')) return 'Soru formatı';
        if (/^\d+/.test(t)) return 'Liste formatı';
        if (t.toLowerCase().includes('nasıl')) return 'How-to formatı';
        return 'Standart';
      }),
      averageTitleLength: avgLength,
      suggestedTitle: parsed.suggestedTitle || `${mainKeyword} - Kapsamlı Rehber 2025`,
      suggestedDescription: parsed.suggestedDescription || `${topic} hakkında bilmeniz gereken her şey. ${mainKeyword} ile ilgili detaylı rehber.`,
      reasoning: parsed.reasoning || 'Rakiplerden daha çekici ve bilgilendirici',
    };
  } catch {
    return {
      competitorTitleFormats: ['Standart'],
      averageTitleLength: avgLength,
      suggestedTitle: `${mainKeyword} - Kapsamlı Rehber 2025`,
      suggestedDescription: `${topic} hakkında bilmeniz gereken her şey.`,
      reasoning: 'AI yanıt parse edilemedi, varsayılan değerler kullanıldı',
    };
  }
}

// 5. FAQ Stratejisi (AI)
async function generateFAQStrategy(
  topic: string,
  competitors: CompetitorAnalysis[],
  aggregate: AggregateAnalysis
): Promise<FAQStrategy> {
  const allQuestions = aggregate.commonFAQs.map(f => f.question);

  const prompt = `
# FAQ STRATEJİSİ

Konu: ${topic}

## Rakip FAQ Soruları:
${allQuestions.slice(0, 15).map((q, i) => `${i + 1}. ${q}`).join('\n')}

GÖREV:
1. Tüm rakip sorularını dahil et
2. +5 yeni, alakalı soru ekle
3. "People Also Ask" tarzı sorular
4. Schema FAQ kodu oluştur

JSON formatında:
{
  "competitorQuestions": ["rakip soruları"],
  "suggestedNewQuestions": ["yeni sorular"],
  "totalQuestionCount": toplam_sayı,
  "hasSchemaRecommendation": true,
  "schemaCode": "JSON-LD şema kodu"
}`;

  const response = await generateWithGroq(prompt, STRATEGY_SYSTEM_PROMPT);

  try {
    const parsed = JSON.parse(response);
    return {
      competitorQuestions: allQuestions,
      suggestedNewQuestions: parsed.suggestedNewQuestions || [],
      totalQuestionCount: allQuestions.length + (parsed.suggestedNewQuestions?.length || 5),
      hasSchemaRecommendation: true,
      schemaCode: parsed.schemaCode,
    };
  } catch {
    return {
      competitorQuestions: allQuestions,
      suggestedNewQuestions: [],
      totalQuestionCount: allQuestions.length,
      hasSchemaRecommendation: true,
    };
  }
}

// 6. Link Stratejisi (Hesaplama)
function calculateLinkStrategy(aggregate: AggregateAnalysis): LinkStrategy {
  return {
    competitorAverageInternal: aggregate.averageInternalLinks,
    competitorAverageExternal: aggregate.averageExternalLinks,
    suggestedInternalLinks: [
      { text: 'İlgili içerik 1', reason: 'Konuyla alakalı derinlemesine kaynak' },
      { text: 'İlgili içerik 2', reason: 'Kullanıcı journey\'i destekler' },
      { text: 'İlgili içerik 3', reason: 'SEO link juice dağıtımı' },
    ],
    suggestedExternalSources: [
      'Akademik kaynak',
      'İstatistik kaynağı',
      'Otorite site',
    ],
  };
}

// 7. Featured Snippet Stratejisi (AI)
async function generateSnippetStrategy(
  topic: string,
  mainKeyword: string,
  aggregate: AggregateAnalysis
): Promise<SnippetStrategy> {
  const prompt = `
# FEATURED SNIPPET STRATEJİSİ

Konu: ${topic}
Ana Kelime: ${mainKeyword}

En Yaygın Snippet Tipi: ${aggregate.mostCommonSnippetType}

GÖREV:
1. 40-60 kelimelik net cevap yaz
2. Direkt, açık, kullanıcı dostu
3. Liste veya paragraf formatı

JSON formatında:
{
  "winningSnippetType": "${aggregate.mostCommonSnippetType}",
  "suggestedAnswer": "40-60 kelimelik cevap",
  "answerLength": kelime_sayısı,
  "formatting": "paragraph veya list"
}`;

  const response = await generateWithGroq(prompt, STRATEGY_SYSTEM_PROMPT);

  try {
    const parsed = JSON.parse(response);
    return {
      winningSnippetType: aggregate.mostCommonSnippetType,
      suggestedAnswer: parsed.suggestedAnswer || '',
      answerLength: parsed.answerLength || 50,
      formatting: parsed.formatting || 'paragraph',
    };
  } catch {
    return {
      winningSnippetType: aggregate.mostCommonSnippetType,
      suggestedAnswer: '',
      answerLength: 0,
      formatting: 'paragraph',
    };
  }
}

// 8. Content Gap Stratejisi (AI)
async function generateContentGapStrategy(
  topic: string,
  mainKeyword: string,
  competitors: CompetitorAnalysis[]
): Promise<ContentGapStrategy> {
  const prompt = `
# CONTENT GAP ANALİZİ

Konu: ${topic}
Ana Kelime: ${mainKeyword}

GÖREV:
1. Rakiplerin ATLADIĞI konuları tespit et
2. Yetersiz işlenen başlıkları bul
3. 2025 trendlerini ekle
4. Kullanıcı sorularını tahmin et
5. Fark yaratacak noktalar öner

JSON formatında:
{
  "missedTopics": ["rakiplerin atladığı konular"],
  "underservedTopics": ["yetersiz işlenen konular"],
  "trendingTopics2025": ["2025 güncel trendler"],
  "userQuestions": ["kullanıcıların sorabileceği sorular"],
  "differentiationPoints": ["fark yaratacak noktalar"]
}`;

  const response = await generateWithGroq(prompt, STRATEGY_SYSTEM_PROMPT);

  try {
    const parsed = JSON.parse(response);
    return {
      missedTopics: parsed.missedTopics || [],
      underservedTopics: parsed.underservedTopics || [],
      trendingTopics2025: parsed.trendingTopics2025 || [],
      userQuestions: parsed.userQuestions || [],
      differentiationPoints: parsed.differentiationPoints || [],
    };
  } catch {
    return {
      missedTopics: [],
      underservedTopics: [],
      trendingTopics2025: [],
      userQuestions: [],
      differentiationPoints: [],
    };
  }
}

// 9. Checklist Oluştur
function createStrategyChecklist(
  contentLength: ContentLengthStrategy,
  headingStrategy: HeadingStrategy,
  keywordStrategy: KeywordStrategy,
  faqStrategy: FAQStrategy
): StrategyChecklist {
  return {
    wordCountTarget: {
      value: contentLength.recommendedWordCount,
      met: false, // Gerçek içerik oluşturulunca güncellenecek
    },
    h2CountTarget: {
      value: headingStrategy.recommendedH2Count,
      met: false,
    },
    allHeadingsCovered: false,
    contentGapFilled: false,
    allKeywordsUsed: false,
    keywordGapClosed: false,
    allFAQsAnswered: false,
    newFAQsAdded: false,
    snippetOptimized: false,
    schemaAdded: false,
    internalLinksAdded: false,
    current2025Data: false,
    concreteExamples: false,
    comparisonTable: false,
    prosConsListAdded: false,
  };
}
