import { NextRequest, NextResponse } from 'next/server';
import { scrapeCompetitorURL } from '@/lib/scraper/competitor-scraper';
import { calculateAggregateAnalysis } from '@/lib/analyzer/aggregate-analyzer';
import { generateAIStrategy } from '@/lib/analyzer/strategy-generator';
import type {
  FullCompetitorAnalysisResult,
  CompetitorScrapeStatus,
  CompetitorAnalysis,
} from '@/types/competitor';

export const maxDuration = 300; // 5 dakika timeout

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      // Stage 1
      topic,
      mainKeyword,
      wordCount,
      contentType,
      tone,
      purpose,
      // Stage 2
      urls,
    } = body;

    console.log('[Full Analysis] Starting comprehensive competitor analysis...');
    console.log('Topic:', topic);
    console.log('Main Keyword:', mainKeyword);
    console.log('Competitor URLs:', urls);

    // Validasyon
    if (!topic || !mainKeyword || !urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: topic, mainKeyword, urls' },
        { status: 400 }
      );
    }

    // STAGE 1: Giriş Verilerini İşle
    console.log('[Stage 1] Processing input data...');

    const searchIntent = determineSearchIntent(topic, contentType, purpose);
    const strategyBrief = `${topic} konusunda ${contentType} türünde ${tone} tonunda içerik oluşturulacak. Amaç: ${purpose}. Hedef anahtar kelime: ${mainKeyword}.`;

    const stage1 = {
      topic,
      mainKeyword,
      wordCount,
      contentType,
      tone,
      purpose,
      searchIntent,
      strategyBrief,
    };

    // STAGE 2: URL Scraping
    console.log('[Stage 2] Starting URL scraping...');

    const scrapeStatus: CompetitorScrapeStatus[] = urls.map((url: string) => ({
      url,
      status: 'pending' as const,
    }));

    const competitorAnalyses: CompetitorAnalysis[] = [];
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      console.log(`[Stage 2] Scraping ${i + 1}/${urls.length}: ${url}`);

      try {
        const analysis = await scrapeCompetitorURL(url);
        competitorAnalyses.push(analysis);
        scrapeStatus[i].status = 'success';
        successCount++;
        console.log(`✅ Successfully scraped: ${url}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        scrapeStatus[i].status = 'error';
        scrapeStatus[i].error = errorMessage;
        errorCount++;
        console.log(`❌ Failed to scrape: ${url} - ${errorMessage}`);
      }
    }

    if (competitorAnalyses.length === 0) {
      return NextResponse.json(
        { error: 'Failed to scrape any competitor URLs' },
        { status: 500 }
      );
    }

    const stage2 = {
      urls,
      scrapeStatus,
      successCount,
      errorCount,
    };

    // STAGE 3: Individual Analysis (already done in scraping)
    console.log('[Stage 3] Individual analyses completed during scraping');
    const stage3 = competitorAnalyses;

    // STAGE 4: Aggregate Analysis
    console.log('[Stage 4] Calculating aggregate analysis...');
    const stage4 = calculateAggregateAnalysis(competitorAnalyses);
    console.log('Average word count:', stage4.averageWordCount);
    console.log('Average H2 count:', stage4.averageH2Count);

    // STAGE 5: AI Strategy Generation
    console.log('[Stage 5] Generating AI strategy recommendations...');
    const stage5 = await generateAIStrategy(topic, mainKeyword, competitorAnalyses, stage4);
    console.log('Recommended word count:', stage5.contentLength.recommendedWordCount);
    console.log('Recommended H2 count:', stage5.headingStructure.recommendedH2Count);

    const result: FullCompetitorAnalysisResult = {
      stage1_input: stage1,
      stage2_scraping: stage2,
      stage3_individualAnalysis: stage3,
      stage4_aggregateAnalysis: stage4,
      stage5_aiStrategy: stage5,
      generatedAt: new Date().toISOString(),
    };

    console.log('[Full Analysis] ✅ Analysis completed successfully!');

    return NextResponse.json(result);
  } catch (error) {
    console.error('[Full Analysis] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to complete analysis',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

function determineSearchIntent(
  topic: string,
  contentType: string,
  purpose: string
): 'informational' | 'commercial' | 'transactional' | 'navigational' {
  const text = `${topic} ${contentType} ${purpose}`.toLowerCase();

  if (text.includes('satın') || text.includes('fiyat') || text.includes('indir')) {
    return 'transactional';
  }
  if (text.includes('karşılaştır') || text.includes('en iyi') || text.includes('review')) {
    return 'commercial';
  }
  if (text.includes('marka') || text.includes('şirket') || text.includes('hakkında')) {
    return 'navigational';
  }
  return 'informational';
}
