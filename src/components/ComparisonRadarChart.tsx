'use client';

import { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { EFFECT_DIMENSIONS, EffectRatings } from '@/types/strain';

interface ComparisonRadarChartProps {
  strainProfile: EffectRatings;    // Shown as filled green
  userProfile: EffectRatings;       // Shown as white outline
  size?: number;
  strainColor?: string;
}

export default function ComparisonRadarChart({
  strainProfile,
  userProfile,
  size = 280,
  strainColor = '#16a34a',
}: ComparisonRadarChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  const margin = 50;
  const radius = (size - margin * 2) / 2;
  const centerX = size / 2;
  const centerY = size / 2;
  const levels = 10;

  const angleSlice = (Math.PI * 2) / EFFECT_DIMENSIONS.length;

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Draw concentric circles (levels)
    for (let i = 1; i <= levels; i++) {
      svg.append('circle')
        .attr('cx', centerX)
        .attr('cy', centerY)
        .attr('r', (radius / levels) * i)
        .attr('fill', 'none')
        .attr('stroke', '#3a3a3a')
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
        x: centerX + (radius + 20) * Math.cos(angle),
        y: centerY + (radius + 20) * Math.sin(angle),
      };

      svg.append('line')
        .attr('x1', centerX)
        .attr('y1', centerY)
        .attr('x2', lineEnd.x)
        .attr('y2', lineEnd.y)
        .attr('stroke', '#4a4a4a')
        .attr('stroke-width', 1);

      // Truncate long labels
      const label = dim.length > 10 ? dim.substring(0, 8) + '...' : dim;

      svg.append('text')
        .attr('x', labelPos.x)
        .attr('y', labelPos.y)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('font-size', '9px')
        .attr('fill', '#888')
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

    // Generate path for a profile
    const generatePath = (profile: EffectRatings) => {
      const points = EFFECT_DIMENSIONS.map((dim, i) => {
        const coords = getCoordinates(i, profile[dim] || 0);
        return `${coords.x},${coords.y}`;
      });
      return `M${points.join('L')}Z`;
    };

    // Draw strain profile (filled with strain color)
    svg.append('path')
      .attr('d', generatePath(strainProfile))
      .attr('fill', strainColor)
      .attr('fill-opacity', 0.4)
      .attr('stroke', strainColor)
      .attr('stroke-width', 2);

    // Draw user profile (white outline only)
    svg.append('path')
      .attr('d', generatePath(userProfile))
      .attr('fill', 'none')
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '4,2');

    // Draw points for strain profile
    EFFECT_DIMENSIONS.forEach((dim, i) => {
      const coords = getCoordinates(i, strainProfile[dim] || 0);
      svg.append('circle')
        .attr('cx', coords.x)
        .attr('cy', coords.y)
        .attr('r', 4)
        .attr('fill', strainColor)
        .attr('stroke', '#fff')
        .attr('stroke-width', 1);
    });

    // Draw points for user profile (smaller, white)
    EFFECT_DIMENSIONS.forEach((dim, i) => {
      const coords = getCoordinates(i, userProfile[dim] || 0);
      svg.append('circle')
        .attr('cx', coords.x)
        .attr('cy', coords.y)
        .attr('r', 3)
        .attr('fill', '#ffffff');
    });

  }, [strainProfile, userProfile, centerX, centerY, radius, angleSlice, levels, strainColor]);

  return (
    <svg
      ref={svgRef}
      width={size}
      height={size}
      className="select-none"
    />
  );
}
