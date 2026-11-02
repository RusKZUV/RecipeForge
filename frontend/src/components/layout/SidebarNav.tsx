import React from 'react';
import { TabId, TABS } from './BottomNav';
import { useAuth } from '../../context/AuthContext';

export interface SidebarNavProps {
  activeTab?: TabId | string | null;
  onTabChange?: (tab: TabId) => void;
  onLoginClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

const TAB_ICONS: Record<TabId, string> = {
  pantry: '🥫',
  matches: '🍳',
  shopping: '🛒',
  profile: '👤',
};

export const SidebarNav: React.FC<SidebarNavProps> = ({
  activeTab,
  onTabChange,
  onLoginClick,
  className = '',
  style,
}) => {
  let user = null;
  let logout = async () => {};
  try {
    const auth = useAuth();
    user = auth.user;
    logout = auth.logout;
  } catch {
    // Outside AuthProvider
  }

  return (
    <aside
      className={`rf-sidebar ${className}`.trim()}
      style={style}
      aria-label="Desktop Sidebar"
    >
      {/* Brand Header */}
      <div className="rf-sidebar__brand">
        <div className="rf-sidebar__brand-name">RecipeForge</div>
        <span className="rf-sidebar__brand-tag">Kitchen notebook</span>
        <p className="rf-sidebar__tagline">
          Budget dorm cooking from ingredients you already have
        </p>
      </div>

      {/* Main Navigation Tabs */}
      <nav aria-label="Main Navigation" className="rf-sidebar__nav">
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
              data-testid={`sidebar-tab-${tab.id}`}
              onClick={() => onTabChange?.(tab.id)}
              className={`rf-sidebar__item ${
                isActive ? 'rf-sidebar__item--active' : ''
              }`.trim()}
            >
              <span className="rf-sidebar__icon" aria-hidden="true">
                {TAB_ICONS[tab.id]}
              </span>
              <span className="rf-sidebar__label">{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User Session Footer */}
      <div className="rf-sidebar__footer">
        {user ? (
          <div className="rf-sidebar__user-card">
            <div className="rf-sidebar__user-info">
              <span className="rf-sidebar__user-badge">Active Session</span>
              <span className="rf-sidebar__user-email" title={user.email}>
                {user.email}
              </span>
            </div>
            <button
              type="button"
              onClick={() => logout()}
              aria-label="Log out"
              className="rf-sidebar__logout-btn"
            >
              Log out
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onLoginClick}
            className="rf-button rf-button--default rf-button--full-width"
          >
            Sign in
          </button>
        )}
      </div>
    </aside>
  );
};

export default SidebarNav;
