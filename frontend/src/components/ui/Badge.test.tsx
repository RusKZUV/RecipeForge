import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Badge, ExpiryStatus } from './Badge';

describe('Badge Component', () => {
  it('renders default badge without throwing', () => {
    render(<Badge>Generic tag</Badge>);
    const badge = screen.getByText('Generic tag');

    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('rf-badge', 'rf-badge--default');
    expect(badge.style.borderRadius).toBe('var(--radius-pill)');
    expect(badge.style.border).toBe('var(--border-ink)');
    expect(badge.style.minHeight).toBe('var(--touch-target-min)');
    expect(badge.style.backgroundColor).toBe('var(--color-card)');
    expect(badge.style.color).toBe('var(--color-ink)');
  });

  const testCases: Array<{
    status: ExpiryStatus;
    label: string;
    expectedClass: string;
    expectedBg: string;
    expectedFg: string;
  }> = [
    {
      status: 'fresh',
      label: 'fresh',
      expectedClass: 'rf-badge--fresh',
      expectedBg: 'var(--color-olive-bg)',
      expectedFg: 'var(--color-olive-fg)',
    },
    {
      status: 'expiring_soon',
      label: 'expiring in 2 days',
      expectedClass: 'rf-badge--expiring-soon',
      expectedBg: 'var(--color-turmeric)',
      expectedFg: 'var(--color-ink)',
    },
    {
      status: 'expiring-soon',
      label: 'expiring soon',
      expectedClass: 'rf-badge--expiring-soon',
      expectedBg: 'var(--color-turmeric)',
      expectedFg: 'var(--color-ink)',
    },
    {
      status: 'expires_today',
      label: 'expires today',
      expectedClass: 'rf-badge--expires-today',
      expectedBg: 'var(--color-paprika)',
      expectedFg: 'var(--color-card)',
    },
    {
      status: 'expires-today',
      label: 'expires today',
      expectedClass: 'rf-badge--expires-today',
      expectedBg: 'var(--color-paprika)',
      expectedFg: 'var(--color-card)',
    },
    {
      status: 'expired',
      label: 'expired · discard',
      expectedClass: 'rf-badge--expired',
      expectedBg: 'var(--color-expired-bg)',
      expectedFg: 'var(--color-expired-fg)',
    },
  ];

  testCases.forEach(({ status, label, expectedClass, expectedBg, expectedFg }) => {
    it(`maps status "${status}" to correct token pair: fg="${expectedFg}", bg="${expectedBg}"`, () => {
      render(<Badge status={status}>{label}</Badge>);
      const badge = screen.getByText(label);

      expect(badge).toHaveClass(expectedClass);
      expect(badge.style.backgroundColor).toBe(expectedBg);
      expect(badge.style.color).toBe(expectedFg);
      expect(badge.style.borderRadius).toBe('var(--radius-pill)');
      expect(badge.style.border).toBe('var(--border-ink)');
      expect(badge.style.minHeight).toBe('var(--touch-target-min)');
    });
  });

  it('contains no emoji characters in badge text', () => {
    render(<Badge status="fresh">Fresh milk</Badge>);
    const badge = screen.getByText('Fresh milk');
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
    expect(emojiRegex.test(badge.textContent || '')).toBe(false);
  });

  it('falls back gracefully to default card styling when given unknown status', () => {
    // @ts-expect-error testing invalid status fallback
    render(<Badge status="nonexistent_status">Custom tag</Badge>);
    const badge = screen.getByText('Custom tag');
    expect(badge).toHaveClass('rf-badge--default');
    expect(badge.style.backgroundColor).toBe('var(--color-card)');
    expect(badge.style.color).toBe('var(--color-ink)');
  });

  it('forwards ref correctly to the HTMLSpanElement', () => {
    const ref = createRef<HTMLSpanElement>();
    render(<Badge ref={ref}>Ref badge</Badge>);
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  });
});
