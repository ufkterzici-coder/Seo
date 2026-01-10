export type ContentStatus = 'draft' | 'published';
export type ContentType = 'article' | 'blog' | 'product' | 'landing';
export type ToneType = 'professional' | 'casual' | 'expert' | 'friendly';
export type SearchIntent = 'informational' | 'transactional' | 'commercial' | 'navigational';

export interface Content {
  id: string;
  title: string;
  slug: string;
  meta_title: string;
  meta_description: string;
  content_markdown: string;
  content_html: string;
  main_keyword: string;
  secondary_keywords: string; // JSON array
  lsi_keywords: string; // JSON array
  search_intent: SearchIntent;
  heading_structure: string; // JSON
  schema_article: string; // JSON
  schema_faq: string; // JSON
  featured_snippet: string;
  images: string; // JSON array
  internal_links: string; // JSON array
  seo_score: number;
  seo_checks: string; // JSON
  word_count: number;
  reading_time: number;
  status: ContentStatus;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

export interface HeadingOutline {
  h2: string;
  h3: string[];
}

export interface ContentSection {
  heading: string;
  content: string;
  subsections?: {
    heading: string;
    content: string;
  }[];
}

export interface FAQ {
  question: string;
  answer: string;
}

export interface ImageSuggestion {
  position: string;
  prompt: string;
  altText: string;
  filename: string;
}

export interface InternalLink {
  anchorText: string;
  suggestedTarget: string;
}
