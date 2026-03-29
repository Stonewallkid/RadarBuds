import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { EFFECT_DIMENSIONS, EffectDimension } from '@/types/strain';

/**
 * GET /api/sessions/[id]/summary - Get session summary with all ratings
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get session with all data
    const session = await prisma.session.findUnique({
      where: { id },
      include: {
        participants: true,
        sessionStrains: {
          include: { strain: true },
          orderBy: { orderIndex: 'asc' },
        },
        sessionRatings: true,
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Build summary for each strain
    const strainSummaries = session.sessionStrains.map((sessionStrain) => {
      const ratings = session.sessionRatings.filter(
        (r) => r.sessionStrainId === sessionStrain.id
      );

      // Calculate average effect ratings
      const avgEffectRatings: Record<string, number> = {};
      for (const dim of EFFECT_DIMENSIONS) {
        const values = ratings.map((r) => {
          const effectRatings = r.effectRatings as Record<string, number>;
          return effectRatings[dim] || 0;
        });
        if (values.length > 0) {
          avgEffectRatings[dim as EffectDimension] =
            Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
        }
      }

      // Calculate average overall rating
      const avgOverall =
        ratings.length > 0
          ? Math.round(
              (ratings.reduce((sum, r) => sum + r.overallRating, 0) / ratings.length) * 10
            ) / 10
          : 0;

      // Get individual ratings
      const individualRatings = ratings.map((r) => ({
        participantId: r.participantId,
        participantName: r.participantName,
        effectRatings: r.effectRatings,
        strainType: r.strainType,
        budAppearance: r.budAppearance,
        overallRating: r.overallRating,
        notes: r.notes,
      }));

      return {
        sessionStrainId: sessionStrain.id,
        strain: {
          id: sessionStrain.strain.id,
          name: sessionStrain.strain.name,
          genetics: sessionStrain.strain.genetics,
          strainType: sessionStrain.strain.strainType,
        },
        ratingCount: ratings.length,
        avgEffectRatings,
        avgOverall,
        individualRatings,
        revealedAt: sessionStrain.revealedAt,
      };
    });

    // Find top-rated strain
    const topRatedStrain = [...strainSummaries]
      .filter((s) => s.ratingCount > 0)
      .sort((a, b) => b.avgOverall - a.avgOverall)[0];

    // Participant stats
    const participantStats = session.participants.map((p) => {
      const theirRatings = session.sessionRatings.filter(
        (r) => r.participantId === p.participantId
      );
      const avgRating =
        theirRatings.length > 0
          ? Math.round(
              (theirRatings.reduce((sum, r) => sum + r.overallRating, 0) /
                theirRatings.length) *
                10
            ) / 10
          : 0;

      return {
        participantId: p.participantId,
        displayName: p.displayName,
        isHost: p.isHost,
        ratingsCount: theirRatings.length,
        avgRating,
      };
    });

    return NextResponse.json({
      session: {
        id: session.id,
        name: session.name,
        hostName: session.hostName,
        status: session.status,
        createdAt: session.createdAt,
      },
      strainCount: session.sessionStrains.length,
      totalRatings: session.sessionRatings.length,
      participantCount: session.participants.length,
      strainSummaries,
      topRatedStrain,
      participantStats,
    });
  } catch (error) {
    console.error('Error fetching session summary:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session summary' },
      { status: 500 }
    );
  }
}
