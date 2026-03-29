import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * POST /api/sessions/join - Join a session by passcode
 *
 * Body: { passcode, participantId, displayName, userId? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { passcode, participantId, displayName, userId } = body;

    if (!passcode || !participantId || !displayName) {
      return NextResponse.json(
        { error: 'passcode, participantId, and displayName are required' },
        { status: 400 }
      );
    }

    // Find the session by passcode
    const session = await prisma.session.findFirst({
      where: {
        passcode,
        status: { not: 'ended' },
      },
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
        { error: 'Session not found or has ended' },
        { status: 404 }
      );
    }

    // Check if participant already exists
    const existingParticipant = session.participants.find(
      (p) => p.participantId === participantId
    );

    if (existingParticipant) {
      // Update their online status and name if rejoining
      await prisma.sessionParticipant.update({
        where: { id: existingParticipant.id },
        data: {
          isOnline: true,
          lastSeen: new Date(),
          displayName, // Update name in case they changed it
        },
      });

      return NextResponse.json({
        session: {
          id: session.id,
          passcode: session.passcode,
          name: session.name,
          status: session.status,
          hostId: session.hostId,
          hostName: session.hostName,
          currentStrain: session.currentStrain,
          screenSyncEnabled: session.screenSyncEnabled ?? false,
          currentPhase: session.currentPhase ?? null,
          createdAt: session.createdAt,
        },
        participant: {
          ...existingParticipant,
          displayName,
          isOnline: true,
        },
        participants: session.participants,
        sessionStrains: session.sessionStrains,
        isRejoining: true,
      });
    }

    // Create new participant
    const participant = await prisma.sessionParticipant.create({
      data: {
        sessionId: session.id,
        participantId,
        displayName,
        isHost: false,
        isOnline: true,
      },
    });

    // If user is authenticated, link them to this session
    if (userId) {
      try {
        await prisma.userSessionEvent.upsert({
          where: {
            userId_sessionId: {
              userId,
              sessionId: session.id,
            },
          },
          update: {
            displayName,
          },
          create: {
            userId,
            sessionId: session.id,
            wasHost: false,
            displayName,
          },
        });
      } catch {
        // Table may not exist yet - ignore
      }
    }

    // Add system message for join
    await prisma.sessionMessage.create({
      data: {
        sessionId: session.id,
        senderId: 'system',
        senderName: 'System',
        message: `${displayName} joined the session`,
        type: 'system',
      },
    });

    // Fetch updated participants list
    const updatedParticipants = await prisma.sessionParticipant.findMany({
      where: { sessionId: session.id },
    });

    return NextResponse.json({
      session: {
        id: session.id,
        passcode: session.passcode,
        name: session.name,
        status: session.status,
        hostId: session.hostId,
        hostName: session.hostName,
        currentStrain: session.currentStrain,
        screenSyncEnabled: session.screenSyncEnabled ?? false,
        currentPhase: session.currentPhase ?? null,
        createdAt: session.createdAt,
      },
      participant,
      participants: updatedParticipants,
      sessionStrains: session.sessionStrains,
      isRejoining: false,
    });
  } catch (error) {
    console.error('Error joining session:', error);
    return NextResponse.json(
      { error: 'Failed to join session' },
      { status: 500 }
    );
  }
}
