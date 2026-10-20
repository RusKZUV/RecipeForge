import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Layout } from './Layout';
import { Card } from '../ui/Card';

describe('Layout Component', () => {
  it('renders layout shell with paper background and max-width container without throwing', () => {
    const { container } = render(
      <Layout>
        <Card data-testid="test-card">Content</Card>
      </Layout>
    );

    const layoutRoot = container.firstChild as HTMLElement;
    expect(layoutRoot).toHaveClass('rf-layout');
    expect(layoutRoot.style.backgroundColor).toBe('var(--color-paper)');
    expect(layoutRoot.style.overflowX).toBe('hidden');

    const innerContainer = container.querySelector('.rf-layout__container') as HTMLElement;
    expect(innerContainer).toBeInTheDocument();
    expect(innerContainer.style.maxWidth).toBe('var(--layout-max-width)');
    expect(innerContainer.style.padding).toBe('18px var(--space-page-x) 80px var(--space-page-x)');
    expect(innerContainer.style.gap).toBe('var(--gap-cards)');
  });

  it('renders persistent disclaimer note and navigation bar', () => {
    render(
      <Layout activeTab="pantry">
        <div>Child element</div>
      </Layout>
    );

    expect(screen.getByText('Child element')).toBeInTheDocument();
    expect(
      screen.getByText(/dates are user estimates\. the app never says an item is safe to eat\./i)
    ).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: /main navigation/i })).toBeInTheDocument();
  });

  it('can conditionally hide navigation if showNav is false', () => {
    render(
      <Layout showNav={false}>
        <div>Standalone page</div>
      </Layout>
    );

    expect(screen.queryByRole('navigation', { name: /main navigation/i })).toBeNull();
  });

  it('prevents horizontal scrollbars and centers container with defined max-width', () => {
    const { container } = render(
      <Layout>
        <div>Content block</div>
      </Layout>
    );

    const layout = container.querySelector('.rf-layout') as HTMLElement;
    const contentContainer = container.querySelector('.rf-layout__container') as HTMLElement;

    expect(layout.style.overflowX).toBe('hidden');
    expect(layout.style.alignItems).toBe('center');
    expect(contentContainer.style.maxWidth).toBe('var(--layout-max-width)');
    expect(contentContainer.style.boxSizing).toBe('border-box');
  });
});
