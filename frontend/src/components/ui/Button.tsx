import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outlined';
  fullWidth?: boolean;
  children: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'default',
      fullWidth = false,
      disabled = false,
      children,
      className = '',
      style,
      onClick,
      type = 'button',
      ...rest
    },
    ref
  ) => {
    const variantClass = variant === 'outlined' ? 'rf-button--outlined' : 'rf-button--default';
    const fullWidthClass = fullWidth ? 'rf-button--full-width' : '';

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled}
        onClick={disabled ? undefined : onClick}
        className={`rf-button ${variantClass} ${fullWidthClass} ${className}`.trim()}
        style={{
          borderRadius: 'var(--radius-pill)',
          border: 'var(--border-ink)',
          minHeight: 'var(--touch-target-min)',
          backgroundColor: variant === 'outlined' ? 'var(--color-card)' : 'var(--color-ink)',
          color: variant === 'outlined' ? 'var(--color-ink)' : 'var(--color-card)',
          width: fullWidth ? '100%' : undefined,
          ...style,
        }}
        {...rest}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
