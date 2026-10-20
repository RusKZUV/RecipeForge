import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

export interface LoginFormProps {
  onSwitchToRegister?: () => void;
  onSuccess?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSwitchToRegister,
  onSuccess,
}) => {
  const { login, loginAsDemo, formDrafts, setFormDraft } = useAuth();

  const [email, setEmail] = useState<string>(() => formDrafts.loginEmail || '');
  const [password, setPassword] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleEmailChange = (val: string) => {
    setEmail(val);
    setFormDraft('loginEmail', val);
    if (errorMessage) setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setErrorMessage('Invalid email or password');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await login({ email: cleanEmail, password });
      onSuccess?.();
    } catch {
      // Always show generic error message upon invalid credentials
      setErrorMessage('Invalid email or password');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoLogin = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await loginAsDemo();
      onSuccess?.();
    } catch (err) {
      setErrorMessage((err as Error).message || 'Failed to log in as demo');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="rf-login-card">
      <form onSubmit={handleSubmit} noValidate>
        <h2
          className="rf-heading"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--font-size-h2)',
            marginBottom: '6px',
          }}
        >
          Sign in
        </h2>
        <p
          style={{
            fontSize: 'var(--font-size-base)',
            color: 'var(--color-ink-soft)',
            marginBottom: '16px',
          }}
        >
          Welcome to RecipeForge
        </p>

        {errorMessage && (
          <div
            role="alert"
            data-testid="login-error-message"
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
            {errorMessage}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Input
            label="Email"
            type="email"
            placeholder="you@university.edu"
            value={email}
            onChange={(e) => handleEmailChange(e.target.value)}
            required
            autoComplete="email"
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errorMessage) setErrorMessage(null);
            }}
            required
            autoComplete="current-password"
          />

          <Button
            type="submit"
            variant="default"
            fullWidth
            disabled={isSubmitting}
            style={{ marginTop: '8px' }}
          >
            {isSubmitting ? 'Signing in...' : 'Log in'}
          </Button>

          <Button
            type="button"
            variant="outlined"
            fullWidth
            onClick={handleDemoLogin}
            disabled={isSubmitting}
            data-testid="demo-login-button"
          >
            Try with demo data
          </Button>
        </div>

        {onSwitchToRegister && (
          <div
            style={{
              marginTop: '16px',
              textAlign: 'center',
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-ink-soft)',
            }}
          >
            Don&apos;t have an account?{' '}
            <button
              type="button"
              onClick={onSwitchToRegister}
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
              Register here
            </button>
          </div>
        )}
      </form>
    </Card>
  );
};

export default LoginForm;
