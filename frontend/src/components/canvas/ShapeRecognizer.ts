export type RecognizedShape =
  | { type: "circle"; cx: number; cy: number; radius: number }
  | { type: "arc"; cx: number; cy: number; radius: number; startAngle: number; endAngle: number; clockwise: boolean; largeArc: boolean }
  | { type: "rect"; left: number; top: number; width: number; height: number }
  | { type: "arrow"; x1: number; y1: number; x2: number; y2: number }
  | { type: "line"; x1: number; y1: number; x2: number; y2: number }
  | { type: "unknown" };

type Point = { x: number; y: number };

function dist(a: Point, b: Point) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function centroid(points: Point[]): Point {
  const s = points.reduce((a, p) => ({ x: a.x + p.x, y: a.y + p.y }), { x: 0, y: 0 });
  return { x: s.x / points.length, y: s.y / points.length };
}

function sample<T>(arr: T[], max: number): T[] {
  if (arr.length <= max) return arr;
  const step = arr.length / max;
  return Array.from({ length: max }, (_, i) => arr[Math.floor(i * step)]);
}

function heading(a: Point, b: Point) {
  return (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
}

function angleDiff(from: number, to: number) {
  return ((to - from + 540) % 360) - 180;
}

function ptSegDist(p: Point, a: Point, b: Point): number {
  const ab = { x: b.x - a.x, y: b.y - a.y };
  const lenSq = ab.x ** 2 + ab.y ** 2;
  if (lenSq === 0) return dist(p, a);
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * ab.x + (p.y - a.y) * ab.y) / lenSq));
  return dist(p, { x: a.x + t * ab.x, y: a.y + t * ab.y });
}

// ── Circle: closed loop, uniform radius ──────────────────────────────────────
function tryCircle(points: Point[]): RecognizedShape | null {
  if (points.length < 12) return null;
  const c = centroid(points);
  const radii = points.map(p => dist(p, c));
  const avgR = radii.reduce((s, r) => s + r, 0) / radii.length;
  if (avgR < 5) return null;
  const cv = Math.sqrt(radii.reduce((s, r) => s + (r - avgR) ** 2, 0) / radii.length) / avgR;
  const closedRatio = dist(points[0], points[points.length - 1]) / avgR;
  const xs = points.map(p => p.x), ys = points.map(p => p.y);
  const aspect = (Math.max(...xs) - Math.min(...xs)) / Math.max(1, Math.max(...ys) - Math.min(...ys));
  if (cv < 0.30 && closedRatio < 1.8 && aspect > 0.6 && aspect < 1.7) {
    return { type: "circle", cx: c.x, cy: c.y, radius: avgR };
  }
  return null;
}

// ── Arc: open circular path (C-shape, U-shape, bracket) ──────────────────────
function tryArc(points: Point[]): RecognizedShape | null {
  if (points.length < 10) return null;
  const c = centroid(points);
  const radii = points.map(p => dist(p, c));
  const avgR = radii.reduce((s, r) => s + r, 0) / radii.length;
  if (avgR < 5) return null;
  const cv = Math.sqrt(radii.reduce((s, r) => s + (r - avgR) ** 2, 0) / radii.length) / avgR;
  if (cv > 0.32) return null; // not circular enough

  // Must be OPEN (not a closed circle)
  const closedRatio = dist(points[0], points[points.length - 1]) / avgR;
  if (closedRatio < 0.4) return null;

  // Compute angular span using sorted angles with gap detection
  const angles = points.map(p => Math.atan2(p.y - c.y, p.x - c.x) * 180 / Math.PI);
  const sorted = [...angles].sort((a, b) => a - b);
  let maxGap = 0;
  for (let i = 0; i < sorted.length - 1; i++) {
    const gap = sorted[i + 1] - sorted[i];
    if (gap > maxGap) { maxGap = gap; }
  }
  const wrapGap = sorted[0] + 360 - sorted[sorted.length - 1];
  if (wrapGap > maxGap) { maxGap = wrapGap; }

  const arcSpan = 360 - maxGap;
  if (arcSpan < 120 || maxGap < 25) return null; // too small arc or barely open

  // Start/end angle from first & last drawn points
  const startAngle = Math.atan2(points[0].y - c.y, points[0].x - c.x) * 180 / Math.PI;
  const endAngle = Math.atan2(points[points.length - 1].y - c.y, points[points.length - 1].x - c.x) * 180 / Math.PI;

  // Clockwise detection via cross product
  const mid = points[Math.floor(points.length / 2)];
  const v1 = { x: points[0].x - c.x, y: points[0].y - c.y };
  const v2 = { x: mid.x - c.x, y: mid.y - c.y };
  const clockwise = (v1.x * v2.y - v1.y * v2.x) < 0;

  return { type: "arc", cx: c.x, cy: c.y, radius: avgR, startAngle, endAngle, clockwise, largeArc: arcSpan > 180 };
}

