import React from 'react';

export type ExpiryStatus =
  | 'fresh'
  | 'expiring_soon'
  | 'expiring-soon'
  | 'expires_today'
  | 'expires-today'
  | 'expired';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status?: ExpiryStatus | 'default';
  children: React.ReactNode;
}

interface ColorPair {
  fg: string;
  bg: string;
  className: string;
}

const STATUS_CONFIG: Record<string, ColorPair> = {
  fresh: {
    fg: 'var(--color-olive-fg)',
    bg: 'var(--color-olive-bg)',
    className: 'rf-badge--fresh',
  },
  expiring_soon: {
    fg: 'var(--color-ink)',
    bg: 'var(--color-turmeric)',
    className: 'rf-badge--expiring-soon',
  },
  'expiring-soon': {
    fg: 'var(--color-ink)',
    bg: 'var(--color-turmeric)',
    className: 'rf-badge--expiring-soon',
  },
  expires_today: {
    fg: 'var(--color-card)',
    bg: 'var(--color-paprika)',
    className: 'rf-badge--expires-today',
  },
  'expires-today': {
    fg: 'var(--color-card)',
    bg: 'var(--color-paprika)',
    className: 'rf-badge--expires-today',
  },
  expired: {
    fg: 'var(--color-expired-fg)',
    bg: 'var(--color-expired-bg)',
    className: 'rf-badge--expired',
  },
  default: {
    fg: 'var(--color-ink)',
    bg: 'var(--color-card)',
    className: 'rf-badge--default',
  },
};

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ status = 'default', children, className = '', style, ...rest }, ref) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.default;

    return (
      <span
        ref={ref}
        className={`rf-badge ${config.className} ${className}`.trim()}
        style={{
          color: config.fg,
          backgroundColor: config.bg,
          borderRadius: 'var(--radius-pill)',
          border: 'var(--border-ink)',
          minHeight: 'var(--touch-target-min)',
          ...style,
        }}
        {...rest}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export default Badge;
