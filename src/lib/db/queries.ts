import { getDb, updateDb } from './index';
import { Content } from '@/types/content';
import { nanoid } from 'nanoid';

export function getAllContents(status?: string): Content[] {
  const db = getDb();
  let contents = db.contents;

  if (status) {
    contents = contents.filter((c: Content) => c.status === status);
  }

  return contents.sort((a: Content, b: Content) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export function getContentById(id: string): Content | undefined {
  const db = getDb();
  return db.contents.find((c: Content) => c.id === id);
}

export function getContentBySlug(slug: string): Content | undefined {
  const db = getDb();
  return db.contents.find((c: Content) => c.slug === slug);
}

export function createContent(data: Partial<Content>): Content {
  const id = nanoid();
  const now = new Date().toISOString();

  const newContent: Content = {
    id,
    title: data.title || '',
    slug: data.slug || '',
    meta_title: data.meta_title || '',
    meta_description: data.meta_description || '',
    content_markdown: data.content_markdown || '',
    content_html: data.content_html || '',
    main_keyword: data.main_keyword || '',
    secondary_keywords: data.secondary_keywords || '[]',
    lsi_keywords: data.lsi_keywords || '[]',
    search_intent: data.search_intent || 'informational',
    heading_structure: data.heading_structure || '[]',
    schema_article: data.schema_article || '{}',
    schema_faq: data.schema_faq || '{}',
    featured_snippet: data.featured_snippet || '',
    images: data.images || '[]',
    internal_links: data.internal_links || '[]',
    seo_score: data.seo_score || 0,
    seo_checks: data.seo_checks || '{}',
    word_count: data.word_count || 0,
    reading_time: data.reading_time || 0,
    status: data.status || 'draft',
    created_at: now,
    updated_at: now,
    published_at: data.published_at || null,
  };

  updateDb((db) => {
    db.contents.push(newContent);
  });

  return newContent;
}

export function updateContent(id: string, data: Partial<Content>): Content | undefined {
  const now = new Date().toISOString();
  let updatedContent: Content | undefined;

  updateDb((db) => {
    const index = db.contents.findIndex((c: Content) => c.id === id);
    if (index !== -1) {
      db.contents[index] = {
        ...db.contents[index],
        ...data,
        id, // Preserve ID
        created_at: db.contents[index].created_at, // Preserve created_at
        updated_at: now,
      };
      updatedContent = db.contents[index];
    }
  });

  return updatedContent;
}

export function deleteContent(id: string): boolean {
  let deleted = false;

  updateDb((db) => {
    const index = db.contents.findIndex((c: Content) => c.id === id);
    if (index !== -1) {
      db.contents.splice(index, 1);
      deleted = true;
    }
  });

  return deleted;
}

export function getContentStats() {
  const db = getDb();
  const contents = db.contents;

  const total = contents.length;
  const published = contents.filter((c: Content) => c.status === 'published').length;
  const drafts = contents.filter((c: Content) => c.status === 'draft').length;

  const scores = contents
    .map((c: Content) => c.seo_score)
    .filter((score: number) => score > 0);

  const avgScore = scores.length > 0
    ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length)
    : 0;

  return {
    total,
    published,
    drafts,
    avgScore,
  };
}
