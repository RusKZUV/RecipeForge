import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ children, className = '', style, ...rest }, ref) => {
    return (
      <div
        ref={ref}
        className={`rf-card ${className}`.trim()}
        style={{
          backgroundColor: 'var(--color-card)',
          border: 'var(--border-ink)',
          borderRadius: 'var(--radius-card)',
          boxShadow: 'var(--shadow-card)',
          ...style,
        }}
        {...rest}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export default Card;
