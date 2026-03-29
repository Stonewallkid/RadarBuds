import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * GET /api/sessions/[id]/ratings - Get rating status for current strain
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get the session with current strain
    const session = await prisma.session.findUnique({
      where: { id },
      include: {
        participants: true,
        sessionStrains: {
          where: { revealedAt: null },
          orderBy: { orderIndex: 'asc' },
          take: 1,
        },
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    const currentSessionStrain = session.sessionStrains[0];
    if (!currentSessionStrain) {
      return NextResponse.json({
        sessionStrainId: null,
        submitted: [],
        total: session.participants.length,
        onlineCount: session.participants.filter((p) => p.isOnline).length,
        allSubmitted: false,
      });
    }

    // Get ratings for current strain
    const ratings = await prisma.sessionRating.findMany({
      where: {
        sessionId: id,
        sessionStrainId: currentSessionStrain.id,
      },
    });

    const submitted = ratings.map((r) => ({
      participantId: r.participantId,
      participantName: r.participantName,
      submittedAt: r.submittedAt.toISOString(),
    }));

    const onlineParticipants = session.participants.filter((p) => p.isOnline);
    const allSubmitted =
      onlineParticipants.length > 0 &&
      onlineParticipants.every((p) =>
        submitted.some((s) => s.participantId === p.participantId)
      );

    return NextResponse.json({
      sessionStrainId: currentSessionStrain.id,
      submitted,
      total: session.participants.length,
      onlineCount: onlineParticipants.length,
      allSubmitted,
    });
  } catch (error) {
    console.error('Error fetching rating status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rating status' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/sessions/[id]/ratings - Submit a rating
 *
 * Body: { participantId, participantName, effectRatings, strainType, budAppearance?, overallRating, notes? }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { participantId, participantName, effectRatings, strainType, budAppearance, overallRating, notes } = body;

    if (!participantId || !participantName || !effectRatings || !strainType || !overallRating) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get session with current strain
    const session = await prisma.session.findUnique({
      where: { id },
      include: {
        participants: true,
        sessionStrains: {
          where: { revealedAt: null },
          orderBy: { orderIndex: 'asc' },
          take: 1,
        },
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    const currentSessionStrain = session.sessionStrains[0];
    if (!currentSessionStrain) {
      return NextResponse.json(
        { error: 'No active strain to rate' },
        { status: 400 }
      );
    }

    // Check if already submitted
    const existingRating = await prisma.sessionRating.findFirst({
      where: {
        sessionId: id,
        sessionStrainId: currentSessionStrain.id,
        participantId,
      },
    });

    if (existingRating) {
      return NextResponse.json(
        { error: 'Already submitted rating for this strain' },
        { status: 409 }
      );
    }

    // Create the rating
    const rating = await prisma.sessionRating.create({
      data: {
        sessionId: id,
        sessionStrainId: currentSessionStrain.id,
        participantId,
        participantName,
        effectRatings,
        strainType,
        budAppearance,
        overallRating,
        notes,
      },
    });

    // Check if all online participants have submitted
    const allRatings = await prisma.sessionRating.findMany({
      where: {
        sessionId: id,
        sessionStrainId: currentSessionStrain.id,
      },
    });

    const onlineParticipants = session.participants.filter((p) => p.isOnline);
    const allSubmitted =
      onlineParticipants.length > 0 &&
      onlineParticipants.every((p) =>
        allRatings.some((r) => r.participantId === p.participantId)
      );

    return NextResponse.json({
      rating,
      allSubmitted,
    });
  } catch (error) {
    console.error('Error submitting rating:', error);
    return NextResponse.json(
      { error: 'Failed to submit rating' },
      { status: 500 }
    );
  }
}
