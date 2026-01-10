import { NextRequest, NextResponse } from 'next/server';

// Basit bir analiz fonksiyonu (Puppeteer olmadan)
export async function POST(request: NextRequest) {
  try {
    const { urls } = await request.json();

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json(
        { error: 'URLs array is required' },
        { status: 400 }
      );
    }

    // Mock data - gerçek scraping için Puppeteer gerekli
    const competitors = urls.map(url => ({
      url,
      title: 'Example Title',
      wordCount: 1500,
      headingCount: 8,
      imageCount: 5,
      keywords: ['keyword1', 'keyword2', 'keyword3'],
      headings: {
        h1: ['Main Heading'],
        h2: ['Section 1', 'Section 2', 'Section 3'],
        h3: ['Subsection 1', 'Subsection 2'],
      },
    }));

    const commonKeywords = ['keyword1', 'keyword2', 'keyword3'];
    const averageStats = {
      wordCount: 1500,
      headingCount: 8,
      imageCount: 5,
    };

    return NextResponse.json({
      competitors,
      commonKeywords,
      averageStats,
    });
  } catch (error) {
    console.error('Analyze API Error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze competitors' },
      { status: 500 }
    );
  }
}
