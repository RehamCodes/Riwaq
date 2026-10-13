// All coordinates and sizes are in "page-width units": 1 = the page's width.
// Annotations therefore stay in place at any zoom level.
export type Point = [number, number];

export type Tool =
  | "hand"
  | "pen"
  | "highlighter"
  | "eraser"
  | "line"
  | "arrow"
  | "rect"
  | "ellipse"
  | "text"
  | "sticker";

type Base = { id: string; color: string; size: number };

export type StrokeAnnotation = Base & {
  kind: "pen" | "highlighter";
  points: Point[];
};

export type ShapeAnnotation = Base & {
  kind: "line" | "arrow" | "rect" | "ellipse";
  from: Point;
  to: Point;
};

// `size` is the font size.
export type TextAnnotation = Base & { kind: "text"; at: Point; text: string };

// Post-it style arrow flag marking a place in the book. `at` is the tip.
export type StickerAnnotation = Base & { kind: "sticker"; at: Point };

export type Annotation =
  StrokeAnnotation | ShapeAnnotation | TextAnnotation | StickerAnnotation;

export function isStroke(a: Annotation): a is StrokeAnnotation {
  return a.kind === "pen" || a.kind === "highlighter";
}

export function isShape(a: Annotation): a is ShapeAnnotation {
  return !isStroke(a) && a.kind !== "text" && a.kind !== "sticker";
}

// Annotations per page number.
export type PageAnnotations = Record<number, Annotation[]>;

export const inkColors = [
  { value: "#1f2937", label: "Black" },
  { value: "#e5484d", label: "Red" },
  { value: "#2b6fd6", label: "Blue" },
  { value: "#1f9d55", label: "Green" },
  { value: "#facc15", label: "Yellow" },
  { value: "#8250d2", label: "Purple" },
];

export const stickerColors = [
  { value: "#fde047", label: "Yellow" },
  { value: "#f9a8d4", label: "Pink" },
  { value: "#86efac", label: "Green" },
  { value: "#93c5fd", label: "Blue" },
  { value: "#fdba74", label: "Orange" },
];

// Sticker size in page-width units (stays the same size relative to the page).
export const STICKER = { width: 0.11, height: 0.04, tip: 0.022 };

// Arrow-flag outline with its tip at `at`. Points left, or right when there
// isn't room on the right side of the page.
export function stickerPath([x, y]: Point) {
  const { width: w, height: h, tip: t } = STICKER;
  const dir = x + w > 1 ? -1 : 1;
  const r = h * 0.15;
  return [
    `M ${x} ${y}`,
    `L ${x + dir * t} ${y - h / 2}`,
    `L ${x + dir * (w - r)} ${y - h / 2}`,
    `Q ${x + dir * w} ${y - h / 2} ${x + dir * w} ${y - h / 2 + r}`,
    `L ${x + dir * w} ${y + h / 2 - r}`,
    `Q ${x + dir * w} ${y + h / 2} ${x + dir * (w - r)} ${y + h / 2}`,
    `L ${x + dir * t} ${y + h / 2}`,
    "Z",
  ].join(" ");
}

export type SizeOption = "s" | "m" | "l";

const strokeSizes: Record<SizeOption, number> = {
  s: 0.002,
  m: 0.004,
  l: 0.008,
};
const fontSizes: Record<SizeOption, number> = {
  s: 0.018,
  m: 0.026,
  l: 0.04,
};

export function sizeFor(tool: Tool, size: SizeOption) {
  if (tool === "text") return fontSizes[size];
  if (tool === "highlighter") return strokeSizes[size] * 5;
  return strokeSizes[size];
}

// Smooth freehand path: quadratic curves through the midpoints.
export function strokePath(points: Point[]) {
  if (points.length === 0) return "";
  const [x0, y0] = points[0];
  if (points.length === 1) return `M ${x0} ${y0} l 0.0001 0`;
  let d = `M ${x0} ${y0}`;
  for (let i = 1; i < points.length; i++) {
    const [px, py] = points[i - 1];
    const [x, y] = points[i];
    d += ` Q ${px} ${py} ${(px + x) / 2} ${(py + y) / 2}`;
  }
  const [lx, ly] = points[points.length - 1];
  return `${d} L ${lx} ${ly}`;
}

export function arrowHead(from: Point, to: Point, size: number) {
  const angle = Math.atan2(to[1] - from[1], to[0] - from[0]);
  const length = size * 4 + 0.012;
  const wing = (offset: number): Point => [
    to[0] - length * Math.cos(angle + offset),
    to[1] - length * Math.sin(angle + offset),
  ];
  const [a, b] = [wing(Math.PI / 7), wing(-Math.PI / 7)];
  return `M ${a[0]} ${a[1]} L ${to[0]} ${to[1]} L ${b[0]} ${b[1]}`;
}
