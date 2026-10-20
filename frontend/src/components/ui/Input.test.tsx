import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Input } from './Input';

describe('Input Component', () => {
  it('renders with label association via htmlFor and id without throwing', () => {
    render(<Input label="Product name" placeholder="milk, eggs..." />);
    const input = screen.getByLabelText(/product name/i);
    const label = screen.getByText(/product name/i);

    expect(input).toBeInTheDocument();
    expect(label).toBeInTheDocument();
    expect(label).toHaveAttribute('for', input.getAttribute('id'));
    expect(input).toHaveAttribute('placeholder', 'milk, eggs...');
    expect(input.style.borderRadius).toBe('var(--radius-card)');
    expect(input.style.minHeight).toBe('var(--touch-target-min)');
  });

  it('renders custom id when provided', () => {
    render(<Input id="custom-item-input" label="Custom item" />);
    const input = screen.getByLabelText(/custom item/i);
    expect(input).toHaveAttribute('id', 'custom-item-input');
  });

  it('renders error message with role="alert" and aria-describedby linkage for screen readers', () => {
    render(
      <Input
        label="Quantity"
        placeholder="e.g. 500 ml"
        error="Please enter a valid quantity"
      />
    );
    const input = screen.getByLabelText(/quantity/i);
    const errorMessage = screen.getByRole('alert');

    expect(errorMessage).toBeInTheDocument();
    expect(errorMessage).toHaveTextContent('Please enter a valid quantity');
    expect(input).toHaveAttribute('aria-invalid', 'true');

    const errorId = errorMessage.getAttribute('id');
    expect(errorId).toBeTruthy();
    expect(input.getAttribute('aria-describedby')).toContain(errorId!);
    expect(input.style.border).toBe('1.5px solid var(--color-paprika)');
  });

  it('does not render error alert or aria-invalid when no error is present', () => {
    render(
      <Input
        label="Notes"
        placeholder="Any extra info"
        helperText="Optional item notes"
      />
    );
    const input = screen.getByLabelText(/notes/i);
    expect(screen.queryByRole('alert')).toBeNull();
    expect(input).toHaveAttribute('aria-invalid', 'false');
    expect(screen.getByText(/optional item notes/i)).toBeInTheDocument();
  });
});
