import React from 'react';

export type TabId = 'pantry' | 'matches' | 'shopping' | 'profile';

export interface TabItem {
  id: TabId;
  label: string;
}

export const TABS: readonly TabItem[] = [
  { id: 'pantry', label: 'Pantry' },
  { id: 'matches', label: 'Matches' },
  { id: 'shopping', label: 'Shopping' },
  { id: 'profile', label: 'Profile' },
] as const;

export interface BottomNavProps {
  activeTab?: TabId | string | null;
  onTabChange?: (tab: TabId) => void;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * BottomNav behavior when no route is matched:
 * When activeTab is undefined, null, or does not match any of the four tabs
 * ('pantry', 'matches', 'shopping', 'profile'), NO tab is highlighted as active.
 * Each tab retains its legible default inactive styling against the card background.
 */
export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  className = '',
  style,
}) => {
  return (
    <nav
      aria-label="Main Navigation"
      className={`rf-bottom-nav ${className}`.trim()}
      style={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: 'var(--layout-max-width)',
        backgroundColor: 'var(--color-card)',
        borderTop: 'var(--border-ink)',
        display: 'flex',
        alignItems: 'stretch',
        boxSizing: 'border-box',
        zIndex: 100,
        overflowX: 'hidden',
        ...style,
      }}
    >
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-label={tab.label}
            aria-selected={isActive}
            aria-current={isActive ? 'page' : undefined}
            onClick={() => onTabChange?.(tab.id)}
            className={`rf-bottom-nav__tab ${
              isActive ? 'rf-bottom-nav__tab--active' : ''
            }`.trim()}
            style={{
              flex: 1,
              minWidth: 0,
              minHeight: '56px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: isActive ? 'var(--color-ink)' : 'var(--color-card)',
              color: isActive ? 'var(--color-card)' : 'var(--color-ink)',
              border: 'none',
              cursor: 'pointer',
              padding: '8px 4px',
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 600,
              boxSizing: 'border-box',
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
};

export default BottomNav;
