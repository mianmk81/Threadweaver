/**
 * Spline utilities for smooth thread curves in Living Loom
 * Uses Catmull-Rom splines for C1 continuity
 */

export type Point = {
  x: number;
  y: number;
  baseY: number; // Original Y position (for wiggle offset)
};

/**
 * Catmull-Rom spline interpolation
 * Generates a smooth curve through control points with C1 continuity
 */
export function catmullRomSpline(
  points: Point[],
  tension: number = 0.5,
  segmentsPerPoint: number = 10
): Point[] {
  if (points.length < 2) return points;

  const result: Point[] = [];

  // For each segment between control points
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];

    // Generate interpolated points
    for (let t = 0; t < segmentsPerPoint; t++) {
      const s = t / segmentsPerPoint;
      const s2 = s * s;
      const s3 = s2 * s;

      // Catmull-Rom basis functions
      const h00 = 2 * s3 - 3 * s2 + 1;
      const h10 = s3 - 2 * s2 + s;
      const h01 = -2 * s3 + 3 * s2;
      const h11 = s3 - s2;

      // Tangents (scaled by tension)
      const m1x = tension * (p2.x - p0.x);
      const m1y = tension * (p2.y - p0.y);
      const m2x = tension * (p3.x - p1.x);
      const m2y = tension * (p3.y - p1.y);

      // Hermite interpolation
      const x = h00 * p1.x + h10 * m1x + h01 * p2.x + h11 * m2x;
      const y = h00 * p1.y + h10 * m1y + h01 * p2.y + h11 * m2y;
      const baseY = h00 * p1.baseY + h10 * tension * (p2.baseY - p0.baseY) +
                    h01 * p2.baseY + h11 * tension * (p3.baseY - p1.baseY);

      result.push({ x, y, baseY });
    }
  }

  // Add final point
  result.push(points[points.length - 1]);

  return result;
}

/**
 * Generate control points for a thread based on node positions
 * Optional noise function for breathing animation
 * Optional deformation function for grab-and-pull interaction
 */
export function generateThreadControlPoints(
  nodeSteps: number[],
  yPosition: number,
  canvasWidth: number = 1000,
  wiggleFunction?: (x: number) => number,
  deformFunction?: (x: number) => { x: number; y: number }
): Point[] {
  if (nodeSteps.length === 0) return [];

  const controlPoints: Point[] = [];

  // Create control points at each node
  nodeSteps.forEach((step) => {
    const x = (step / 10) * canvasWidth; // Map step 0-10 to canvas width
    const wiggleOffset = wiggleFunction ? wiggleFunction(x) : 0;
    const deformOffset = deformFunction ? deformFunction(x) : { x: 0, y: 0 };

    controlPoints.push({
      x: x + deformOffset.x,
      y: yPosition + wiggleOffset + deformOffset.y,
      baseY: yPosition,
    });
  });

  return controlPoints;
}

/**
 * Convert array of points to SVG path string
 * Returns both path string and approximate length
 */
export function pointsToSVGPath(points: Point[]): { path: string; length: number } {
  if (points.length === 0) return { path: '', length: 0 };

  let path = `M ${points[0].x} ${points[0].y}`;
  let length = 0;

  // Use quadratic Bezier curves for smoother rendering
  for (let i = 1; i < points.length; i++) {
    const curr = points[i];
    const prev = points[i - 1];

    // Control point is midway between previous and current
    const cpX = (prev.x + curr.x) / 2;
    const cpY = (prev.y + curr.y) / 2;

    path += ` Q ${cpX} ${cpY} ${curr.x} ${curr.y}`;

    // Approximate length (straight line distance)
    const dx = curr.x - prev.x;
    const dy = curr.y - prev.y;
    length += Math.sqrt(dx * dx + dy * dy);
  }

  return { path, length };
}

/**
 * Calculate path length (approximate)
 */
export function calculatePathLength(points: Point[]): number {
  let length = 0;
  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x;
    const dy = points[i].y - points[i - 1].y;
    length += Math.sqrt(dx * dx + dy * dy);
  }
  return length;
}
