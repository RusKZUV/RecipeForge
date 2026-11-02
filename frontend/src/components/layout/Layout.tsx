import React from 'react';
import { TabId } from './BottomNav';
import { TopNav } from './TopNav';
import { SidebarNav } from './SidebarNav';

export interface LayoutProps {
  children?: React.ReactNode;
  activeTab?: TabId | string | null;
  onTabChange?: (tab: TabId) => void;
  showNav?: boolean;
  showTopNav?: boolean;
  onLoginClick?: () => void;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  activeTab = 'pantry',
  onTabChange,
  showNav = true,
  showTopNav = false,
  onLoginClick,
}) => {
  return (
    <div
      className="rf-layout"
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--color-paper)',
        color: 'var(--color-ink)',
        overflowX: 'hidden',
        alignItems: 'center',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      {showNav && (
        <SidebarNav
          activeTab={activeTab}
          onTabChange={onTabChange}
          onLoginClick={onLoginClick}
        />
      )}

      <main
        className="rf-main-content"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          minWidth: 0,
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        {showTopNav && <TopNav onLoginClick={onLoginClick} />}

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
              paddingTop: '24px',
              fontSize: 'var(--font-size-legal)',
              color: 'var(--color-ink-soft)',
              textAlign: 'center',
            }}
          >
            Dates are user estimates. The app never says an item is safe to eat.
          </footer>
        </div>
      </main>
    </div>
  );
};

export default Layout;
