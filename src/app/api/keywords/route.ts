import { NextRequest, NextResponse } from 'next/server';
import { generateWithGroq } from '@/lib/ai/groq';

const KEYWORD_SUGGESTION_PROMPT = `Sen bir SEO anahtar kelime uzmanısın. Verilen konu için en uygun Türkçe anahtar kelimeleri öner.

Kurallar:
- SADECE geçerli JSON formatında yanıt ver
- 15-20 adet alakalı anahtar kelime öner
- Hem kısa hem uzun kuyruk (long-tail) kelimeler olsun
- Aramada popüler olan kelimeleri öner
- TÜRKÇE dilbilgisi kurallarına uy
- Kelimeler küçük harfle olsun

JSON formatı:
{
  "keywords": ["kelime1", "kelime2", "kelime3", ...]
}

Sadece JSON döndür, başka hiçbir şey yazma.`;

export async function POST(request: NextRequest) {
  try {
    const { topic } = await request.json();

    if (!topic || topic.trim().length < 3) {
      return NextResponse.json(
        { error: 'Konu en az 3 karakter olmalıdır' },
        { status: 400 }
      );
    }

    console.log('=== Keyword Suggestion API ===');
    console.log('Topic:', topic);

    const prompt = `Konu: "${topic}"\n\nBu konu için SEO uyumlu Türkçe anahtar kelimeler öner.`;

    const response = await generateWithGroq(prompt, KEYWORD_SUGGESTION_PROMPT, 'llama-3.3-70b-versatile');

    console.log('Raw response:', response.substring(0, 200));

    // Parse JSON response
    let parsed;
    try {
      // Try to extract JSON
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        parsed = JSON.parse(response);
      }
    } catch (error) {
      console.error('Failed to parse keyword response:', error);
      throw new Error('Invalid response format');
    }

    if (!parsed.keywords || !Array.isArray(parsed.keywords)) {
      throw new Error('Keywords not found in response');
    }

    console.log('Keywords generated:', parsed.keywords.length);

    return NextResponse.json({
      keywords: parsed.keywords,
      count: parsed.keywords.length,
    });
  } catch (error: any) {
    console.error('Keyword Suggestion Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate keywords' },
      { status: 500 }
    );
  }
}
