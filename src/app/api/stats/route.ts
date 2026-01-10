import { NextResponse } from 'next/server';
import { getContentStats } from '@/lib/db/queries';

export async function GET() {
  try {
    const stats = getContentStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error('GET Stats Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
