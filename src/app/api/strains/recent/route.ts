import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/strains/recent - Get recently rated strains
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '5', 10);

    // Get the most recent ratings with their strains
    const recentRatings = await prisma.rating.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      take: limit * 2,
      include: {
        strain: {
          select: {
            id: true,
            name: true,
            genetics: true,
            strainType: true,
            imageUrl: true,
          },
        },
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    // Dedupe by strain ID
    const seenStrains = new Set<string>();
    const recentStrains = [];

    for (const rating of recentRatings) {
      if (!seenStrains.has(rating.strain.id)) {
        seenStrains.add(rating.strain.id);
        recentStrains.push({
          id: rating.strain.id,
          name: rating.strain.name,
          genetics: rating.strain.genetics,
          strainType: rating.strain.strainType,
          imageUrl: rating.strain.imageUrl,
          ratedBy: rating.user?.name || 'Anonymous',
          ratedAt: rating.createdAt,
          overallRating: rating.overallRating,
        });
        if (recentStrains.length >= limit) break;
      }
    }

    return NextResponse.json(recentStrains);
  } catch (error) {
    console.error('Error fetching recent strains:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recent strains' },
      { status: 500 }
    );
  }
}
