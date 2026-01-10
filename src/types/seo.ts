export interface SEOScore {
  overall: number;
  checks: {
    keywordInTitle: boolean;
    keywordInH1: boolean;
    keywordInFirst100Words: boolean;
    keywordDensity: boolean;
    metaDescriptionOptimized: boolean;
    headingHierarchy: boolean;
    internalLinks: boolean;
    imageAltTexts: boolean;
    readabilityScore: boolean;
    contentLength: boolean;
    lsiKeywordsUsed: boolean;
    faqIncluded: boolean;
  };
}

export interface KeywordAnalysis {
  primaryKeyword: string;
  secondaryKeywords: string[];
  lsiKeywords: string[];
  searchIntent: string;
  keywordDensity: number;
}

export interface CompetitorData {
  url: string;
  title: string;
  wordCount: number;
  headingCount: number;
  imageCount: number;
  keywords: string[];
  headings: {
    h1: string[];
    h2: string[];
    h3: string[];
  };
}
