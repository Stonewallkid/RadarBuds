import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/ratings/[id] - Get a specific rating
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const rating = await prisma.rating.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        strain: true,
      },
    });

    if (!rating) {
      return NextResponse.json(
        { error: 'Rating not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(rating);
  } catch (error) {
    console.error('Error fetching rating:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rating' },
      { status: 500 }
    );
  }
}

// DELETE /api/ratings/[id] - Delete a rating
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { userId } = body;

    // Verify the rating exists and belongs to the user
    const rating = await prisma.rating.findUnique({
      where: { id },
    });

    if (!rating) {
      return NextResponse.json(
        { error: 'Rating not found' },
        { status: 404 }
      );
    }

    if (rating.userId && rating.userId !== userId) {
      return NextResponse.json(
        { error: 'Not authorized to delete this rating' },
        { status: 403 }
      );
    }

    await prisma.rating.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting rating:', error);
    return NextResponse.json(
      { error: 'Failed to delete rating' },
      { status: 500 }
    );
  }
}
