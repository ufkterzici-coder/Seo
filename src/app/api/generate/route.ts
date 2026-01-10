import { NextRequest, NextResponse } from 'next/server';
import { generateSEOContent } from '@/lib/ai/seo-expert';
import { GenerateContentRequest } from '@/types/api';

export async function POST(request: NextRequest) {
  try {
    const body: GenerateContentRequest = await request.json();

    // Validate required fields
    if (!body.topic || !body.mainKeyword) {
      return NextResponse.json(
        { error: 'Topic and mainKeyword are required' },
        { status: 400 }
      );
    }

    // Generate content using Groq AI
    const result = await generateSEOContent(body);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Generate API Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate content' },
      { status: 500 }
    );
  }
}
