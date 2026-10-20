import React, { useState, useEffect } from 'react';
import { getApiService } from './services';
import { Layout } from './components/layout/Layout';
import { TabId } from './components/layout/BottomNav';
import { Card } from './components/ui/Card';
import { Button } from './components/ui/Button';
import { Badge } from './components/ui/Badge';
import { Input } from './components/ui/Input';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('pantry');
  const [status, setStatus] = useState<string>('Initializing RecipeForge services...');
  const [demoLoaded, setDemoLoaded] = useState<boolean>(false);
  const [inputValue, setInputValue] = useState<string>('');

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
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      <header style={{ marginBottom: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
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
          <span
            className="rf-accent"
            style={{
              fontFamily: 'var(--font-handwritten)',
              fontSize: 'var(--font-size-h3)',
            }}
          >
            Kitchen notebook
          </span>
        </div>
        <p style={{ color: 'var(--color-ink-soft)', fontSize: 'var(--font-size-base)' }}>
          Budget dorm cooking from ingredients you already have
        </p>
      </header>

      <Card>
        <h2
          className="rf-heading"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--font-size-h3)',
            marginBottom: '8px',
          }}
        >
          Scaffolding &amp; Services
        </h2>
        <p
          data-testid="status-message"
          style={{
            fontSize: 'var(--font-size-base)',
            marginBottom: '14px',
            color: 'var(--color-ink-soft)',
          }}
        >
          {status}
        </p>
        {demoLoaded && (
          <div style={{ marginBottom: '14px' }}>
            <Badge status="fresh" data-testid="demo-badge">
              Demo account ready
            </Badge>
          </div>
        )}
      </Card>

      <Card>
        <Input
          label="Quick item search"
          placeholder="milk, tomatoes, рис..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          helperText="Type ingredients to check availability"
        />
        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
          <Button variant="default" fullWidth>
            Add item
          </Button>
          <Button variant="outlined">
            Cancel
          </Button>
        </div>
      </Card>
    </Layout>
  );
};

export default App;
