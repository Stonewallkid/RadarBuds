import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * Generate a unique 4-digit passcode
 */
async function generateUniquePasscode(): Promise<string> {
  let attempts = 0;
  while (attempts < 10) {
    const passcode = Math.floor(1000 + Math.random() * 9000).toString();

    // Check if passcode is already in use by an active session
    const existing = await prisma.session.findFirst({
      where: {
        passcode,
        status: { not: 'ended' },
      },
    });

    if (!existing) {
      return passcode;
    }
    attempts++;
  }

  // Fallback to 6-digit if all 4-digit are taken (unlikely)
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * POST /api/sessions - Create a new session
 *
 * Body: { hostId, hostName, name?, screenSyncEnabled?, userId? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { hostId, hostName, name, screenSyncEnabled, userId } = body;

    if (!hostId || !hostName) {
      return NextResponse.json(
        { error: 'hostId and hostName are required' },
        { status: 400 }
      );
    }

    const passcode = await generateUniquePasscode();

    // Create the session and add host as first participant
    const session = await prisma.session.create({
      data: {
        passcode,
        name: name || null,
        hostId,
        hostName,
        status: 'waiting',
        screenSyncEnabled: screenSyncEnabled || false,
        userId: userId || null,
        participants: {
          create: {
            participantId: hostId,
            displayName: hostName,
            isHost: true,
            isOnline: true,
          },
        },
      },
      include: {
        participants: true,
      },
    });

    // Fetch session strains if any were added
    const sessionStrains = await prisma.sessionStrain.findMany({
      where: { sessionId: session.id },
      include: { strain: true },
      orderBy: { orderIndex: 'asc' },
    });

    return NextResponse.json({
      session: {
        id: session.id,
        passcode: session.passcode,
        name: session.name,
        status: session.status,
        hostId: session.hostId,
        hostName: session.hostName,
        screenSyncEnabled: session.screenSyncEnabled ?? false,
        currentPhase: session.currentPhase ?? null,
        createdAt: session.createdAt,
      },
      participants: session.participants,
      sessionStrains,
    });
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/sessions - List active sessions (for debugging/admin)
 */
export async function GET() {
  try {
    const sessions = await prisma.session.findMany({
      where: {
        status: { not: 'ended' },
      },
      include: {
        participants: true,
        _count: {
          select: { sessionStrains: true, sessionRatings: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    });

    return NextResponse.json(sessions);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}
