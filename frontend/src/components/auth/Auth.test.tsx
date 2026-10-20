import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { AuthProvider, useAuth } from '../../context/AuthContext';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { AuthScreen } from './AuthScreen';
import { resetApiService } from '../../services';

describe('Authentication UI & Flows', () => {
  beforeEach(() => {
    localStorage.clear();
    resetApiService();
  });

  describe('LoginForm', () => {
    it('validates required fields and shows generic error on bad credentials', async () => {
      render(
        <AuthProvider>
          <LoginForm />
        </AuthProvider>
      );

      const loginBtn = screen.getByRole('button', { name: /log in/i });

      // Submit empty
      fireEvent.click(loginBtn);
      expect(await screen.findByRole('alert')).toHaveTextContent(/invalid email or password/i);

      // Fill wrong credentials
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);

      fireEvent.change(emailInput, { target: { value: 'notfound@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'wrongpass' } });
      fireEvent.click(loginBtn);

      // Displays generic error message without disclosing whether email or password was wrong
      const errorMsg = await screen.findByRole('alert');
      expect(errorMsg).toHaveTextContent('Invalid email or password');
      expect(errorMsg.textContent).not.toContain('User not found');
      expect(errorMsg.textContent).not.toContain('Incorrect password');
    });

    it('logs in immediately with demo data when clicking demo button', async () => {
      let loggedInUser: any = null;

      const TestConsumer = () => {
        const { user } = useAuth();
        loggedInUser = user;
        return <div>User: {user ? user.email : 'none'}</div>;
      };

      render(
        <AuthProvider>
          <LoginForm />
          <TestConsumer />
        </AuthProvider>
      );

      const demoBtn = screen.getByTestId('demo-login-button');
      fireEvent.click(demoBtn);

      await waitFor(() => {
        expect(loggedInUser).not.toBeNull();
        expect(loggedInUser.email).toBe('demo@recipeforge.local');
        expect(screen.getByText('User: demo@recipeforge.local')).toBeInTheDocument();
      });
    });
  });

  describe('RegisterForm', () => {
    it('validates non-empty email, password length >= 6, and password confirmation', async () => {
      render(
        <AuthProvider>
          <RegisterForm />
        </AuthProvider>
      );

      const submitBtn = screen.getByRole('button', { name: /create account/i });

      // Empty submission
      fireEvent.click(submitBtn);
      expect(await screen.findByText(/email is required/i)).toBeInTheDocument();

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmInput = screen.getByLabelText(/confirm password/i);

      // Short password (< 6 chars)
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: '123' } });
      fireEvent.change(confirmInput, { target: { value: '123' } });
      fireEvent.click(submitBtn);

      expect(await screen.findByText(/password must be at least 6 characters/i)).toBeInTheDocument();

      // Password mismatch
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(confirmInput, { target: { value: 'password456' } });
      fireEvent.click(submitBtn);

      expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
    });

    it('normalizes email (whitespace and lowercase) and creates user session with bearer token', async () => {
      let authUser: any = null;
      let authToken: string | null = null;

      const TestConsumer = () => {
        const { user, token } = useAuth();
        authUser = user;
        authToken = token;
        return <div>Active: {user ? user.email : 'guest'}</div>;
      };

      render(
        <AuthProvider>
          <RegisterForm />
          <TestConsumer />
        </AuthProvider>
      );

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmInput = screen.getByLabelText(/confirm password/i);
      const submitBtn = screen.getByRole('button', { name: /create account/i });

      // Mixed case with spaces
      fireEvent.change(emailInput, { target: { value: '  NewStudent@Campus.EDU  ' } });
      fireEvent.change(passwordInput, { target: { value: 'secret123' } });
      fireEvent.change(confirmInput, { target: { value: 'secret123' } });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(authUser).not.toBeNull();
        expect(authUser.email).toBe('newstudent@campus.edu');
        expect(authToken).toBeTruthy();
        expect(screen.getByText('Active: newstudent@campus.edu')).toBeInTheDocument();
      });
    });
  });

  describe('AuthScreen and 401 / Logout handling', () => {
    it('switches between login and register views', async () => {
      render(
        <AuthProvider>
          <AuthScreen />
        </AuthProvider>
      );

      expect(screen.getByRole('heading', { level: 2, name: /sign in/i })).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /register here/i }));
      expect(screen.getByRole('heading', { level: 2, name: /create account/i })).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /log in here/i }));
      expect(screen.getByRole('heading', { level: 2, name: /sign in/i })).toBeInTheDocument();
    });

    it('handles simulated 401 by redirecting to login while preserving in-progress form drafts', async () => {
      const Test401Component = () => {
        const { user, loginAsDemo, onUnauthorized, formDrafts, setFormDraft } = useAuth();

        return (
          <div>
            <div data-testid="auth-status">{user ? user.email : 'logged-out'}</div>
            <button onClick={() => loginAsDemo()} data-testid="btn-login-demo">
              Demo
            </button>
            <input
              data-testid="draft-input"
              value={formDrafts.testField || ''}
              onChange={(e) => setFormDraft('testField', e.target.value)}
            />
            <button onClick={() => onUnauthorized()} data-testid="simulate-401">
              Simulate 401
            </button>
          </div>
        );
      };

      render(
        <AuthProvider>
          <Test401Component />
        </AuthProvider>
      );

      // Log in
      fireEvent.click(screen.getByTestId('btn-login-demo'));
      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('demo@recipeforge.local');
      });

      // Type into in-progress input
      fireEvent.change(screen.getByTestId('draft-input'), {
        target: { value: 'Work in progress draft text' },
      });

      // Emit 401
      fireEvent.click(screen.getByTestId('simulate-401'));

      // User is logged out / redirected to login state
      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('logged-out');
      });

      // In-progress form draft is preserved!
      expect(screen.getByTestId('draft-input')).toHaveValue('Work in progress draft text');
    });
  });
});
