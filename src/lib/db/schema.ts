export const CREATE_CONTENTS_TABLE = `
CREATE TABLE IF NOT EXISTS contents (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT UNIQUE,
    meta_title TEXT,
    meta_description TEXT,
    content_markdown TEXT,
    content_html TEXT,
    main_keyword TEXT,
    secondary_keywords TEXT,
    lsi_keywords TEXT,
    search_intent TEXT,
    heading_structure TEXT,
    schema_article TEXT,
    schema_faq TEXT,
    featured_snippet TEXT,
    images TEXT,
    internal_links TEXT,
    seo_score INTEGER,
    seo_checks TEXT,
    word_count INTEGER,
    reading_time INTEGER,
    status TEXT DEFAULT 'draft',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    published_at DATETIME
);
`;

export const CREATE_TEMPLATES_TABLE = `
CREATE TABLE IF NOT EXISTS templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    content_type TEXT,
    tone TEXT,
    structure TEXT,
    instructions TEXT,
    is_default INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`;

export const CREATE_ANALYTICS_TABLE = `
CREATE TABLE IF NOT EXISTS analytics (
    id TEXT PRIMARY KEY,
    content_id TEXT,
    views INTEGER DEFAULT 0,
    avg_time_on_page INTEGER,
    bounce_rate REAL,
    recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (content_id) REFERENCES contents(id)
);
`;

export const CREATE_INDEXES = [
  'CREATE INDEX IF NOT EXISTS idx_contents_status ON contents(status);',
  'CREATE INDEX IF NOT EXISTS idx_contents_keyword ON contents(main_keyword);',
  'CREATE INDEX IF NOT EXISTS idx_contents_created ON contents(created_at);',
];
