// Rakip Analiz Tipleri

export interface CompetitorScrapeStatus {
  url: string;
  status: 'pending' | 'success' | 'error';
  error?: string;
}

// 1. Başlık Yapısı
export interface HeadingStructure {
  h1: string[];
  h2: string[];
  h3: string[];
  h1Count: number;
  h2Count: number;
  h3Count: number;
  commonHeadings: string[];
}

// 2. İçerik Verileri
export interface ContentData {
  totalWordCount: number;
  sectionCount: number;
  sectionLengths: number[];
  averageSectionLength: number;
  paragraphCount: number;
}

// 3. Anahtar Kelime Analizi
export interface KeywordAnalysis {
  primaryKeyword: string;
  secondaryKeywords: string[];
  lsiKeywords: string[];
  longTailKeywords: string[];
  keywordFrequency: Record<string, number>;
  keywordDensity: number;
}

// 4. Meta Bilgileri
export interface MetaInfo {
  title: string;
  titleLength: number;
  titleFormat: 'question' | 'list' | 'how-to' | 'comparison' | 'standard';
  metaDescription: string;
  metaDescriptionLength: number;
  hasCTA: boolean;
}

// 5. FAQ / SSS
export interface FAQData {
  questions: string[];
  answers: string[];
  hasSchemaFAQ: boolean;
  questionCount: number;
  averageAnswerLength: number;
}

// 6. Link Yapısı
export interface LinkStructure {
  internalLinkCount: number;
  externalLinkCount: number;
  anchorTexts: string[];
  internalLinks: Array<{ url: string; text: string }>;
  externalLinks: Array<{ url: string; text: string }>;
}

// 7. Featured Snippet
export interface FeaturedSnippet {
  snippetType: 'paragraph' | 'list' | 'table' | 'none';
  snippetLength: number;
  hasDirectAnswer: boolean;
  snippetContent?: string;
}

// 8. İçerik Kalitesi
export interface ContentQuality {
  hasUpdateDate: boolean;
  lastUpdated?: string;
  hasSourceCitations: boolean;
  sourceCount: number;
  hasExamples: boolean;
  exampleCount: number;
  hasExpertOpinion: boolean;
  hasStatistics: boolean;
  statisticCount: number;
  hasImages: boolean;
  imageCount: number;
  hasVideos: boolean;
  videoCount: number;
}

// Tek Rakip İçin Tam Analiz
export interface CompetitorAnalysis {
  url: string;
  scrapedAt: string;
  headingStructure: HeadingStructure;
  contentData: ContentData;
  keywordAnalysis: KeywordAnalysis;
  metaInfo: MetaInfo;
  faqData: FAQData;
  linkStructure: LinkStructure;
  featuredSnippet: FeaturedSnippet;
  contentQuality: ContentQuality;
}

// Toplam Rakip Analizi (Aggregate)
export interface AggregateAnalysis {
  competitorCount: number;
  averageWordCount: number;
  averageH2Count: number;
  averageH3Count: number;
  longestCompetitor: { url: string; wordCount: number };
  shortestCompetitor: { url: string; wordCount: number };
  commonH2Headings: Array<{ heading: string; frequency: number }>;
  commonH3Headings: Array<{ heading: string; frequency: number }>;
  allKeywords: string[];
  keywordGap: string[];
  commonFAQs: Array<{ question: string; frequency: number }>;
  averageInternalLinks: number;
  averageExternalLinks: number;
  mostCommonSnippetType: string;
}

// AI Strateji Önerileri
export interface ContentLengthStrategy {
  competitorAverage: number;
  competitorMax: number;
  competitorMin: number;
  recommendedWordCount: number;
  multiplier: number;
  reasoning: string;
}

export interface HeadingStrategy {
  competitorH2List: string[];
  commonH2s: string[];
  missingTopics: string[];
  recommendedH2Count: number;
  recommendedH3PerH2: number;
  suggestedH2s: string[];
}

export interface KeywordStrategy {
  competitorKeywords: string[];
  keywordGap: string[];
  longTailOpportunities: string[];
  recommendedKeywords: string[];
  usagePlan: Record<string, string>;
}

export interface MetaStrategy {
  competitorTitleFormats: string[];
  averageTitleLength: number;
  suggestedTitle: string;
  suggestedDescription: string;
  reasoning: string;
}

export interface FAQStrategy {
  competitorQuestions: string[];
  suggestedNewQuestions: string[];
  totalQuestionCount: number;
  hasSchemaRecommendation: boolean;
  schemaCode?: string;
}

export interface LinkStrategy {
  competitorAverageInternal: number;
  competitorAverageExternal: number;
  suggestedInternalLinks: Array<{ text: string; reason: string }>;
  suggestedExternalSources: string[];
}

export interface SnippetStrategy {
  winningSnippetType: string;
  suggestedAnswer: string;
  answerLength: number;
  formatting: 'paragraph' | 'list' | 'table';
}

export interface ContentGapStrategy {
  missedTopics: string[];
  underservedTopics: string[];
  trendingTopics2025: string[];
  userQuestions: string[];
  differentiationPoints: string[];
}

export interface StrategyChecklist {
  wordCountTarget: { value: number; met: boolean };
  h2CountTarget: { value: number; met: boolean };
  allHeadingsCovered: boolean;
  contentGapFilled: boolean;
  allKeywordsUsed: boolean;
  keywordGapClosed: boolean;
  allFAQsAnswered: boolean;
  newFAQsAdded: boolean;
  snippetOptimized: boolean;
  schemaAdded: boolean;
  internalLinksAdded: boolean;
  current2025Data: boolean;
  concreteExamples: boolean;
  comparisonTable: boolean;
  prosConsListAdded: boolean;
}

export interface AIStrategy {
  contentLength: ContentLengthStrategy;
  headingStructure: HeadingStrategy;
  keywords: KeywordStrategy;
  meta: MetaStrategy;
  faq: FAQStrategy;
  links: LinkStrategy;
  featuredSnippet: SnippetStrategy;
  contentGap: ContentGapStrategy;
  checklist: StrategyChecklist;
  criticalRules: string[];
}

// Tam Analiz Sonucu
export interface FullCompetitorAnalysisResult {
  stage1_input: {
    topic: string;
    mainKeyword: string;
    wordCount?: number;
    contentType: string;
    tone: string;
    purpose: string;
    searchIntent: 'informational' | 'commercial' | 'transactional' | 'navigational';
    strategyBrief: string;
  };
  stage2_scraping: {
    urls: string[];
    scrapeStatus: CompetitorScrapeStatus[];
    successCount: number;
    errorCount: number;
  };
  stage3_individualAnalysis: CompetitorAnalysis[];
  stage4_aggregateAnalysis: AggregateAnalysis;
  stage5_aiStrategy: AIStrategy;
  generatedAt: string;
}
