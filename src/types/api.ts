import { SearchIntent } from './content';
import { HeadingOutline, ContentSection, FAQ, ImageSuggestion, InternalLink } from './content';

export interface GenerateContentRequest {
  topic: string;
  mainKeyword: string;
  wordCount: number;
  contentType: string;
  tone: string;
  intent?: string;
  aiProvider?: string;
  secondaryKeywords?: string[];
  competitorUrls?: string[];
  additionalInstructions?: string;
}

export interface GenerateContentResponse {
  meta: {
    title: string;
    description: string;
    slug: string;
  };
  seo: {
    primaryKeyword: string;
    secondaryKeywords: string[];
    lsiKeywords: string[];
    searchIntent: SearchIntent;
    keywordDensity: number;
  };
  structure: {
    h1: string;
    outline: HeadingOutline[];
  };
  content: {
    introduction: string;
    sections: ContentSection[];
    faq: FAQ[];
    conclusion: string;
  };
  featuredSnippet: string;
  images: ImageSuggestion[];
  internalLinks: InternalLink[];
  schema: {
    article: any;
    faq: any;
  };
  seoScore: {
    overall: number;
    checks: Record<string, boolean>;
  };
  fullMarkdown: string;
}

export interface AnalyzeRequest {
  urls: string[];
}

export interface AnalyzeResponse {
  competitors: Array<{
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
  }>;
  commonKeywords: string[];
  averageStats: {
    wordCount: number;
    headingCount: number;
    imageCount: number;
  };
}
