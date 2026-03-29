'use client';

import { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { EFFECT_DIMENSIONS, EffectRatings, EffectDimension } from '@/types/strain';

interface UserRating {
  odaterId: string;
  ratings: EffectRatings;
}

interface OverlayRadarChartProps {
  userRatings: UserRating[];
  size?: number;
  baseColor?: string;
  darkMode?: boolean;
  // Optional average profile outline (dashed, in strain color)
  averageProfile?: EffectRatings;
  showAverage?: boolean;
  // Optional user's own profile outline (dashed white)
  myProfile?: EffectRatings;
  showMyProfile?: boolean;
}

export default function OverlayRadarChart({
  userRatings,
  size = 400,
  baseColor = '#16a34a',
  darkMode = true,
  averageProfile,
  showAverage = false,
  myProfile,
  showMyProfile = false,
}: OverlayRadarChartProps) {
  // Dark mode colors
  const gridColor = darkMode ? '#3a3a3a' : '#e5e5e5';
  const axisColor = darkMode ? '#4a4a4a' : '#d1d5db';
  const labelColor = darkMode ? '#a0a0a0' : '#374151';
  const svgRef = useRef<SVGSVGElement>(null);

  const margin = 60;
  const radius = (size - margin * 2) / 2;
  const centerX = size / 2;
  const centerY = size / 2;
  const levels = 10;

  const angleSlice = (Math.PI * 2) / EFFECT_DIMENSIONS.length;

  useEffect(() => {
    if (!svgRef.current || userRatings.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Draw concentric circles (levels)
    for (let i = 1; i <= levels; i++) {
      svg.append('circle')
        .attr('cx', centerX)
        .attr('cy', centerY)
        .attr('r', (radius / levels) * i)
        .attr('fill', 'none')
        .attr('stroke', gridColor)
        .attr('stroke-width', i === levels ? 2 : 1);
    }

    // Draw axes and labels
    EFFECT_DIMENSIONS.forEach((dim, i) => {
      const angle = angleSlice * i - Math.PI / 2;
      const lineEnd = {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      };
      const labelPos = {
        x: centerX + (radius + 25) * Math.cos(angle),
        y: centerY + (radius + 25) * Math.sin(angle),
      };

      svg.append('line')
        .attr('x1', centerX)
        .attr('y1', centerY)
        .attr('x2', lineEnd.x)
        .attr('y2', lineEnd.y)
        .attr('stroke', axisColor)
        .attr('stroke-width', 1);

      // Truncate long labels
      const label = dim.length > 10 ? dim.substring(0, 8) + '...' : dim;

      svg.append('text')
        .attr('x', labelPos.x)
        .attr('y', labelPos.y)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('font-size', '10px')
        .attr('fill', labelColor)
        .text(label);
    });

    const getCoordinates = (axisIndex: number, value: number) => {
      const angle = angleSlice * axisIndex - Math.PI / 2;
      const r = (value / levels) * radius;
      return {
        x: centerX + r * Math.cos(angle),
        y: centerY + r * Math.sin(angle),
      };
    };

    // Calculate opacities based on number of raters
    // Each shape gets a faint fill - where they overlap, it accumulates
    const numRaters = userRatings.length;

    // Fill opacity: faint enough that overlapping areas darken nicely
    // With 2 raters: ~20% each (40% where both overlap)
    // With 10 raters: ~8% each (80% where all overlap)
    // With 15 raters: ~6% each
    const fillOpacity = Math.min(0.25, 0.4 / Math.sqrt(numRaters));

    // Stroke opacity: slightly more visible than fill
    const strokeOpacity = Math.min(0.35, 0.5 / Math.sqrt(numRaters));

    // Draw each individual rating as a shape with faint fill
    // Where shapes overlap, colors accumulate and darken
    userRatings.forEach((rating) => {
      const points = EFFECT_DIMENSIONS.map((dim, i) => {
        const value = rating.ratings[dim as EffectDimension] || 0;
        const coords = getCoordinates(i, value);
        return `${coords.x},${coords.y}`;
      });

      // Draw fill first
      svg.append('path')
        .attr('d', `M${points.join('L')}Z`)
        .attr('fill', baseColor)
        .attr('fill-opacity', fillOpacity)
        .attr('stroke', baseColor)
        .attr('stroke-width', 1.5)
        .attr('stroke-opacity', strokeOpacity);
    });

    // Draw average profile outline (dashed, in strain color)
    if (showAverage && averageProfile) {
      const avgPoints = EFFECT_DIMENSIONS.map((dim, i) => {
        const coords = getCoordinates(i, averageProfile[dim as EffectDimension] || 0);
        return `${coords.x},${coords.y}`;
      });

      svg.append('path')
        .attr('d', `M${avgPoints.join('L')}Z`)
        .attr('fill', 'none')
        .attr('stroke', baseColor)
        .attr('stroke-width', 2.5)
        .attr('stroke-opacity', 0.9)
        .attr('stroke-dasharray', '6,3');
    }

    // Draw user's own profile outline (dashed white)
    if (showMyProfile && myProfile) {
      const myPoints = EFFECT_DIMENSIONS.map((dim, i) => {
        const coords = getCoordinates(i, myProfile[dim as EffectDimension] || 0);
        return `${coords.x},${coords.y}`;
      });

      svg.append('path')
        .attr('d', `M${myPoints.join('L')}Z`)
        .attr('fill', 'none')
        .attr('stroke', '#ffffff')
        .attr('stroke-width', 2)
        .attr('stroke-opacity', 0.8)
        .attr('stroke-dasharray', '4,4');
    }

  }, [userRatings, centerX, centerY, radius, angleSlice, levels, baseColor, gridColor, axisColor, labelColor, averageProfile, showAverage, myProfile, showMyProfile]);

  return (
    <svg
      ref={svgRef}
      width={size}
      height={size}
      className="select-none"
    />
  );
}
