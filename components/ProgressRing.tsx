import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface ProgressRingProps {
  percentage: number; // 0 to 100
  size?: number;
  strokeWidth?: number;
  color?: string;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  percentage,
  size = 280,
  strokeWidth = 20,
  color = '#6366f1' // Indigo-500
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const radius = (size - strokeWidth) / 2;

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous

    const g = svg
      .append("g")
      .attr("transform", `translate(${size / 2}, ${size / 2})`);

    // Background Circle
    const bgArc = d3.arc()
      .innerRadius(radius - strokeWidth / 2)
      .outerRadius(radius + strokeWidth / 2)
      .startAngle(0)
      .endAngle(2 * Math.PI);

    g.append("path")
      .attr("d", bgArc as any)
      .attr("fill", "#e2e8f0"); // Slate-200

    // Foreground Arc
    const angle = (percentage / 100) * 2 * Math.PI;
    
    const fgArc = d3.arc()
      .innerRadius(radius - strokeWidth / 2)
      .outerRadius(radius + strokeWidth / 2)
      .startAngle(0)
      .endAngle(angle)
      .cornerRadius(10); // Rounded tips

    g.append("path")
      .attr("d", fgArc as any)
      .attr("fill", color)
      .transition()
      .duration(750)
      .attrTween("d", function(d) {
        const i = d3.interpolate({endAngle: 0}, {endAngle: angle});
        return function(t: number) {
            // @ts-ignore
            d.endAngle = i(t).endAngle;
            // @ts-ignore
            return fgArc(d);
        };
      });

  }, [percentage, size, strokeWidth, color, radius]);

  return (
    <svg ref={svgRef} width={size} height={size} className="drop-shadow-xl" />
  );
};
