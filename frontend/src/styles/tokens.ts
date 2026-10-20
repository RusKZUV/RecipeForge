/**
 * RecipeForge Design System Tokens
 * Source-of-truth TypeScript definitions matching tokens.css and docs/design-system.md
 */

export const TOKENS = {
  colors: {
    paper: '#F6EFE2',
    card: '#FFFBF2',
    ink: '#2B2118',
    inkSoft: '#5A4A3A',
    paprika: '#B83A22',
    turmeric: '#E0A526',
    oliveFg: '#3E4A24',
    oliveBg: '#E3E8D3',
    expiredFg: '#6B2A1D',
    expiredBg: '#E6D9C8',
  },
  typography: {
    display: "'Fraunces', Georgia, serif",
    handwritten: "'Caveat', cursive",
    body: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  shape: {
    borderWidth: '1.5px',
    borderInk: '1.5px solid var(--color-ink)',
    shadowCard: '3px 3px 0 var(--color-ink)',
    radiusCard: '14px',
    radiusPill: '99px',
    minTouchTarget: '44px',
  },
  spacing: {
    pageX: '18px',
    gapCards: '12px',
    layoutMaxWidth: '480px',
  },
} as const;

export interface RgbColor {
  r: number;
  g: number;
  b: number;
}

export function hexToRgb(hex: string): RgbColor {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  return { r, g, b };
}

export function relativeLuminance(rgb: RgbColor): number {
  const [sR, sG, sB] = [rgb.r, rgb.g, rgb.b].map((val) => {
    const s = val / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * sR + 0.7152 * sG + 0.0722 * sB;
}

/**
 * Calculates the WCAG contrast ratio between two hex colors.
 * Formula: (L1 + 0.05) / (L2 + 0.05) where L1 is lighter and L2 is darker.
 */
export function getContrastRatio(hex1: string, hex2: string): number {
  const lum1 = relativeLuminance(hexToRgb(hex1));
  const lum2 = relativeLuminance(hexToRgb(hex2));
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}
