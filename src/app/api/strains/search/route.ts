import { NextRequest, NextResponse } from 'next/server';
import { searchStrains, getPopularStrains } from '@/lib/cannabis-api';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const query = searchParams.get('q') || '';
  const limit = parseInt(searchParams.get('limit') || '10', 10);

  try {
    let results;

    if (!query.trim()) {
      // Return popular strains when no query
      results = await getPopularStrains(limit);
    } else {
      // Search by name
      results = await searchStrains({
        query,
        limit,
      });
    }

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Strain search error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to search strains' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, limit, effects, aromas, minThc, maxThc } = body;

    const results = await searchStrains({
      query,
      limit: limit || 10,
      effects,
      aromas,
      minThc,
      maxThc,
    });

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Strain search error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to search strains' },
      { status: 500 }
    );
  }
}
