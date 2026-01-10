import { getDb } from './index';
import { Content } from '@/types/content';
import { nanoid } from 'nanoid';

export function getAllContents(status?: string): Content[] {
  const db = getDb();
  const query = status
    ? db.prepare('SELECT * FROM contents WHERE status = ? ORDER BY created_at DESC')
    : db.prepare('SELECT * FROM contents ORDER BY created_at DESC');

  return status ? query.all(status) as Content[] : query.all() as Content[];
}

export function getContentById(id: string): Content | undefined {
  const db = getDb();
  const query = db.prepare('SELECT * FROM contents WHERE id = ?');
  return query.get(id) as Content | undefined;
}

export function getContentBySlug(slug: string): Content | undefined {
  const db = getDb();
  const query = db.prepare('SELECT * FROM contents WHERE slug = ?');
  return query.get(slug) as Content | undefined;
}

export function createContent(data: Partial<Content>): Content {
  const db = getDb();
  const id = nanoid();
  const now = new Date().toISOString();

  const query = db.prepare(`
    INSERT INTO contents (
      id, title, slug, meta_title, meta_description, content_markdown, content_html,
      main_keyword, secondary_keywords, lsi_keywords, search_intent, heading_structure,
      schema_article, schema_faq, featured_snippet, images, internal_links,
      seo_score, seo_checks, word_count, reading_time, status, created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    )
  `);

  query.run(
    id,
    data.title || '',
    data.slug || '',
    data.meta_title || '',
    data.meta_description || '',
    data.content_markdown || '',
    data.content_html || '',
    data.main_keyword || '',
    data.secondary_keywords || '[]',
    data.lsi_keywords || '[]',
    data.search_intent || 'informational',
    data.heading_structure || '[]',
    data.schema_article || '{}',
    data.schema_faq || '{}',
    data.featured_snippet || '',
    data.images || '[]',
    data.internal_links || '[]',
    data.seo_score || 0,
    data.seo_checks || '{}',
    data.word_count || 0,
    data.reading_time || 0,
    data.status || 'draft',
    now,
    now
  );

  return getContentById(id)!;
}

export function updateContent(id: string, data: Partial<Content>): Content | undefined {
  const db = getDb();
  const now = new Date().toISOString();

  const fields: string[] = [];
  const values: any[] = [];

  Object.entries(data).forEach(([key, value]) => {
    if (key !== 'id' && key !== 'created_at') {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  });

  fields.push('updated_at = ?');
  values.push(now);
  values.push(id);

  const query = db.prepare(`UPDATE contents SET ${fields.join(', ')} WHERE id = ?`);
  query.run(...values);

  return getContentById(id);
}

export function deleteContent(id: string): boolean {
  const db = getDb();
  const query = db.prepare('DELETE FROM contents WHERE id = ?');
  const result = query.run(id);
  return result.changes > 0;
}

export function getContentStats() {
  const db = getDb();

  const total = db.prepare('SELECT COUNT(*) as count FROM contents').get() as { count: number };
  const published = db.prepare('SELECT COUNT(*) as count FROM contents WHERE status = ?').get('published') as { count: number };
  const drafts = db.prepare('SELECT COUNT(*) as count FROM contents WHERE status = ?').get('draft') as { count: number };
  const avgScore = db.prepare('SELECT AVG(seo_score) as avg FROM contents WHERE seo_score > 0').get() as { avg: number | null };

  return {
    total: total.count,
    published: published.count,
    drafts: drafts.count,
    avgScore: Math.round(avgScore.avg || 0),
  };
}
