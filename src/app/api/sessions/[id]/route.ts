import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * GET /api/sessions/[id] - Get session details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await prisma.session.findUnique({
      where: { id },
      include: {
        participants: true,
        currentStrain: true,
        sessionStrains: {
          include: { strain: true },
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: session.id,
      passcode: session.passcode,
      name: session.name,
      status: session.status,
      hostId: session.hostId,
      hostName: session.hostName,
      currentStrainId: session.currentStrainId,
      currentStrain: session.currentStrain,
      screenSyncEnabled: session.screenSyncEnabled ?? false,
      currentPhase: session.currentPhase ?? null,
      createdAt: session.createdAt,
      participants: session.participants,
      sessionStrains: session.sessionStrains,
    });
  } catch (error) {
    console.error('Error fetching session:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/sessions/[id] - Update session
 *
 * Body: { status?, hostId, endSession? }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, hostId, endSession } = body;

    // Verify session exists
    const session = await prisma.session.findUnique({
      where: { id },
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Verify caller is host
    if (session.hostId !== hostId) {
      return NextResponse.json(
        { error: 'Only the host can update the session' },
        { status: 403 }
      );
    }

    // End session if requested
    if (endSession) {
      const updatedSession = await prisma.session.update({
        where: { id },
        data: {
          status: 'ended',
          currentStrainId: null,
        },
      });

      // Add system message
      await prisma.sessionMessage.create({
        data: {
          sessionId: id,
          senderId: 'system',
          senderName: 'System',
          message: 'The session has ended',
          type: 'system',
        },
      });

      return NextResponse.json(updatedSession);
    }

    // Update status
    if (status) {
      const updatedSession = await prisma.session.update({
        where: { id },
        data: {
          status,
          ...(status === 'waiting' && { currentStrainId: null, currentPhase: null }),
        },
      });

      return NextResponse.json(updatedSession);
    }

    return NextResponse.json(session);
  } catch (error) {
    console.error('Error updating session:', error);
    return NextResponse.json(
      { error: 'Failed to update session' },
      { status: 500 }
    );
  }
}
