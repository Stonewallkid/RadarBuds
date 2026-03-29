import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { EffectRatings, createEmptyRatings, EFFECT_DIMENSIONS } from '@/types/strain';

// GET /api/strains/[id]/stats - Get aggregated stats for a strain
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // Get all ratings for this strain
    const ratings = await prisma.rating.findMany({
      where: { strainId: id },
      select: {
        effectRatings: true,
        overallRating: true,
      },
    });

    if (ratings.length === 0) {
      return NextResponse.json({
        avgProfile: createEmptyRatings(),
        ratingCount: 0,
        avgOverallRating: 0,
      });
    }

    // Calculate average effect ratings
    const avgProfile = createEmptyRatings();

    for (const rating of ratings) {
      const effectRatings = rating.effectRatings as EffectRatings;
      for (const dim of EFFECT_DIMENSIONS) {
        avgProfile[dim] += effectRatings[dim] || 0;
      }
    }

    for (const dim of EFFECT_DIMENSIONS) {
      avgProfile[dim] = Math.round((avgProfile[dim] / ratings.length) * 10) / 10;
    }

    // Calculate average overall rating
    const avgOverallRating = ratings.reduce((sum, r) => sum + r.overallRating, 0) / ratings.length;

    return NextResponse.json({
      avgProfile,
      ratingCount: ratings.length,
      avgOverallRating: Math.round(avgOverallRating * 10) / 10,
    });
  } catch (error) {
    console.error('Error fetching strain stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch strain stats' },
      { status: 500 }
    );
  }
}
