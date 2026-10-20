import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/layout/Layout';
import { TabId } from './components/layout/BottomNav';
import { AuthScreen } from './components/auth/AuthScreen';
import { ProfileView } from './components/profile/ProfileView';
import { Card } from './components/ui/Card';
import { Button } from './components/ui/Button';
import { Badge } from './components/ui/Badge';
import { Input } from './components/ui/Input';
import { getApiService } from './services';

export const AppContent: React.FC = () => {
  const { user, token, isLoading, loginAsDemo } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>('pantry');
  const [status, setStatus] = useState<string>('Initializing RecipeForge services...');
  const [demoLoaded, setDemoLoaded] = useState<boolean>(false);
  const [inputValue, setInputValue] = useState<string>('');

  // Auto-login demo on initial load if no session exists and user hasn't explicitly logged out
  useEffect(() => {
    if (!token && !user && !isLoading) {
      const loggedOut = localStorage.getItem('recipeforge_logged_out');
      if (!loggedOut) {
        loginAsDemo().catch(() => {});
      }
    }
  }, [token, user, isLoading, loginAsDemo]);

  useEffect(() => {
    if (user && token) {
      const api = getApiService();
      api.pantry
        .listItems(token)
        .then((items) => {
          setStatus(
            `Connected to service. Logged in as ${user.email} with ${items.length} pantry items.`
          );
          setDemoLoaded(user.email === 'demo@recipeforge.local');
        })
        .catch((err) => {
          setStatus(`Error loading pantry: ${(err as Error).message}`);
        });
    }
  }, [user, token]);

  if (isLoading) {
    return (
      <Layout showNav={false}>
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <p style={{ fontFamily: 'var(--font-handwritten)', fontSize: 'var(--font-size-h3)' }}>
            Opening kitchen notebook...
          </p>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout showNav={false}>
        <AuthScreen />
      </Layout>
    );
  }

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab} showTopNav>
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

      {activeTab === 'profile' && <ProfileView />}

      {activeTab === 'pantry' && (
        <>
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
              <Button variant="outlined">Cancel</Button>
            </div>
          </Card>
        </>
      )}

      {activeTab === 'matches' && (
        <Card>
          <h2
            className="rf-heading"
            style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--font-size-h3)' }}
          >
            Matches
          </h2>
          <p style={{ color: 'var(--color-ink-soft)' }}>Recipe matches based on your pantry.</p>
        </Card>
      )}

      {activeTab === 'shopping' && (
        <Card>
          <h2
            className="rf-heading"
            style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--font-size-h3)' }}
          >
            Shopping List
          </h2>
          <p style={{ color: 'var(--color-ink-soft)' }}>Budget shopping list for missing ingredients.</p>
        </Card>
      )}
    </Layout>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
