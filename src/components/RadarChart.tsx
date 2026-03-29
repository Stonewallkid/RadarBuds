'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { EFFECT_DIMENSIONS, EffectRatings, createEmptyRatings } from '@/types/strain';

interface RadarChartProps {
  ratings: EffectRatings;
  onChange?: (ratings: EffectRatings) => void;
  size?: number;
  interactive?: boolean;
  fillColor?: string;
  fillOpacity?: number;
  darkMode?: boolean;
  strokeDashed?: boolean;
  showDots?: boolean;
  strokeOpacity?: number;
  strokeColor?: string;
}

export default function RadarChart({
  ratings,
  onChange,
  size = 400,
  interactive = true,
  fillColor = '#16a34a', // Green for cannabis
  fillOpacity = 0.3,
  darkMode = false,
  strokeDashed = false,
  showDots = true,
  strokeOpacity = 1,
  strokeColor,
}: RadarChartProps) {
  // Dark mode colors
  const gridColor = darkMode ? '#3a3a3a' : '#e5e5e5';
  const axisColor = darkMode ? '#4a4a4a' : '#d1d5db';
  const labelColor = darkMode ? '#a0a0a0' : '#374151';
  const activeColor = fillColor;
  const svgRef = useRef<SVGSVGElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [activeAxis, setActiveAxis] = useState<string | null>(null);

  // Scale everything proportionally based on size
  const baseSize = 400; // reference size
  const scale = size / baseSize;
  const margin = Math.max(50, 70 * scale); // Slightly more margin for longer labels
  const radius = (size - margin * 2) / 2;
  const centerX = size / 2;
  const centerY = size / 2;
  const levels = 10; // 0-10 scale
  const dotRadius = Math.max(3, 5 * scale);
  const activeDotRadius = Math.max(4, 8 * scale);
  const fontSize = Math.max(7, 10 * scale); // Slightly smaller for longer labels
  const labelOffset = Math.max(15, 25 * scale);

  // Calculate angle for each dimension
  const angleSlice = (Math.PI * 2) / EFFECT_DIMENSIONS.length;

  // Get coordinates for a value on a specific axis
  const getCoordinates = useCallback((axisIndex: number, value: number) => {
    const angle = angleSlice * axisIndex - Math.PI / 2; // Start from top
    const r = (value / levels) * radius;
    return {
      x: centerX + r * Math.cos(angle),
      y: centerY + r * Math.sin(angle),
    };
  }, [angleSlice, radius, centerX, centerY, levels]);

  // Get value from coordinates (for drag interaction)
  const getValueFromCoordinates = useCallback((x: number, y: number, axisIndex: number) => {
    const angle = angleSlice * axisIndex - Math.PI / 2;
    const dx = x - centerX;
    const dy = y - centerY;

    // Project point onto axis
    const axisX = Math.cos(angle);
    const axisY = Math.sin(angle);
    const projection = dx * axisX + dy * axisY;

    // Convert to 0-10 scale
    const value = Math.round((projection / radius) * levels);
    return Math.max(0, Math.min(10, value));
  }, [angleSlice, centerX, centerY, radius, levels]);

  // Find closest axis to a point
  const findClosestAxis = useCallback((x: number, y: number): number => {
    const dx = x - centerX;
    const dy = y - centerY;
    const mouseAngle = Math.atan2(dy, dx) + Math.PI / 2;
    const normalizedAngle = mouseAngle < 0 ? mouseAngle + Math.PI * 2 : mouseAngle;
    const axisIndex = Math.round(normalizedAngle / angleSlice) % EFFECT_DIMENSIONS.length;
    return axisIndex;
  }, [angleSlice, centerX, centerY]);

  // Handle mouse/touch interaction
  const handleInteraction = useCallback((clientX: number, clientY: number) => {
    if (!svgRef.current || !onChange) return;

    const rect = svgRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const axisIndex = findClosestAxis(x, y);
    const dimension = EFFECT_DIMENSIONS[axisIndex];
    const value = getValueFromCoordinates(x, y, axisIndex);

    setActiveAxis(dimension);
    onChange({
      ...ratings,
      [dimension]: value,
    });
  }, [onChange, ratings, findClosestAxis, getValueFromCoordinates]);

  // Generate path for the ratings shape
  const generatePath = useCallback(() => {
    const points = EFFECT_DIMENSIONS.map((dim, i) => {
      const coords = getCoordinates(i, ratings[dim]);
      return `${coords.x},${coords.y}`;
    });
    return `M${points.join('L')}Z`;
  }, [ratings, getCoordinates]);

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
        x: centerX + (radius + labelOffset) * Math.cos(angle),
        y: centerY + (radius + labelOffset) * Math.sin(angle),
      };

      // Axis line
      svg.append('line')
        .attr('x1', centerX)
        .attr('y1', centerY)
        .attr('x2', lineEnd.x)
        .attr('y2', lineEnd.y)
        .attr('stroke', axisColor)
        .attr('stroke-width', 1);

      // Label
      svg.append('text')
        .attr('x', labelPos.x)
        .attr('y', labelPos.y)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('font-size', `${fontSize}px`)
        .attr('font-weight', activeAxis === dim ? 'bold' : 'normal')
        .attr('fill', activeAxis === dim ? activeColor : labelColor)
        .text(dim);
    });

    // Draw the ratings shape
    const path = svg.append('path')
      .attr('d', generatePath())
      .attr('fill', fillColor)
      .attr('fill-opacity', fillOpacity)
      .attr('stroke', strokeColor || fillColor)
      .attr('stroke-width', 2)
      .attr('stroke-opacity', strokeOpacity);

    if (strokeDashed) {
      path.attr('stroke-dasharray', '6,3');
    }

    // Draw points at each rating (optional)
    if (showDots) {
      EFFECT_DIMENSIONS.forEach((dim, i) => {
        const coords = getCoordinates(i, ratings[dim]);
        svg.append('circle')
          .attr('cx', coords.x)
          .attr('cy', coords.y)
          .attr('r', activeAxis === dim ? activeDotRadius : dotRadius)
          .attr('fill', fillColor)
          .attr('stroke', 'white')
          .attr('stroke-width', Math.max(1, 2 * scale))
          .style('cursor', interactive ? 'pointer' : 'default');
      });
    }

  }, [ratings, activeAxis, centerX, centerY, radius, angleSlice, levels, fillColor, fillOpacity, generatePath, getCoordinates, interactive, gridColor, axisColor, labelColor, activeColor, strokeDashed, fontSize, dotRadius, activeDotRadius, labelOffset, scale, showDots, strokeOpacity, strokeColor]);

  // Mouse event handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!interactive) return;
    setIsDragging(true);
    handleInteraction(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!interactive || !isDragging) return;
    handleInteraction(e.clientX, e.clientY);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setActiveAxis(null);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    setActiveAxis(null);
  };

  // Check if a point is inside the chart circle (not in the label margin)
  const isInsideChartArea = useCallback((clientX: number, clientY: number): boolean => {
    if (!svgRef.current) return false;
    const rect = svgRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const dx = x - centerX;
    const dy = y - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    // Only trigger if touch is within the chart radius (not in label area)
    return distance <= radius;
  }, [centerX, centerY, radius]);

  // Touch event handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!interactive) return;
    const touch = e.touches[0];

    // Only capture touch if it's inside the chart area
    if (!isInsideChartArea(touch.clientX, touch.clientY)) {
      // Let the touch event bubble up for page scrolling
      return;
    }

    e.preventDefault();
    setIsDragging(true);
    handleInteraction(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!interactive || !isDragging) return;
    e.preventDefault();
    const touch = e.touches[0];
    handleInteraction(touch.clientX, touch.clientY);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setActiveAxis(null);
  };

  return (
    <svg
      ref={svgRef}
      width={size}
      height={size}
      className="select-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    />
  );
}
