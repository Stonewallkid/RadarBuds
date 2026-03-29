import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { EFFECT_DIMENSIONS, EffectRatings, StrainType } from '@/types/strain';

interface SimilarStrainResult {
  id: string;
  name: string;
  genetics: string | null;
  strainType: StrainType;
  thcPercent: number | null;
  cbdPercent: number | null;
  similarity: number;
  avgOverall: number;
  ratingCount: number;
  avgProfile: EffectRatings;
}

/**
 * Calculate similarity between two effect profiles using Mean Absolute Error
 * Returns a percentage (0-100) where 100 is a perfect match
 */
function calculateSimilarity(profile1: EffectRatings, profile2: EffectRatings): number {
  let totalAbsError = 0;

  for (const dim of EFFECT_DIMENSIONS) {
    const val1 = profile1[dim] ?? 0;
    const val2 = profile2[dim] ?? 0;
    const diff = Math.abs(val1 - val2);
    totalAbsError += diff;
  }

  // Mean Absolute Error across all dimensions
  const mae = totalAbsError / EFFECT_DIMENSIONS.length;

  // Convert to similarity percentage
  // 0 MAE = 100% match
  // 1 point avg diff = ~80% match
  // 2 points avg diff = ~60% match
  // 5+ points diff = 5% floor
  const similarity = Math.max(5, 100 - (mae * 20));

  return Math.round(similarity);
}

/**
 * Classify strain type from string
 */
function classifyStrainType(type: string | null): StrainType {
  if (!type) return 'Balanced Hybrid';

  const lower = type.toLowerCase();
  if (lower.includes('indica') && lower.includes('dominant')) return 'Indica-Dominant';
  if (lower.includes('sativa') && lower.includes('dominant')) return 'Sativa-Dominant';
  if (lower.includes('indica')) return 'Indica';
  if (lower.includes('sativa')) return 'Sativa';
  return 'Balanced Hybrid';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { targetProfile, strainType, limit = 10 } = body;

    if (!targetProfile) {
      return NextResponse.json(
        { success: false, error: 'Target profile is required' },
        { status: 400 }
      );
    }

    // Fetch all strains with their ratings
    const strains = await prisma.strain.findMany({
      include: {
        ratings: {
          select: {
            effectRatings: true,
            overallRating: true,
            strainType: true,
          },
        },
      },
    });

    // Calculate average profile for each strain and compute similarity
    const results: SimilarStrainResult[] = [];

    for (const strain of strains) {
      if (strain.ratings.length === 0) continue;

      // Calculate average effect profile across all ratings
      const avgProfile: EffectRatings = {} as EffectRatings;
      let totalOverall = 0;

      for (const dim of EFFECT_DIMENSIONS) {
        let sum = 0;
        for (const rating of strain.ratings) {
          const ratings = rating.effectRatings as Record<string, number>;
          sum += ratings[dim] ?? 0;
        }
        avgProfile[dim] = sum / strain.ratings.length;
      }

      for (const rating of strain.ratings) {
        totalOverall += rating.overallRating;
      }

      const avgOverall = totalOverall / strain.ratings.length;
      const detectedStrainType = classifyStrainType(strain.strainType);

      // Filter by strain type if specified
      if (strainType && strainType !== 'all') {
        if (strainType === 'indica' && !detectedStrainType.toLowerCase().includes('indica')) continue;
        if (strainType === 'sativa' && !detectedStrainType.toLowerCase().includes('sativa')) continue;
        if (strainType === 'hybrid' && detectedStrainType !== 'Balanced Hybrid') continue;
      }

      const similarity = calculateSimilarity(targetProfile, avgProfile);

      results.push({
        id: strain.id,
        name: strain.name,
        genetics: strain.genetics,
        strainType: detectedStrainType,
        thcPercent: strain.thcPercent,
        cbdPercent: strain.cbdPercent,
        similarity,
        avgOverall: Math.round(avgOverall * 10) / 10,
        ratingCount: strain.ratings.length,
        avgProfile,
      });
    }

    // Sort by similarity (highest first) and take top N
    results.sort((a, b) => b.similarity - a.similarity);
    const topResults = results.slice(0, limit);

    return NextResponse.json({
      success: true,
      data: topResults,
    });
  } catch (error) {
    console.error('Error finding similar strains:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to find similar strains' },
      { status: 500 }
    );
  }
}
