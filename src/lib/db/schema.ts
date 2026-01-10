// JSON-based storage schema definition
// No SQL schema needed for file-based storage

export interface DatabaseSchema {
  contents: Array<{
    id: string;
    title: string;
    slug: string;
    meta_title: string;
    meta_description: string;
    content_markdown: string;
    content_html: string;
    main_keyword: string;
    secondary_keywords: string;
    lsi_keywords: string;
    search_intent: string;
    heading_structure: string;
    schema_article: string;
    schema_faq: string;
    featured_snippet: string;
    images: string;
    internal_links: string;
    seo_score: number;
    seo_checks: string;
    word_count: number;
    reading_time: number;
    status: string;
    created_at: string;
    updated_at: string;
    published_at: string | null;
  }>;
  templates: Array<{
    id: string;
    name: string;
    description: string;
    content_type: string;
    tone: string;
    structure: string;
    instructions: string;
    is_default: number;
    created_at: string;
  }>;
}
