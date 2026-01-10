import { SEOScore } from '@/types/seo';

export function calculateSEOScore(content: {
  title: string;
  meta_description: string;
  content_markdown: string;
  main_keyword: string;
  secondary_keywords?: string[];
  lsi_keywords?: string[];
  heading_structure?: any;
  images?: any[];
  internal_links?: any[];
  faq?: any[];
}): SEOScore {
  const checks = {
    keywordInTitle: checkKeywordInTitle(content.title, content.main_keyword),
    keywordInH1: checkKeywordInH1(content.content_markdown, content.main_keyword),
    keywordInFirst100Words: checkKeywordInFirst100Words(content.content_markdown, content.main_keyword),
    keywordDensity: checkKeywordDensity(content.content_markdown, content.main_keyword),
    metaDescriptionOptimized: checkMetaDescription(content.meta_description, content.main_keyword),
    headingHierarchy: checkHeadingHierarchy(content.content_markdown),
    internalLinks: (content.internal_links?.length || 0) >= 2,
    imageAltTexts: (content.images?.length || 0) > 0,
    readabilityScore: checkReadability(content.content_markdown),
    contentLength: checkContentLength(content.content_markdown),
    lsiKeywordsUsed: (content.lsi_keywords?.length || 0) >= 3,
    faqIncluded: (content.faq?.length || 0) >= 3,
  };

  const trueCount = Object.values(checks).filter(Boolean).length;
  const overall = Math.round((trueCount / Object.keys(checks).length) * 100);

  return { overall, checks };
}

function checkKeywordInTitle(title: string, keyword: string): boolean {
  return title.toLowerCase().includes(keyword.toLowerCase());
}

function checkKeywordInH1(markdown: string, keyword: string): boolean {
  const h1Match = markdown.match(/^#\s+(.+)$/m);
  if (!h1Match) return false;
  return h1Match[1].toLowerCase().includes(keyword.toLowerCase());
}

function checkKeywordInFirst100Words(markdown: string, keyword: string): boolean {
  const text = markdown.replace(/[#*_`]/g, '');
  const words = text.split(/\s+/).slice(0, 100).join(' ');
  return words.toLowerCase().includes(keyword.toLowerCase());
}

function checkKeywordDensity(markdown: string, keyword: string): boolean {
  const text = markdown.replace(/[#*_`]/g, '').toLowerCase();
  const words = text.split(/\s+/);
  const keywordCount = (text.match(new RegExp(keyword.toLowerCase(), 'g')) || []).length;
  const density = (keywordCount / words.length) * 100;
  return density >= 0.5 && density <= 2.5;
}

function checkMetaDescription(description: string, keyword: string): boolean {
  return (
    description.length >= 120 &&
    description.length <= 155 &&
    description.toLowerCase().includes(keyword.toLowerCase())
  );
}

function checkHeadingHierarchy(markdown: string): boolean {
  const headings = markdown.match(/^#+\s+.+$/gm) || [];
  return headings.length >= 4;
}

function checkReadability(markdown: string): boolean {
  const text = markdown.replace(/[#*_`]/g, '');
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = text.split(/\s+/);
  const avgWordsPerSentence = words.length / sentences.length;
  return avgWordsPerSentence <= 25; // İyi okunabilirlik için ortalama cümle uzunluğu
}

function checkContentLength(markdown: string): boolean {
  const text = markdown.replace(/[#*_`]/g, '');
  const words = text.split(/\s+/).filter(w => w.length > 0);
  return words.length >= 800;
}
