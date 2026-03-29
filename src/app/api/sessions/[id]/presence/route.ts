import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * POST /api/sessions/[id]/presence - Update participant presence
 *
 * Body: { participantId }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { participantId } = body;

    if (!participantId) {
      return NextResponse.json(
        { error: 'participantId is required' },
        { status: 400 }
      );
    }

    // Update participant's last seen and online status
    await prisma.sessionParticipant.updateMany({
      where: {
        sessionId: id,
        participantId,
      },
      data: {
        isOnline: true,
        lastSeen: new Date(),
      },
    });

    // Mark participants as offline if they haven't been seen in 30 seconds
    const thirtySecondsAgo = new Date(Date.now() - 30000);
    await prisma.sessionParticipant.updateMany({
      where: {
        sessionId: id,
        lastSeen: { lt: thirtySecondsAgo },
        isOnline: true,
      },
      data: {
        isOnline: false,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating presence:', error);
    return NextResponse.json(
      { error: 'Failed to update presence' },
      { status: 500 }
    );
  }
}
