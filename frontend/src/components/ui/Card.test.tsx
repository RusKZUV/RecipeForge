import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Card } from './Card';

describe('Card Component', () => {
  it('renders children with token-driven styles (border, radius, shadow, background) without throwing', () => {
    render(
      <Card data-testid="pantry-card">
        <h3>Milk</h3>
        <p>500 ml</p>
      </Card>
    );

    const card = screen.getByTestId('pantry-card');
    expect(card).toBeInTheDocument();
    expect(screen.getByText('Milk')).toBeInTheDocument();
    expect(screen.getByText('500 ml')).toBeInTheDocument();

    expect(card).toHaveClass('rf-card');
    expect(card.style.border).toBe('var(--border-ink)');
    expect(card.style.borderRadius).toBe('var(--radius-card)');
    expect(card.style.boxShadow).toBe('var(--shadow-card)');
    expect(card.style.backgroundColor).toBe('var(--color-card)');
  });

  it('merges custom className and custom styles cleanly', () => {
    render(
      <Card data-testid="custom-card" className="custom-class" style={{ marginTop: '20px' }}>
        <span>Custom card</span>
      </Card>
    );

    const card = screen.getByTestId('custom-card');
    expect(card).toHaveClass('rf-card', 'custom-class');
    expect(card.style.marginTop).toBe('20px');
  });
});
