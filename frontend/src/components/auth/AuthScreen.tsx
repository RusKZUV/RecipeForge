import React, { useState } from 'react';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';

export interface AuthScreenProps {
  initialMode?: 'login' | 'register';
  onSuccess?: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  initialMode = 'login',
  onSuccess,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);

  return (
    <div className="rf-auth-screen" style={{ width: '100%', maxWidth: '420px', margin: '0 auto' }}>
      <header style={{ marginBottom: '16px', textAlign: 'center' }}>
        <h1
          className="rf-heading"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--font-size-h1)',
            marginBottom: '4px',
          }}
        >
          RecipeForge
        </h1>
        <p
          className="rf-accent"
          style={{
            fontFamily: 'var(--font-handwritten)',
            fontSize: 'var(--font-size-h3)',
            color: 'var(--color-paprika)',
          }}
        >
          Kitchen notebook
        </p>
      </header>

      {mode === 'login' ? (
        <LoginForm
          onSwitchToRegister={() => setMode('register')}
          onSuccess={onSuccess}
        />
      ) : (
        <RegisterForm
          onSwitchToLogin={() => setMode('login')}
          onSuccess={onSuccess}
        />
      )}
    </div>
  );
};

export default AuthScreen;
