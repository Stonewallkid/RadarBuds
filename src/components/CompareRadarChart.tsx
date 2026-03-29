'use client';

import { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { EFFECT_DIMENSIONS, EffectRatings } from '@/types/strain';

interface StrainData {
  id: string;
  name: string;
  color: string;
  ratings: EffectRatings;
}

interface CompareRadarChartProps {
  strains: StrainData[];
  size?: number;
}

export default function CompareRadarChart({
  strains,
  size = 320,
}: CompareRadarChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  const margin = 60;
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
        x: centerX + (radius + 25) * Math.cos(angle),
        y: centerY + (radius + 25) * Math.sin(angle),
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
    const generatePath = (ratings: EffectRatings) => {
      const points = EFFECT_DIMENSIONS.map((dim, i) => {
        const coords = getCoordinates(i, ratings[dim] || 0);
        return `${coords.x},${coords.y}`;
      });
      return `M${points.join('L')}Z`;
    };

    // Draw each strain's profile
    strains.forEach((strain) => {
      // Draw filled area
      svg.append('path')
        .attr('d', generatePath(strain.ratings))
        .attr('fill', strain.color)
        .attr('fill-opacity', 0.2)
        .attr('stroke', strain.color)
        .attr('stroke-width', 2);

      // Draw points
      EFFECT_DIMENSIONS.forEach((dim, i) => {
        const coords = getCoordinates(i, strain.ratings[dim] || 0);
        svg.append('circle')
          .attr('cx', coords.x)
          .attr('cy', coords.y)
          .attr('r', 4)
          .attr('fill', strain.color)
          .attr('stroke', '#1a1a1a')
          .attr('stroke-width', 1);
      });
    });

  }, [strains, centerX, centerY, radius, angleSlice, levels]);

  return (
    <svg
      ref={svgRef}
      width={size}
      height={size}
      className="select-none"
    />
  );
}
