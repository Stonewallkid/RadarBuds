import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * POST /api/sessions/[id]/leave - Leave a session
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

    // Find the participant
    const participant = await prisma.sessionParticipant.findFirst({
      where: {
        sessionId: id,
        participantId,
      },
    });

    if (!participant) {
      return NextResponse.json(
        { error: 'Participant not found' },
        { status: 404 }
      );
    }

    // Mark participant as offline
    await prisma.sessionParticipant.update({
      where: { id: participant.id },
      data: { isOnline: false },
    });

    // Add system message
    await prisma.sessionMessage.create({
      data: {
        sessionId: id,
        senderId: 'system',
        senderName: 'System',
        message: `${participant.displayName} left the session`,
        type: 'system',
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error leaving session:', error);
    return NextResponse.json(
      { error: 'Failed to leave session' },
      { status: 500 }
    );
  }
}
