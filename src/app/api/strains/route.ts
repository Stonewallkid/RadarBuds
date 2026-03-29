import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/strains - Get all strains with optional search
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');

    const strains = await prisma.strain.findMany({
      where: search ? {
        OR: [
          { name: { contains: search } },
          { genetics: { contains: search } },
        ],
      } : undefined,
      include: {
        _count: {
          select: { ratings: true },
        },
      },
      orderBy: {
        name: 'asc',
      },
      take: 50,
    });

    return NextResponse.json(strains);
  } catch (error) {
    console.error('Error fetching strains:', error);
    return NextResponse.json(
      { error: 'Failed to fetch strains' },
      { status: 500 }
    );
  }
}

// POST /api/strains - Create a new strain
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, genetics, strainType, thcPercent, cbdPercent, grower, imageUrl } = body;

    if (!name || !strainType) {
      return NextResponse.json(
        { error: 'Name and strain type are required' },
        { status: 400 }
      );
    }

    // Check if strain already exists
    const existingStrain = await prisma.strain.findFirst({
      where: {
        name: { equals: name },
      },
    });

    if (existingStrain) {
      return NextResponse.json(existingStrain);
    }

    const strain = await prisma.strain.create({
      data: {
        name,
        genetics,
        strainType,
        thcPercent,
        cbdPercent,
        grower,
        imageUrl,
      },
    });

    return NextResponse.json(strain, { status: 201 });
  } catch (error) {
    console.error('Error creating strain:', error);
    return NextResponse.json(
      { error: 'Failed to create strain' },
      { status: 500 }
    );
  }
}
