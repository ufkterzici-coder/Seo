import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.GROQ_API_KEY;
  
  return NextResponse.json({
    hasGroqKey: !!apiKey,
    keyPrefix: apiKey ? apiKey.substring(0, 10) + '...' : 'NOT FOUND',
    allEnvVars: Object.keys(process.env).filter(k => 
      k.includes('GROQ') || k.includes('SITE') || k.includes('ADMIN')
    ),
  });
}
