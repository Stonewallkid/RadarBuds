import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/strains/[id] - Get a specific strain
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const strain = await prisma.strain.findUnique({
      where: { id },
      include: {
        ratings: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!strain) {
      return NextResponse.json(
        { error: 'Strain not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(strain);
  } catch (error) {
    console.error('Error fetching strain:', error);
    return NextResponse.json(
      { error: 'Failed to fetch strain' },
      { status: 500 }
    );
  }
}
