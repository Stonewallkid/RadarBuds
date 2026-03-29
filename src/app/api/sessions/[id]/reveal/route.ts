import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * POST /api/sessions/[id]/reveal - Reveal ratings for current strain
 *
 * Body: { hostId }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { hostId } = body;

    // Verify session exists and caller is host
    const session = await prisma.session.findUnique({
      where: { id },
      include: {
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

    if (session.hostId !== hostId) {
      return NextResponse.json(
        { error: 'Only the host can reveal ratings' },
        { status: 403 }
      );
    }

    const currentSessionStrain = session.sessionStrains[0];
    if (!currentSessionStrain) {
      return NextResponse.json(
        { error: 'No active strain to reveal' },
        { status: 400 }
      );
    }

    // Mark the strain as revealed
    await prisma.sessionStrain.update({
      where: { id: currentSessionStrain.id },
      data: { revealedAt: new Date() },
    });

    // Update session status to reviewing
    await prisma.session.update({
      where: { id },
      data: { status: 'reviewing' },
    });

    // Get all ratings for this strain
    const ratings = await prisma.sessionRating.findMany({
      where: {
        sessionId: id,
        sessionStrainId: currentSessionStrain.id,
      },
    });

    return NextResponse.json({
      success: true,
      ratings,
    });
  } catch (error) {
    console.error('Error revealing ratings:', error);
    return NextResponse.json(
      { error: 'Failed to reveal ratings' },
      { status: 500 }
    );
  }
}
