import React from 'react';
import { useAuth } from '../../context/AuthContext';

export interface TopNavProps {
  onLoginClick?: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({ onLoginClick }) => {
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
    <header
      className="rf-top-nav"
      style={{
        width: '100%',
        maxWidth: 'var(--layout-max-width)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px var(--space-page-x)',
        backgroundColor: 'var(--color-paper)',
        borderBottom: 'var(--border-ink)',
        boxSizing: 'border-box',
      }}
    >
      <div>
        <span
          className="rf-heading"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--font-size-h3)',
            fontWeight: 800,
            letterSpacing: '-0.5px',
          }}
        >
          RecipeForge
        </span>
        <span
          className="rf-accent"
          style={{
            fontFamily: 'var(--font-handwritten)',
            fontSize: 'var(--font-size-base)',
            marginLeft: '8px',
            color: 'var(--color-paprika)',
          }}
        >
          Kitchen notebook
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-ink-soft)',
                maxWidth: '140px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
              title={user.email}
            >
              {user.email}
            </span>
            <button
              type="button"
              onClick={() => logout()}
              aria-label="Log out"
              style={{
                background: 'none',
                border: '1px solid var(--color-ink)',
                borderRadius: 'var(--radius-pill)',
                padding: '4px 10px',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Log out
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onLoginClick}
            style={{
              backgroundColor: 'var(--color-ink)',
              color: 'var(--color-card)',
              border: 'none',
              borderRadius: 'var(--radius-pill)',
              padding: '6px 14px',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Sign in
          </button>
        )}
      </div>
    </header>
  );
};

export default TopNav;
