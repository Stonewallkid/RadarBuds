import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/strains/top - Get top rated strains
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    // Get strains with their average ratings
    const strains = await prisma.strain.findMany({
      include: {
        ratings: {
          select: {
            overallRating: true,
          },
        },
      },
    });

    // Calculate average rating and filter/sort
    const strainsWithAvg = strains
      .filter(strain => strain.ratings.length >= 3) // Minimum 3 ratings
      .map(strain => {
        const avgRating = strain.ratings.reduce((sum, r) => sum + r.overallRating, 0) / strain.ratings.length;
        return {
          id: strain.id,
          name: strain.name,
          genetics: strain.genetics,
          strainType: strain.strainType,
          thcPercent: strain.thcPercent,
          cbdPercent: strain.cbdPercent,
          imageUrl: strain.imageUrl,
          avgRating: Math.round(avgRating * 10) / 10,
          ratingCount: strain.ratings.length,
        };
      })
      .sort((a, b) => b.avgRating - a.avgRating)
      .slice(0, limit);

    return NextResponse.json(strainsWithAvg);
  } catch (error) {
    console.error('Error fetching top strains:', error);
    return NextResponse.json(
      { error: 'Failed to fetch top strains' },
      { status: 500 }
    );
  }
}
