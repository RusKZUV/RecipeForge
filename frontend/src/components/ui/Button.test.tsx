import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Button } from './Button';

describe('Button Component', () => {
  it('renders default variant with ink-filled token styles without throwing', () => {
    render(<Button>Cook tonight</Button>);
    const button = screen.getByRole('button', { name: /cook tonight/i });

    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('rf-button', 'rf-button--default');
    expect(button.style.backgroundColor).toBe('var(--color-ink)');
    expect(button.style.color).toBe('var(--color-card)');
    expect(button.style.borderRadius).toBe('var(--radius-pill)');
    expect(button.style.minHeight).toBe('var(--touch-target-min)');
    expect(button.style.border).toBe('var(--border-ink)');
  });

  it('renders outlined variant with card background and ink text', () => {
    render(<Button variant="outlined">Cancel</Button>);
    const button = screen.getByRole('button', { name: /cancel/i });

    expect(button).toHaveClass('rf-button--outlined');
    expect(button.style.backgroundColor).toBe('var(--color-card)');
    expect(button.style.color).toBe('var(--color-ink)');
  });

  it('renders fullWidth option with 100% width', () => {
    render(<Button fullWidth>Add to pantry</Button>);
    const button = screen.getByRole('button', { name: /add to pantry/i });

    expect(button).toHaveClass('rf-button--full-width');
    expect(button.style.width).toBe('100%');
  });

  it('handles click events when enabled', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    const button = screen.getByRole('button', { name: /click me/i });

    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('disables activation via pointer and keyboard (Enter/Space) in disabled state', () => {
    const handleClick = vi.fn();
    render(
      <Button disabled onClick={handleClick}>
        Disabled action
      </Button>
    );
    const button = screen.getByRole('button', { name: /disabled action/i });

    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('disabled');

    // Click attempt
    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();

    // Keyboard attempts: Enter and Space
    fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' });
    fireEvent.keyPress(button, { key: 'Enter', code: 'Enter', charCode: 13 });
    fireEvent.keyDown(button, { key: ' ', code: 'Space' });
    fireEvent.keyPress(button, { key: ' ', code: 'Space', charCode: 32 });
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('supports icon-only button with accessible aria-label without emoji', () => {
    render(
      <Button aria-label="Close dialog">
        <svg aria-hidden="true" width="16" height="16">
          <circle cx="8" cy="8" r="8" />
        </svg>
      </Button>
    );
    const button = screen.getByRole('button', { name: /close dialog/i });
    expect(button).toHaveAttribute('aria-label', 'Close dialog');
  });
});
