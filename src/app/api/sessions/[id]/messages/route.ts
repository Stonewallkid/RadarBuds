import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * GET /api/sessions/[id]/messages - Get session messages
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    const messages = await prisma.sessionMessage.findMany({
      where: { sessionId: id },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/sessions/[id]/messages - Send a message
 *
 * Body: { senderId, senderName, message }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { senderId, senderName, message } = body;

    if (!senderId || !senderName || !message) {
      return NextResponse.json(
        { error: 'senderId, senderName, and message are required' },
        { status: 400 }
      );
    }

    const sessionMessage = await prisma.sessionMessage.create({
      data: {
        sessionId: id,
        senderId,
        senderName,
        message,
        type: 'chat',
      },
    });

    return NextResponse.json(sessionMessage, { status: 201 });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
