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
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
            <div
              data-testid="top-nav-avatar"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                border: '1.5px solid var(--color-ink)',
                backgroundColor: 'var(--color-paper-warm, #EAE0D0)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                fontSize: '18px',
                lineHeight: 1,
                flexShrink: 0,
              }}
              title="User Avatar"
            >
              {user.avatar_url && (user.avatar_url.startsWith('data:') || user.avatar_url.startsWith('http')) ? (
                <img
                  src={user.avatar_url}
                  alt="Avatar"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <span>{user.avatar_url || '🧑‍🍳'}</span>
              )}
            </div>
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
