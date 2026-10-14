// A smooth line through the points that never overshoots them (monotone
// cubic), so a curve never suggests a value that wasn't measured.
export function smoothPath(points: [number, number][]) {
  const n = points.length;
  if (n < 2) return "";
  const slopes = points
    .slice(0, -1)
    .map(([x, y], i) => (points[i + 1][1] - y) / (points[i + 1][0] - x));
  const tangents = points.map((_, i) =>
    i === 0
      ? slopes[0]
      : i === n - 1
        ? slopes[n - 2]
        : slopes[i - 1] * slopes[i] <= 0
          ? 0
          : (slopes[i - 1] + slopes[i]) / 2,
  );
  slopes.forEach((s, i) => {
    if (s === 0) {
      tangents[i] = tangents[i + 1] = 0;
      return;
    }
    const a = tangents[i] / s;
    const b = tangents[i + 1] / s;
    const h = a * a + b * b;
    if (h > 9) {
      const k = 3 / Math.sqrt(h);
      tangents[i] = k * a * s;
      tangents[i + 1] = k * b * s;
    }
  });
  let d = `M${points[0][0]},${points[0][1]}`;
  for (let i = 0; i < n - 1; i++) {
    const [x0, y0] = points[i];
    const [x1, y1] = points[i + 1];
    const third = (x1 - x0) / 3;
    d += `C${x0 + third},${y0 + tangents[i] * third},${x1 - third},${
      y1 - tangents[i + 1] * third
    },${x1},${y1}`;
  }
  return d;
}
