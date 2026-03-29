import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * POST /api/sessions/[id]/strains - Add strain to queue or start rating
 *
 * Body: { hostId, strainId?, strain?, addToQueue?, startRating? }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { hostId, strainId, strain, addToQueue, startRating } = body;

    // Verify session exists and caller is host
    const session = await prisma.session.findUnique({
      where: { id },
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    if (session.hostId !== hostId) {
      return NextResponse.json(
        { error: 'Only the host can manage strains' },
        { status: 403 }
      );
    }

    let finalStrainId = strainId;

    // If strain info provided, find or create the strain
    if (!strainId && strain) {
      const existingStrain = await prisma.strain.findFirst({
        where: {
          name: { equals: strain.name },
        },
      });

      if (existingStrain) {
        finalStrainId = existingStrain.id;
      } else {
        const newStrain = await prisma.strain.create({
          data: {
            name: strain.name,
            genetics: strain.genetics || null,
            strainType: strain.strainType || 'Balanced Hybrid',
          },
        });
        finalStrainId = newStrain.id;
      }
    }

    if (!finalStrainId) {
      return NextResponse.json(
        { error: 'strainId or strain info is required' },
        { status: 400 }
      );
    }

    // If starting a rating, update session and set current strain
    if (startRating) {
      // Find or create session strain
      let sessionStrain = await prisma.sessionStrain.findFirst({
        where: {
          sessionId: id,
          strainId: finalStrainId,
        },
      });

      if (!sessionStrain) {
        const maxOrder = await prisma.sessionStrain.aggregate({
          where: { sessionId: id },
          _max: { orderIndex: true },
        });

        sessionStrain = await prisma.sessionStrain.create({
          data: {
            sessionId: id,
            strainId: finalStrainId,
            orderIndex: (maxOrder._max.orderIndex ?? -1) + 1,
          },
          include: { strain: true },
        });
      }

      // Update session to rating mode
      await prisma.session.update({
        where: { id },
        data: {
          status: 'rating',
          currentStrainId: finalStrainId,
          currentPhase: 'type',
        },
      });

      // Get the strain details
      const strainDetails = await prisma.strain.findUnique({
        where: { id: finalStrainId },
      });

      // Add system message
      await prisma.sessionMessage.create({
        data: {
          sessionId: id,
          senderId: 'system',
          senderName: 'System',
          message: `Now rating: ${strainDetails?.name || 'Unknown Strain'}`,
          type: 'system',
        },
      });

      return NextResponse.json({
        success: true,
        sessionStrain,
        strain: strainDetails,
      });
    }

    // If adding to queue
    if (addToQueue) {
      // Check if already in queue
      const existingSessionStrain = await prisma.sessionStrain.findFirst({
        where: {
          sessionId: id,
          strainId: finalStrainId,
        },
      });

      if (existingSessionStrain) {
        return NextResponse.json({
          success: true,
          sessionStrain: existingSessionStrain,
          message: 'Strain already in queue',
        });
      }

      // Get max order index
      const maxOrder = await prisma.sessionStrain.aggregate({
        where: { sessionId: id },
        _max: { orderIndex: true },
      });

      const sessionStrain = await prisma.sessionStrain.create({
        data: {
          sessionId: id,
          strainId: finalStrainId,
          orderIndex: (maxOrder._max.orderIndex ?? -1) + 1,
        },
        include: { strain: true },
      });

      return NextResponse.json({
        success: true,
        sessionStrain,
      });
    }

    return NextResponse.json({ error: 'No action specified' }, { status: 400 });
  } catch (error) {
    console.error('Error managing session strain:', error);
    return NextResponse.json(
      { error: 'Failed to manage session strain' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/sessions/[id]/strains - Remove strain from queue
 *
 * Body: { hostId, sessionStrainId }
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { hostId, sessionStrainId } = body;

    // Verify session exists and caller is host
    const session = await prisma.session.findUnique({
      where: { id },
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    if (session.hostId !== hostId) {
      return NextResponse.json(
        { error: 'Only the host can manage strains' },
        { status: 403 }
      );
    }

    // Delete the session strain
    await prisma.sessionStrain.delete({
      where: { id: sessionStrainId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing session strain:', error);
    return NextResponse.json(
      { error: 'Failed to remove session strain' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/sessions/[id]/strains - Reorder strains in queue
 *
 * Body: { hostId, reorder: Array<{ sessionStrainId, newOrderIndex }> }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { hostId, reorder } = body;

    // Verify session exists and caller is host
    const session = await prisma.session.findUnique({
      where: { id },
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    if (session.hostId !== hostId) {
      return NextResponse.json(
        { error: 'Only the host can manage strains' },
        { status: 403 }
      );
    }

    // Update order indices
    for (const item of reorder) {
      await prisma.sessionStrain.update({
        where: { id: item.sessionStrainId },
        data: { orderIndex: item.newOrderIndex },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error reordering session strains:', error);
    return NextResponse.json(
      { error: 'Failed to reorder session strains' },
      { status: 500 }
    );
  }
}
