import { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BottomNav, TabId } from './BottomNav';

describe('BottomNav Component', () => {
  it('renders all 4 tabs in correct order with accessible button elements without throwing', () => {
    render(<BottomNav activeTab="pantry" />);

    const buttons = screen.getAllByRole('tab');
    expect(buttons).toHaveLength(4);

    const labels = buttons.map((btn) => btn.textContent);
    expect(labels).toEqual(['Pantry', 'Matches', 'Shopping', 'Profile']);

    // Each is a real <button> element with accessible label
    buttons.forEach((btn) => {
      expect(btn.tagName.toLowerCase()).toBe('button');
      expect(btn).toHaveAttribute('aria-label');
    });
  });

  it('renders the active tab with inverted style (ink background, card foreground)', () => {
    render(<BottomNav activeTab="matches" />);

    const matchesTab = screen.getByRole('tab', { name: 'Matches' });
    const pantryTab = screen.getByRole('tab', { name: 'Pantry' });

    expect(matchesTab).toHaveClass('rf-bottom-nav__tab--active');
    expect(matchesTab).toHaveAttribute('aria-selected', 'true');
    expect(matchesTab).toHaveAttribute('aria-current', 'page');
    expect(matchesTab.style.backgroundColor).toBe('var(--color-ink)');
    expect(matchesTab.style.color).toBe('var(--color-card)');

    // Inactive tab
    expect(pantryTab).not.toHaveClass('rf-bottom-nav__tab--active');
    expect(pantryTab).toHaveAttribute('aria-selected', 'false');
    expect(pantryTab.style.backgroundColor).toBe('var(--color-card)');
    expect(pantryTab.style.color).toBe('var(--color-ink)');
  });

  it('calls onTabChange when tabs are clicked and updates active tab state', () => {
    const handleTabChange = vi.fn();

    const InteractiveNav = () => {
      const [current, setCurrent] = useState<TabId>('pantry');
      return (
        <BottomNav
          activeTab={current}
          onTabChange={(tab) => {
            setCurrent(tab);
            handleTabChange(tab);
          }}
        />
      );
    };

    render(<InteractiveNav />);

    const shoppingTab = screen.getByRole('tab', { name: 'Shopping' });
    fireEvent.click(shoppingTab);

    expect(handleTabChange).toHaveBeenCalledWith('shopping');
    expect(shoppingTab).toHaveClass('rf-bottom-nav__tab--active');
    expect(shoppingTab.style.backgroundColor).toBe('var(--color-ink)');

    const profileTab = screen.getByRole('tab', { name: 'Profile' });
    fireEvent.click(profileTab);

    expect(handleTabChange).toHaveBeenCalledWith('profile');
    expect(profileTab).toHaveClass('rf-bottom-nav__tab--active');
  });

  it('handles unmatched route / no active tab by leaving all tabs inactive', () => {
    render(<BottomNav activeTab={null} />);

    const buttons = screen.getAllByRole('tab');
    buttons.forEach((btn) => {
      expect(btn).not.toHaveClass('rf-bottom-nav__tab--active');
      expect(btn).toHaveAttribute('aria-selected', 'false');
      expect(btn.style.backgroundColor).toBe('var(--color-card)');
      expect(btn.style.color).toBe('var(--color-ink)');
    });
  });
});
