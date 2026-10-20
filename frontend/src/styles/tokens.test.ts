import { describe, it, expect } from 'vitest';
import { TOKENS, getContrastRatio } from './tokens';

describe('Design Tokens', () => {
  it('defines the exact 8 hex colors specified in docs/design-system.md', () => {
    expect(TOKENS.colors.paper).toBe('#F6EFE2');
    expect(TOKENS.colors.card).toBe('#FFFBF2');
    expect(TOKENS.colors.ink).toBe('#2B2118');
    expect(TOKENS.colors.inkSoft).toBe('#5A4A3A');
    expect(TOKENS.colors.paprika).toBe('#B83A22');
    expect(TOKENS.colors.turmeric).toBe('#E0A526');
    expect(TOKENS.colors.oliveFg).toBe('#3E4A24');
    expect(TOKENS.colors.oliveBg).toBe('#E3E8D3');
    expect(TOKENS.colors.expiredFg).toBe('#6B2A1D');
    expect(TOKENS.colors.expiredBg).toBe('#E6D9C8');
  });

  describe('WCAG AA Contrast Verification (>= 4.5:1)', () => {
    it('verifies ink on paper meets WCAG AA contrast', () => {
      const ratio = getContrastRatio(TOKENS.colors.ink, TOKENS.colors.paper);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('verifies ink on card meets WCAG AA contrast', () => {
      const ratio = getContrastRatio(TOKENS.colors.ink, TOKENS.colors.card);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('verifies ink-soft on paper meets WCAG AA contrast', () => {
      const ratio = getContrastRatio(TOKENS.colors.inkSoft, TOKENS.colors.paper);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('verifies ink-soft on card meets WCAG AA contrast', () => {
      const ratio = getContrastRatio(TOKENS.colors.inkSoft, TOKENS.colors.card);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('verifies olive-fg on olive-bg (fresh status) meets WCAG AA contrast', () => {
      const ratio = getContrastRatio(TOKENS.colors.oliveFg, TOKENS.colors.oliveBg);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('verifies expired-fg on expired-bg (expired status) meets WCAG AA contrast', () => {
      const ratio = getContrastRatio(TOKENS.colors.expiredFg, TOKENS.colors.expiredBg);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('verifies card text on paprika (expires-today status) meets WCAG AA contrast', () => {
      const ratio = getContrastRatio(TOKENS.colors.card, TOKENS.colors.paprika);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('verifies ink text on turmeric (expiring-soon status) meets WCAG AA contrast', () => {
      const ratio = getContrastRatio(TOKENS.colors.ink, TOKENS.colors.turmeric);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('verifies card text on ink background (inverted button/tab) meets WCAG AA contrast', () => {
      const ratio = getContrastRatio(TOKENS.colors.card, TOKENS.colors.ink);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });
  });
});
