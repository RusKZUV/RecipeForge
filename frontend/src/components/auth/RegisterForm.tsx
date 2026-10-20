import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

export interface RegisterFormProps {
  onSwitchToLogin?: () => void;
  onSuccess?: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  onSwitchToLogin,
  onSuccess,
}) => {
  const { register, formDrafts, setFormDraft } = useAuth();

  const [email, setEmail] = useState<string>(() => formDrafts.registerEmail || '');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
    form?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleEmailChange = (val: string) => {
    setEmail(val);
    setFormDraft('registerEmail', val);
    if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
  };

  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Password confirmation is required';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      // Normalize email: trim and lowercase
      const normalizedEmail = email.trim().toLowerCase();
      await register({
        email: normalizedEmail,
        password,
      });
      onSuccess?.();
    } catch (err: any) {
      setErrors({ form: err.message || 'Registration failed' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="rf-register-card">
      <form onSubmit={handleSubmit} noValidate>
        <h2
          className="rf-heading"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--font-size-h2)',
            marginBottom: '6px',
          }}
        >
          Create account
        </h2>
        <p
          style={{
            fontSize: 'var(--font-size-base)',
            color: 'var(--color-ink-soft)',
            marginBottom: '16px',
          }}
        >
          Start cooking with what is in your pantry
        </p>

        {errors.form && (
          <div
            role="alert"
            data-testid="register-error-message"
            style={{
              padding: '10px 14px',
              backgroundColor: 'var(--color-expired-bg)',
              color: 'var(--color-paprika)',
              borderRadius: 'var(--radius-card)',
              border: '1.5px solid var(--color-paprika)',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 600,
              marginBottom: '14px',
            }}
          >
            {errors.form}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Input
            label="Email"
            type="email"
            placeholder="you@university.edu"
            value={email}
            onChange={(e) => handleEmailChange(e.target.value)}
            error={errors.email}
            required
            autoComplete="email"
          />

          <Input
            label="Password"
            type="password"
            placeholder="At least 6 characters"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
            }}
            error={errors.password}
            required
            autoComplete="new-password"
            helperText="Minimum 6 characters"
          />

          <Input
            label="Confirm Password"
            type="password"
            placeholder="Repeat your password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (errors.confirmPassword) {
                setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
              }
            }}
            error={errors.confirmPassword}
            required
            autoComplete="new-password"
          />

          <Button
            type="submit"
            variant="default"
            fullWidth
            disabled={isSubmitting}
            style={{ marginTop: '8px' }}
          >
            {isSubmitting ? 'Creating account...' : 'Create account'}
          </Button>
        </div>

        {onSwitchToLogin && (
          <div
            style={{
              marginTop: '16px',
              textAlign: 'center',
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-ink-soft)',
            }}
          >
            Already have an account?{' '}
            <button
              type="button"
              onClick={onSwitchToLogin}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-ink)',
                fontWeight: 600,
                textDecoration: 'underline',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: 'inherit',
                padding: 0,
              }}
            >
              Log in here
            </button>
          </div>
        )}
      </form>
    </Card>
  );
};

export default RegisterForm;
