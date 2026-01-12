// Puppeteer ve Cheerio şu anda yüklü değil - kullanmak için:
// npm install puppeteer cheerio

// import puppeteer from 'puppeteer';
// import * as cheerio from 'cheerio';
import type {
  CompetitorAnalysis,
  HeadingStructure,
  ContentData,
  KeywordAnalysis,
  MetaInfo,
  FAQData,
  LinkStructure,
  FeaturedSnippet,
  ContentQuality,
} from '@/types/competitor';

export async function scrapeCompetitorURL(url: string): Promise<CompetitorAnalysis> {
  throw new Error(
    '❌ Rakip analizi şu anda kullanılamıyor.\n\n' +
    '📦 Kurulum için:\n' +
    '   npm install puppeteer cheerio\n\n' +
    '⏳ İlk kurulumda Chromium indirilecek (~150MB)\n\n' +
    '💡 Not: Puppeteer yüklendikten sonra bu dosyadaki\n' +
    '   yorumları kaldırın ve kodu aktif edin.'
  );
}

/* Puppeteer yüklendiğinde tüm bu kodu aktif edin ve yukarıdaki throw bloğunu silin:

export async function scrapeCompetitorURL(url: string): Promise<CompetitorAnalysis> {

  let browser;

  try {
    // Puppeteer ile sayfayı yükle
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });

    const html = await page.content();
    const $ = cheerio.load(html);

    // Tüm analizleri yap
    const headingStructure = analyzeHeadingStructure($);
    const contentData = analyzeContentData($);
    const keywordAnalysis = analyzeKeywords($, url);
    const metaInfo = analyzeMetaInfo($);
    const faqData = analyzeFAQ($);
    const linkStructure = analyzeLinkStructure($, url);
    const featuredSnippet = analyzeFeaturedSnippet($);
    const contentQuality = analyzeContentQuality($);

    return {
      url,
      scrapedAt: new Date().toISOString(),
      headingStructure,
      contentData,
      keywordAnalysis,
      metaInfo,
      faqData,
      linkStructure,
      featuredSnippet,
      contentQuality,
    };
  } catch (error) {
    throw new Error(`Failed to scrape ${url}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// 1. Başlık Yapısı Analizi
function analyzeHeadingStructure($: cheerio.CheerioAPI): HeadingStructure {
  const h1s = $('h1').map((_, el) => $(el).text().trim()).get();
  const h2s = $('h2').map((_, el) => $(el).text().trim()).get();
  const h3s = $('h3').map((_, el) => $(el).text().trim()).get();

  return {
    h1: h1s,
    h2: h2s,
    h3: h3s,
    h1Count: h1s.length,
    h2Count: h2s.length,
    h3Count: h3s.length,
    commonHeadings: [], // Bu aggregate analizde hesaplanacak
  };
}

// 2. İçerik Verisi Analizi
function analyzeContentData($: cheerio.CheerioAPI): ContentData {
  // Ana içerik alanını bul
  const content = $('article, main, .content, .post-content, [role="main"]').first();
  const text = content.length > 0 ? content.text() : $('body').text();

  const words = text.trim().split(/\s+/).filter(Boolean);
  const paragraphs = content.find('p').length || $('p').length;

  // H2'lere göre bölümleri ayır
  const sections: string[] = [];
  $('h2').each((_, el) => {
    let sectionText = '';
    $(el).nextUntil('h2').each((_, sibling) => {
      sectionText += $(sibling).text() + ' ';
    });
    sections.push(sectionText.trim());
  });

  const sectionLengths = sections.map(s => s.split(/\s+/).filter(Boolean).length);

  return {
    totalWordCount: words.length,
    sectionCount: sections.length || 1,
    sectionLengths,
    averageSectionLength: sectionLengths.length > 0
      ? Math.round(sectionLengths.reduce((a, b) => a + b, 0) / sectionLengths.length)
      : words.length,
    paragraphCount: paragraphs,
  };
}

// 3. Anahtar Kelime Analizi
function analyzeKeywords($: cheerio.CheerioAPI, url: string): KeywordAnalysis {
  const content = $('article, main, .content').first().text() || $('body').text();
  const words = content.toLowerCase().split(/\s+/).filter(w => w.length > 3);

  // Kelime frekansı
  const frequency: Record<string, number> = {};
  words.forEach(word => {
    const cleaned = word.replace(/[^a-zğüşıöçĞÜŞİÖÇ]/gi, '');
    if (cleaned.length > 3) {
      frequency[cleaned] = (frequency[cleaned] || 0) + 1;
    }
  });

  // En sık kullanılan kelimeleri al
  const sortedKeywords = Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 50)
    .map(([word]) => word);

  // Meta keywords varsa al
  const metaKeywords = $('meta[name="keywords"]').attr('content')?.split(',').map(k => k.trim()) || [];

  return {
    primaryKeyword: sortedKeywords[0] || '',
    secondaryKeywords: sortedKeywords.slice(1, 10),
    lsiKeywords: sortedKeywords.slice(10, 20),
    longTailKeywords: extractLongTailKeywords(content),
    keywordFrequency: frequency,
    keywordDensity: sortedKeywords[0] ? (frequency[sortedKeywords[0]] / words.length) * 100 : 0,
  };
}

function extractLongTailKeywords(text: string): string[] {
  const sentences = text.split(/[.!?]+/);
  const longTail: string[] = [];

  sentences.forEach(sentence => {
    const words = sentence.trim().split(/\s+/);
    if (words.length >= 3 && words.length <= 6) {
      longTail.push(words.join(' ').toLowerCase());
    }
  });

  return longTail.slice(0, 20);
}

// 4. Meta Bilgileri Analizi
function analyzeMetaInfo($: cheerio.CheerioAPI): MetaInfo {
  const title = $('title').text() || $('meta[property="og:title"]').attr('content') || '';
  const description = $('meta[name="description"]').attr('content') ||
                     $('meta[property="og:description"]').attr('content') || '';

  // Title formatını belirle
  let titleFormat: MetaInfo['titleFormat'] = 'standard';
  if (title.includes('?')) titleFormat = 'question';
  else if (/^\d+/.test(title) || title.includes('liste')) titleFormat = 'list';
  else if (title.toLowerCase().includes('nasıl') || title.toLowerCase().includes('how')) titleFormat = 'how-to';
  else if (title.includes('vs') || title.includes('karşı')) titleFormat = 'comparison';

  // CTA kontrolü
  const hasCTA = /satın al|kaydol|ücretsiz|indir|başla|dene/i.test($('body').text());

  return {
    title,
    titleLength: title.length,
    titleFormat,
    metaDescription: description,
    metaDescriptionLength: description.length,
    hasCTA,
  };
}

// 5. FAQ Analizi
function analyzeFAQ($: cheerio.CheerioAPI): FAQData {
  const questions: string[] = [];
  const answers: string[] = [];

  // Schema FAQ kontrolü
  const hasSchemaFAQ = $('script[type="application/ld+json"]').text().includes('FAQPage');

  // Yaygın FAQ pattern'leri
  $('h2, h3, h4, .faq-question, [class*="question"]').each((_, el) => {
    const text = $(el).text().trim();
    if (text.includes('?') || /^(ne|nasıl|neden|kim|nerede|ne zaman)/i.test(text)) {
      questions.push(text);

      // Cevabı bul
      let answer = '';
      $(el).nextUntil('h2, h3, h4, .faq-question').each((_, sibling) => {
        answer += $(sibling).text() + ' ';
      });
      answers.push(answer.trim());
    }
  });

  const answerLengths = answers.map(a => a.split(/\s+/).filter(Boolean).length);

  return {
    questions,
    answers,
    hasSchemaFAQ,
    questionCount: questions.length,
    averageAnswerLength: answerLengths.length > 0
      ? Math.round(answerLengths.reduce((a, b) => a + b, 0) / answerLengths.length)
      : 0,
  };
}

// 6. Link Yapısı Analizi
function analyzeLinkStructure($: cheerio.CheerioAPI, baseUrl: string): LinkStructure {
  const domain = new URL(baseUrl).hostname;

  const internalLinks: Array<{ url: string; text: string }> = [];
  const externalLinks: Array<{ url: string; text: string }> = [];
  const anchorTexts: string[] = [];

  $('a[href]').each((_, el) => {
    const href = $(el).attr('href');
    const text = $(el).text().trim();

    if (!href || href.startsWith('#')) return;

    anchorTexts.push(text);

    try {
      const linkUrl = new URL(href, baseUrl);
      const linkData = { url: linkUrl.href, text };

      if (linkUrl.hostname === domain) {
        internalLinks.push(linkData);
      } else {
        externalLinks.push(linkData);
      }
    } catch {
      // Geçersiz URL
    }
  });

  return {
    internalLinkCount: internalLinks.length,
    externalLinkCount: externalLinks.length,
    anchorTexts,
    internalLinks,
    externalLinks,
  };
}

// 7. Featured Snippet Analizi
function analyzeFeaturedSnippet($: cheerio.CheerioAPI): FeaturedSnippet {
  // İlk paragraf veya özet bölümü
  const firstPara = $('p').first().text().trim();
  const summary = $('.summary, .excerpt, .intro').first().text().trim();
  const snippetContent = summary || firstPara;

  let snippetType: FeaturedSnippet['snippetType'] = 'paragraph';

  // Liste kontrolü
  if ($('ol, ul').first().text().length > 50) {
    snippetType = 'list';
  }

  // Tablo kontrolü
  if ($('table').length > 0) {
    snippetType = 'table';
  }

  const words = snippetContent.split(/\s+/).filter(Boolean);

  return {
    snippetType,
    snippetLength: words.length,
    hasDirectAnswer: words.length > 0 && words.length <= 60,
    snippetContent: words.slice(0, 60).join(' '),
  };
}

// 8. İçerik Kalitesi Analizi
function analyzeContentQuality($: cheerio.CheerioAPI): ContentQuality {
  const bodyText = $('body').text();

  // Güncellik
  const datePatterns = [
    $('meta[property="article:modified_time"]').attr('content'),
    $('time[datetime]').attr('datetime'),
    $('.updated, .modified, .last-updated').text(),
  ].filter(Boolean);

  const hasUpdateDate = datePatterns.length > 0;
  const lastUpdated = datePatterns[0];

  // Kaynak kullanımı
  const sources = $('a[href*="http"]').filter((_, el) => {
    const text = $(el).text().toLowerCase();
    return text.includes('kaynak') || text.includes('source') || $(el).attr('rel') === 'nofollow';
  });

  // Örnekler
  const examples = bodyText.match(/örneğin|mesela|şöyle ki|gibi|such as|for example/gi) || [];

  // İstatistikler
  const statistics = bodyText.match(/\d+%|\d+ kişi|\d+ yıl|\d+ milyon/gi) || [];

  // Görseller ve videolar
  const images = $('img').length;
  const videos = $('video, iframe[src*="youtube"], iframe[src*="vimeo"]').length;

  return {
    hasUpdateDate,
    lastUpdated,
    hasSourceCitations: sources.length > 0,
    sourceCount: sources.length,
    hasExamples: examples.length > 0,
    exampleCount: examples.length,
    hasExpertOpinion: /uzman|araştırmacı|profesör|doktor|expert/i.test(bodyText),
    hasStatistics: statistics.length > 0,
    statisticCount: statistics.length,
    hasImages: images > 0,
    imageCount: images,
    hasVideos: videos > 0,
    videoCount: videos,
  };
}
*/
