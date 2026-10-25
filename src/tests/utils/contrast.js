/**
 * WCAG contrast ratio between two CSS colors ("#rrggbb" or "rgb(r, g, b)").
 * Used by unit tests that guard text colors against axe color-contrast failures.
 */
const toRgb = (color) => {
  const c = String(color).trim();
  const hex = c.match(/^#([0-9a-f]{6})$/i);
  if (hex) return [0, 2, 4].map((i) => parseInt(hex[1].slice(i, i + 2), 16));
  const rgb = c.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (rgb) return rgb.slice(1, 4).map(Number);
  throw new Error(`Unknown color: ${color}`);
};

const luminance = (color) => {
  const [r, g, b] = toRgb(color).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

export const contrastRatio = (fg, bg) => {
  const [a, b] = [luminance(fg), luminance(bg)].sort((x, y) => y - x);
  return (a + 0.05) / (b + 0.05);
};

/** A color blended over white at the given alpha (e.g. MUI `color + '20'`). */
export const overWhite = (color, alpha) => {
  const rgb = toRgb(color).map((v) => Math.round(v * alpha + 255 * (1 - alpha)));
  return `rgb(${rgb.join(', ')})`;
};
