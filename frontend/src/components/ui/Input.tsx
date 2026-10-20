import React, { useId } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      id: customId,
      className = '',
      style,
      placeholder,
      'aria-describedby': customDescribedBy,
      ...rest
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = customId || `rf-input-${generatedId.replace(/:/g, '')}`;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    const describedByIds = [
      error ? errorId : null,
      helperText && !error ? helperId : null,
      customDescribedBy,
    ]
      .filter(Boolean)
      .join(' ') || undefined;

    return (
      <div className="rf-input-wrapper">
        <label htmlFor={inputId} className="rf-input-label">
          {label}
        </label>
        <input
          ref={ref}
          id={inputId}
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
          aria-describedby={describedByIds}
          className={`rf-input ${error ? 'rf-input--error' : ''} ${className}`.trim()}
          style={{
            minHeight: 'var(--touch-target-min)',
            borderRadius: 'var(--radius-card)',
            border: error ? '1.5px solid var(--color-paprika)' : 'var(--border-ink)',
            backgroundColor: 'var(--color-card)',
            color: 'var(--color-ink)',
            ...style,
          }}
          {...rest}
        />
        {error && (
          <span id={errorId} role="alert" className="rf-input-error">
            {error}
          </span>
        )}
        {!error && helperText && (
          <span id={helperId} className="rf-legal-note">
            {helperText}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
