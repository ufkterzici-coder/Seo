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

    console.log('=== Generate API called ===');
    console.log('Topic:', body.topic);
    console.log('Keyword:', body.mainKeyword);

    // Generate content using Groq AI
    const result = await generateSEOContent(body);

    console.log('=== Content generated successfully ===');
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('=== Generate API Error ===');
    console.error('Error:', error);
    console.error('Stack:', error.stack);
    
    return NextResponse.json(
      { 
        error: error.message || 'Failed to generate content',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
