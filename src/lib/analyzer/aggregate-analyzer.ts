import type { CompetitorAnalysis, AggregateAnalysis } from '@/types/competitor';

export function calculateAggregateAnalysis(competitors: CompetitorAnalysis[]): AggregateAnalysis {
  if (competitors.length === 0) {
    throw new Error('No competitors to analyze');
  }

  // Kelime sayısı istatistikleri
  const wordCounts = competitors.map(c => c.contentData.totalWordCount);
  const averageWordCount = Math.round(
    wordCounts.reduce((sum, count) => sum + count, 0) / wordCounts.length
  );

  const maxWordCount = Math.max(...wordCounts);
  const minWordCount = Math.min(...wordCounts);

  const longestCompetitor = competitors.find(c => c.contentData.totalWordCount === maxWordCount)!;
  const shortestCompetitor = competitors.find(c => c.contentData.totalWordCount === minWordCount)!;

  // H2/H3 ortalamaları
  const h2Counts = competitors.map(c => c.headingStructure.h2Count);
  const h3Counts = competitors.map(c => c.headingStructure.h3Count);

  const averageH2Count = Math.round(
    h2Counts.reduce((sum, count) => sum + count, 0) / h2Counts.length
  );
  const averageH3Count = Math.round(
    h3Counts.reduce((sum, count) => sum + count, 0) / h3Counts.length
  );

  // Ortak H2 başlıkları
  const allH2s: string[] = [];
  competitors.forEach(c => {
    allH2s.push(...c.headingStructure.h2);
  });

  const h2Frequency = countFrequency(allH2s);
  const commonH2Headings = Object.entries(h2Frequency)
    .filter(([_, freq]) => freq >= Math.ceil(competitors.length / 2)) // En az yarısında geçenler
    .map(([heading, frequency]) => ({ heading, frequency }))
    .sort((a, b) => b.frequency - a.frequency);

  // Ortak H3 başlıkları
  const allH3s: string[] = [];
  competitors.forEach(c => {
    allH3s.push(...c.headingStructure.h3);
  });

  const h3Frequency = countFrequency(allH3s);
  const commonH3Headings = Object.entries(h3Frequency)
    .filter(([_, freq]) => freq >= Math.ceil(competitors.length / 2))
    .map(([heading, frequency]) => ({ heading, frequency }))
    .sort((a, b) => b.frequency - a.frequency);

  // Tüm anahtar kelimeler
  const allKeywords = new Set<string>();
  competitors.forEach(c => {
    c.keywordAnalysis.secondaryKeywords.forEach(kw => allKeywords.add(kw));
    c.keywordAnalysis.lsiKeywords.forEach(kw => allKeywords.add(kw));
  });

  // Keyword gap hesaplama (şimdilik boş, AI tarafından hesaplanacak)
  const keywordGap: string[] = [];

  // Ortak FAQ soruları
  const allQuestions: string[] = [];
  competitors.forEach(c => {
    allQuestions.push(...c.faqData.questions);
  });

  const questionFrequency = countFrequency(allQuestions);
  const commonFAQs = Object.entries(questionFrequency)
    .filter(([_, freq]) => freq >= 2) // En az 2 rakipte geçenler
    .map(([question, frequency]) => ({ question, frequency }))
    .sort((a, b) => b.frequency - a.frequency);

  // Link ortalamaları
  const internalLinkCounts = competitors.map(c => c.linkStructure.internalLinkCount);
  const externalLinkCounts = competitors.map(c => c.linkStructure.externalLinkCount);

  const averageInternalLinks = Math.round(
    internalLinkCounts.reduce((sum, count) => sum + count, 0) / internalLinkCounts.length
  );
  const averageExternalLinks = Math.round(
    externalLinkCounts.reduce((sum, count) => sum + count, 0) / externalLinkCounts.length
  );

  // En yaygın snippet tipi
  const snippetTypes = competitors.map(c => c.featuredSnippet.snippetType);
  const snippetTypeFreq = countFrequency(snippetTypes);
  const mostCommonSnippetType = Object.entries(snippetTypeFreq)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || 'paragraph';

  return {
    competitorCount: competitors.length,
    averageWordCount,
    averageH2Count,
    averageH3Count,
    longestCompetitor: {
      url: longestCompetitor.url,
      wordCount: longestCompetitor.contentData.totalWordCount,
    },
    shortestCompetitor: {
      url: shortestCompetitor.url,
      wordCount: shortestCompetitor.contentData.totalWordCount,
    },
    commonH2Headings,
    commonH3Headings,
    allKeywords: Array.from(allKeywords),
    keywordGap,
    commonFAQs,
    averageInternalLinks,
    averageExternalLinks,
    mostCommonSnippetType,
  };
}

function countFrequency<T>(items: T[]): Record<string, number> {
  const frequency: Record<string, number> = {};

  items.forEach(item => {
    const key = String(item).toLowerCase().trim();
    if (key) {
      frequency[key] = (frequency[key] || 0) + 1;
    }
  });

  return frequency;
}

// Benzer başlıkları grupla (fuzzy matching)
export function groupSimilarHeadings(headings: string[]): Array<{ canonical: string; variations: string[] }> {
  const groups: Array<{ canonical: string; variations: string[] }> = [];

  headings.forEach(heading => {
    const normalized = normalizeHeading(heading);

    // Mevcut bir gruba ait mi kontrol et
    let found = false;
    for (const group of groups) {
      if (isSimilar(normalized, normalizeHeading(group.canonical))) {
        group.variations.push(heading);
        found = true;
        break;
      }
    }

    if (!found) {
      groups.push({ canonical: heading, variations: [heading] });
    }
  });

  return groups;
}

function normalizeHeading(heading: string): string {
  return heading
    .toLowerCase()
    .replace(/[^\wğüşıöçĞÜŞİÖÇ\s]/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function isSimilar(str1: string, str2: string): boolean {
  // Basit benzerlik kontrolü: %70'ten fazla ortak kelime
  const words1 = str1.split(' ');
  const words2 = str2.split(' ');

  const commonWords = words1.filter(w => words2.includes(w));
  const similarity = commonWords.length / Math.max(words1.length, words2.length);

  return similarity >= 0.7;
}
