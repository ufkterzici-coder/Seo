import { NextRequest, NextResponse } from 'next/server';
import {
  getAllContents,
  createContent,
  getContentById,
  updateContent,
  deleteContent,
} from '@/lib/db/queries';
import { slugify } from '@/lib/utils/slug';
import { readingTime } from '@/lib/utils/format';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const contents = getAllContents(status || undefined);
    return NextResponse.json(contents);
  } catch (error) {
    console.error('GET Contents Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contents' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Generate slug if not provided
    if (!body.slug && body.title) {
      body.slug = slugify(body.title);
    }

    // Calculate reading time
    if (body.word_count) {
      body.reading_time = readingTime(body.word_count);
    }

    const content = createContent(body);
    return NextResponse.json(content);
  } catch (error) {
    console.error('POST Content Error:', error);
    return NextResponse.json(
      { error: 'Failed to create content' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Content ID is required' },
        { status: 400 }
      );
    }

    // Update slug if title changed
    if (data.title && !data.slug) {
      data.slug = slugify(data.title);
    }

    // Recalculate reading time
    if (data.word_count) {
      data.reading_time = readingTime(data.word_count);
    }

    const content = updateContent(id, data);
    return NextResponse.json(content);
  } catch (error) {
    console.error('PUT Content Error:', error);
    return NextResponse.json(
      { error: 'Failed to update content' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Content ID is required' },
        { status: 400 }
      );
    }

    const success = deleteContent(id);
    return NextResponse.json({ success });
  } catch (error) {
    console.error('DELETE Content Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete content' },
      { status: 500 }
    );
  }
}
