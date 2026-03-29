import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * PATCH /api/sessions/[id]/phase - Update session phase (for screen sync/lock mode)
 *
 * Body: { hostId, phase }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { hostId, phase } = body;

    if (!hostId || !phase) {
      return NextResponse.json(
        { error: 'hostId and phase are required' },
        { status: 400 }
      );
    }

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
        { error: 'Only the host can update the phase' },
        { status: 403 }
      );
    }

    // Update the phase
    const updatedSession = await prisma.session.update({
      where: { id },
      data: { currentPhase: phase },
    });

    return NextResponse.json({
      success: true,
      currentPhase: updatedSession.currentPhase,
    });
  } catch (error) {
    console.error('Error updating phase:', error);
    return NextResponse.json(
      { error: 'Failed to update phase' },
      { status: 500 }
    );
  }
}
