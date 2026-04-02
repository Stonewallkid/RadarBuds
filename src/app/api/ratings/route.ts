import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { EffectRatings, EFFECT_DIMENSIONS, EffectDimension } from '@/types/strain';

// GET /api/ratings - Get ratings with optional filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const strainId = searchParams.get('strainId');
    const userId = searchParams.get('userId');

    const ratings = await prisma.rating.findMany({
      where: {
        ...(strainId && { strainId }),
        ...(userId && { userId }),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        strain: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(ratings);
  } catch (error) {
    console.error('Error fetching ratings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ratings' },
      { status: 500 }
    );
  }
}

// POST /api/ratings - Create a new rating
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, strainId, strain, effectRatings, strainType, budAppearance, overallRating, notes, effectTags, imageUrl } = body;

    // Validate required fields
    if (!effectRatings || !strainType || !overallRating) {
      return NextResponse.json(
        { error: 'Effect ratings, strain type, and overall rating are required' },
        { status: 400 }
      );
    }

    // Validate effect ratings have all dimensions
    const ratings = effectRatings as EffectRatings;
    for (const dim of EFFECT_DIMENSIONS) {
      if (typeof ratings[dim as EffectDimension] !== 'number' || ratings[dim as EffectDimension] < 0 || ratings[dim as EffectDimension] > 10) {
        return NextResponse.json(
          { error: `Invalid rating for ${dim}` },
          { status: 400 }
        );
      }
    }

    // Validate overall rating
    if (overallRating < 1 || overallRating > 10) {
      return NextResponse.json(
        { error: 'Overall rating must be between 1 and 10' },
        { status: 400 }
      );
    }

    let finalStrainId = strainId;

    // If strain info provided instead of strainId, find or create the strain
    if (!strainId && strain) {
      // Use case-insensitive search - SQLite LIKE is case-insensitive for ASCII
      const existingStrain = await prisma.strain.findFirst({
        where: {
          name: { equals: strain.name },
        },
      });

      if (existingStrain) {
        finalStrainId = existingStrain.id;
        // Update image if provided and strain doesn't have one yet
        if (imageUrl && !existingStrain.imageUrl) {
          await prisma.strain.update({
            where: { id: existingStrain.id },
            data: { imageUrl },
          });
        }
      } else {
        const newStrain = await prisma.strain.create({
          data: {
            name: strain.name,
            genetics: strain.genetics || null,
            strainType: strain.strainType || strainType,
            thcPercent: strain.thcPercent || null,
            cbdPercent: strain.cbdPercent || null,
            imageUrl: imageUrl || null,
          },
        });
        finalStrainId = newStrain.id;
      }
    }

    if (!finalStrainId) {
      return NextResponse.json(
        { error: 'Strain ID or strain info is required' },
        { status: 400 }
      );
    }

    const rating = await prisma.rating.create({
      data: {
        userId: userId || null,
        strainId: finalStrainId,
        effectRatings,
        strainType,
        budAppearance: budAppearance || null,
        overallRating,
        notes: notes || null,
        effectTags: effectTags || null,
      },
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

    return NextResponse.json(rating, { status: 201 });
  } catch (error) {
    console.error('Error creating rating:', error);
    return NextResponse.json(
      { error: 'Failed to create rating' },
      { status: 500 }
    );
  }
}
