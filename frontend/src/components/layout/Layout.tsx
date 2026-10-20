import React from 'react';
import { BottomNav, TabId } from './BottomNav';

export interface LayoutProps {
  children?: React.ReactNode;
  activeTab?: TabId | string | null;
  onTabChange?: (tab: TabId) => void;
  showNav?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  activeTab = 'pantry',
  onTabChange,
  showNav = true,
}) => {
  return (
    <div
      className="rf-layout"
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--color-paper)',
        color: 'var(--color-ink)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
        boxSizing: 'border-box',
        overflowX: 'hidden',
      }}
    >
      <div
        className="rf-layout__container"
        style={{
          width: '100%',
          maxWidth: 'var(--layout-max-width)',
          padding: '18px var(--space-page-x) 80px var(--space-page-x)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--gap-cards)',
          boxSizing: 'border-box',
          minWidth: 0,
        }}
      >
        {children}

        <footer
          className="rf-legal-note"
          style={{
            marginTop: 'auto',
            paddingTop: '16px',
            fontSize: 'var(--font-size-legal)',
            color: 'var(--color-ink-soft)',
            textAlign: 'center',
          }}
        >
          Dates are user estimates. The app never says an item is safe to eat.
        </footer>
      </div>

      {showNav && (
        <BottomNav activeTab={activeTab} onTabChange={onTabChange} />
      )}
    </div>
  );
};

export default Layout;