// ── Rectangle: 4 corner direction-changes ────────────────────────────────────
function tryRect(points: Point[]): RecognizedShape | null {
  if (points.length < 10) return null;
  const pts = sample(points, 120);
  const win = Math.max(2, Math.floor(pts.length / 20));
  const turns: { idx: number; change: number }[] = [];
  for (let i = win; i < pts.length - win; i++) {
    const change = Math.abs(angleDiff(heading(pts[i - win], pts[i]), heading(pts[i], pts[i + win])));
    if (change > 50) turns.push({ idx: i, change });
  }
  if (turns.length < 3) return null;
  const corners: typeof turns = [];
  let lastIdx = -999;
  for (const t of turns) {
    if (t.idx - lastIdx > win * 2) { corners.push(t); lastIdx = t.idx; }
    else if (t.change > corners[corners.length - 1].change) { corners[corners.length - 1] = t; lastIdx = t.idx; }
  }
  if (corners.length < 3 || corners.length > 6) return null;
  const segs = [0, ...corners.map(c => c.idx), pts.length - 1];
  for (let s = 0; s < segs.length - 1; s++) {
    const seg = pts.slice(segs[s], segs[s + 1] + 1);
    if (seg.length < 2) continue;
    const maxDev = seg.reduce((m, p) => Math.max(m, ptSegDist(p, seg[0], seg[seg.length - 1])), 0);
    const len = dist(seg[0], seg[seg.length - 1]);
    if (len > 10 && maxDev / len > 0.30) return null;
  }
  const xs = points.map(p => p.x), ys = points.map(p => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  if (maxX - minX < 10 || maxY - minY < 10) return null;
  return { type: "rect", left: minX, top: minY, width: maxX - minX, height: maxY - minY };
}

function isLinear(points: Point[]): boolean {
  if (points.length < 2) return false;
  const [first, last] = [points[0], points[points.length - 1]];
  return points.filter(p => ptSegDist(p, first, last) < 20).length / points.length >= 0.80;
}

function tryArrow(points: Point[]): RecognizedShape | null {
  if (!isLinear(points)) return null;
  const tail = points.slice(-Math.max(2, Math.floor(points.length * 0.12)));
  const main = { x: points[points.length - 1].x - points[0].x, y: points[points.length - 1].y - points[0].y };
  const tailDir = { x: tail[tail.length - 1].x - tail[0].x, y: tail[tail.length - 1].y - tail[0].y };
  const dot = main.x * tailDir.x + main.y * tailDir.y;
  const mag = Math.sqrt(main.x ** 2 + main.y ** 2) * Math.sqrt(tailDir.x ** 2 + tailDir.y ** 2);
  if (mag === 0) return null;
  if ((Math.acos(Math.max(-1, Math.min(1, dot / mag))) * 180) / Math.PI > 45)
    return { type: "arrow", x1: points[0].x, y1: points[0].y, x2: points[points.length - 1].x, y2: points[points.length - 1].y };
  return null;
}

function tryLine(points: Point[]): RecognizedShape | null {
  if (!isLinear(points)) return null;
  return { type: "line", x1: points[0].x, y1: points[0].y, x2: points[points.length - 1].x, y2: points[points.length - 1].y };
}

export function recognizeShape(points: Point[]): RecognizedShape {
  if (points.length < 3) return { type: "unknown" };
  return tryCircle(points) ?? tryArc(points) ?? tryRect(points) ?? tryArrow(points) ?? tryLine(points) ?? { type: "unknown" };
}
