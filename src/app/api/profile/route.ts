import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { EFFECT_DIMENSIONS, EffectRatings, EffectDimension } from '@/types/strain';

interface RatingWithStrain {
  id: string;
  effectRatings: unknown;
  overallRating: number;
  strainType: string;
  budAppearance: string | null;
  strain: {
    id: string;
    name: string;
    genetics: string | null;
    strainType: string;
  };
}

// GET /api/profile?userId=xxx - Get user's effect profile
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Get all ratings for this user
    const ratings: RatingWithStrain[] = await prisma.rating.findMany({
      where: { userId },
      include: {
        strain: {
          select: {
            id: true,
            name: true,
            genetics: true,
            strainType: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (ratings.length === 0) {
      return NextResponse.json({
        hasProfile: false,
        message: 'No ratings yet. Rate some strains to build your effect profile!',
      });
    }

    // Calculate average effect profile
    const avgProfile: EffectRatings = {} as EffectRatings;
    for (const dim of EFFECT_DIMENSIONS) {
      const values = ratings.map((r) => {
        const effectRatings = r.effectRatings as Record<string, number>;
        return effectRatings[dim] || 0;
      });
      avgProfile[dim as EffectDimension] = values.reduce((a, b) => a + b, 0) / values.length;
    }

    // Find preferred dimensions (highest averages)
    const sortedDimensions = [...EFFECT_DIMENSIONS].sort(
      (a, b) => avgProfile[b as EffectDimension] - avgProfile[a as EffectDimension]
    );
    const topDimensions = sortedDimensions.slice(0, 5);
    const lowDimensions = sortedDimensions.slice(-5).reverse();

    // Count strain types
    const typeCounts: Record<string, number> = {};
    for (const rating of ratings) {
      typeCounts[rating.strainType] = (typeCounts[rating.strainType] || 0) + 1;
    }
    const preferredTypes = Object.entries(typeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([type, count]) => ({ type, count }));

    // Count genetics and find preferred ones (based on high ratings)
    const geneticsStats: Record<string, { count: number; totalRating: number }> = {};
    for (const rating of ratings) {
      const genetics = rating.strain.genetics || 'Unknown';
      if (!geneticsStats[genetics]) {
        geneticsStats[genetics] = { count: 0, totalRating: 0 };
      }
      geneticsStats[genetics].count++;
      geneticsStats[genetics].totalRating += rating.overallRating;
    }
    const preferredGenetics = Object.entries(geneticsStats)
      .map(([genetics, stats]) => ({
        genetics,
        count: stats.count,
        avgRating: Math.round((stats.totalRating / stats.count) * 10) / 10,
      }))
      .filter((g) => g.avgRating >= 7) // Only genetics they rated 7+
      .sort((a, b) => b.avgRating - a.avgRating || b.count - a.count)
      .slice(0, 5);

    // Calculate average overall rating
    const avgOverallRating =
      ratings.reduce((sum, r) => sum + r.overallRating, 0) / ratings.length;

    // Get highest rated strains
    const topRatedStrains = [...ratings]
      .sort((a, b) => b.overallRating - a.overallRating)
      .slice(0, 5)
      .map((r) => ({
        ratingId: r.id,
        strainId: r.strain.id,
        name: r.strain.name,
        genetics: r.strain.genetics,
        strainType: r.strain.strainType,
        rating: r.overallRating,
      }));

    // All ratings for management
    const allRatings = ratings.map((r) => ({
      ratingId: r.id,
      strainId: r.strain.id,
      name: r.strain.name,
      genetics: r.strain.genetics,
      strainType: r.strainType,
      rating: r.overallRating,
    }));

    // Generate profile summary text
    const profileSummary = generateProfileSummary(
      topDimensions,
      preferredTypes,
      preferredGenetics
    );

    return NextResponse.json({
      hasProfile: true,
      ratingCount: ratings.length,
      avgProfile,
      topDimensions,
      lowDimensions,
      preferredTypes,
      preferredGenetics,
      avgOverallRating: Math.round(avgOverallRating * 10) / 10,
      topRatedStrains,
      allRatings,
      profileSummary,
    });
  } catch (error) {
    console.error('Error fetching effect profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch effect profile' },
      { status: 500 }
    );
  }
}

function generateProfileSummary(
  topDimensions: string[],
  preferredTypes: { type: string }[],
  preferredGenetics: { genetics: string }[]
): string {
  const parts: string[] = [];

  // Opening
  parts.push('Based on your ratings, you tend to enjoy strains with');

  // Top characteristics
  const topDescs = topDimensions.slice(0, 3).map((dim) => {
    const descMap: Record<string, string> = {
      'Potency': 'strong potency',
      'Euphoria': 'euphoric effects',
      'Creativity': 'creative stimulation',
      'Focus': 'focused clarity',
      'Energy': 'energizing effects',
      'Relaxation': 'deep relaxation',
      'Sleep Aid': 'sleep-inducing properties',
      'Pain Relief': 'effective pain relief',
      'Anxiety Relief': 'anxiety-calming effects',
      'Munchies': 'appetite stimulation',
      'Smoothness': 'smooth smoke',
      'Aroma': 'pleasant aroma',
      'Flavor': 'great flavor',
    };
    return descMap[dim] || dim.toLowerCase();
  });

  if (topDescs.length > 0) {
    parts.push(topDescs.slice(0, -1).join(', ') + (topDescs.length > 1 ? ' and ' + topDescs[topDescs.length - 1] : topDescs[0]));
  }

  // Preferred types
  if (preferredTypes.length > 0) {
    const types = preferredTypes.slice(0, 2).map((t) => t.type);
    parts.push('. You particularly enjoy ' + types.join(' and ') + ' strains');
  }

  // Preferred genetics
  if (preferredGenetics.length > 0) {
    parts.push(', especially genetics like ' + preferredGenetics.slice(0, 2).map((g) => g.genetics).join(' and '));
  }

  parts.push('.');

  return parts.join('');
}
