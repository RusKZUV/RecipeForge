import React, { useState, useEffect } from 'react';
import { getApiService } from './services';

export const App: React.FC = () => {
  const [status, setStatus] = useState<string>('Initializing RecipeForge services...');
  const [demoLoaded, setDemoLoaded] = useState<boolean>(false);

  useEffect(() => {
    const api = getApiService();
    api.auth
      .loginAsDemo()
      .then(async (authRes) => {
        const pantry = await api.pantry.listItems(authRes.token.access_token);
        setStatus(`Connected to service. Logged in as ${authRes.user.email} with ${pantry.length} pantry items.`);
        setDemoLoaded(true);
      })
      .catch((err) => {
        setStatus(`Error initializing services: ${(err as Error).message}`);
      });
  }, []);

  return (
    <div
      style={{
        padding: '24px',
        maxWidth: '480px',
        margin: '0 auto',
      }}
    >
      <header style={{ marginBottom: '20px' }}>
        <h1
          style={{
            fontFamily: 'serif',
            fontSize: '28px',
            color: '#2B2118',
            marginBottom: '4px',
          }}
        >
          RecipeForge
        </h1>
        <p style={{ color: '#5A4A3A', fontSize: '14px' }}>
          Kitchen notebook for budget dorm cooking
        </p>
      </header>

      <main
        style={{
          background: '#FFFBF2',
          border: '1.5px solid #2B2118',
          borderRadius: '14px',
          boxShadow: '3px 3px 0 #2B2118',
          padding: '18px',
        }}
      >
        <h2 style={{ fontSize: '18px', marginBottom: '8px' }}>Scaffolding &amp; Services</h2>
        <p style={{ fontSize: '14px', marginBottom: '14px', color: '#5A4A3A' }} data-testid="status-message">
          {status}
        </p>
        {demoLoaded && (
          <div
            data-testid="demo-badge"
            style={{
              display: 'inline-block',
              background: '#E3E8D3',
              color: '#3E4A24',
              padding: '4px 10px',
              borderRadius: '99px',
              border: '1.5px solid #2B2118',
              fontSize: '12px',
              fontWeight: 600,
            }}
          >
            Demo account ready
          </div>
        )}
      </main>

      <footer style={{ marginTop: '24px', fontSize: '11px', color: '#5A4A3A' }}>
        Persistent note: dates are user estimates; the app never claims an item is safe.
      </footer>
    </div>
  );
};

export default App;
