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
import { RecipeDetailsModal } from './components/recipes/RecipeDetailsModal';
import { getApiService, INITIAL_INGREDIENTS, INGREDIENT_ALIASES } from './services';
import { PantryItem, Recipe, ShoppingListItem, CreatePantryItemRequest } from './types';

export function resolveIngredient(rawInput: string): CreatePantryItemRequest {
  const trimmed = rawInput.trim();
  const lower = trimmed.toLowerCase();

  // 1. Direct canonical name or ID match
  const direct = INITIAL_INGREDIENTS.find(
    (ing) => ing.canonical_name.toLowerCase() === lower || ing.id.toLowerCase() === lower
  );
  if (direct) {
    return {
      ingredient_id: direct.id,
      custom_name: null,
      quantity: 1,
      unit: direct.base_unit || 'pcs',
    };
  }

  // 2. Direct alias match (Russian / English synonyms)
  const aliasMatch = INGREDIENT_ALIASES.find(
    (a) => a.alias.toLowerCase() === lower
  );
  if (aliasMatch) {
    const ing = INITIAL_INGREDIENTS.find((i) => i.id === aliasMatch.ingredient_id);
    if (ing) {
      return {
        ingredient_id: ing.id,
        custom_name: null,
        quantity: 1,
        unit: ing.base_unit || 'pcs',
      };
    }
  }

  // 3. Simple plural/singular match (e.g., tomatoes -> tomato, eggs -> egg)
  const pluralMatch = INITIAL_INGREDIENTS.find((ing) => {
    const c = ing.canonical_name.toLowerCase();
    return (
      `${c}s` === lower ||
      `${c}es` === lower ||
      (c.endsWith('s') && c.slice(0, -1) === lower)
    );
  });
  if (pluralMatch) {
    return {
      ingredient_id: pluralMatch.id,
      custom_name: null,
      quantity: 1,
      unit: pluralMatch.base_unit || 'pcs',
    };
  }

  // 4. Custom ingredient
  return {
    ingredient_id: null,
    custom_name: trimmed,
    quantity: 1,
    unit: 'pcs',
  };
}

export const AppContent: React.FC = () => {
  const { user, token, isLoading, loginAsDemo } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>('pantry');
  const [status, setStatus] = useState<string>('Initializing RecipeForge services...');
  const [demoLoaded, setDemoLoaded] = useState<boolean>(false);
  const [inputValue, setInputValue] = useState<string>('');
  const [inputError, setInputError] = useState<string>('');
  const [apiError, setApiError] = useState<string>('');
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [shoppingItems, setShoppingItems] = useState<ShoppingListItem[]>([]);
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);

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
          setPantryItems(items);
          setStatus(
            `Connected to service. Logged in as ${user.email} with ${items.length} pantry items.`
          );
          setDemoLoaded(user.email === 'demo@recipeforge.local');
        })
        .catch((err) => {
          setStatus(`Error loading pantry: ${(err as Error).message}`);
        });

      api.recipes
        .listRecipes(token)
        .then((res) => {
          setRecipes(res.items);
        })
        .catch(() => {});

      api.shopping
        .listItems(token)
        .then((items) => {
          setShoppingItems(items);
        })
        .catch(() => {});
    }
  }, [user, token]);

  const handleAddItem = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    const cleanInput = inputValue.trim();
    if (!cleanInput) {
      setInputError('Please enter an ingredient name');
      return;
    }
    if (!token || !user) {
      setApiError('Session expired. Please sign in again.');
      return;
    }

    setIsAdding(true);
    setInputError('');
    setApiError('');

    try {
      const api = getApiService();
      const itemToCreate = resolveIngredient(cleanInput);
      const addedItem = await api.pantry.addItem(token, itemToCreate);

      try {
        const items = await api.pantry.listItems(token);
        setPantryItems(items);
        setStatus(
          `Connected to service. Logged in as ${user.email} with ${items.length} pantry items.`
        );
      } catch {
        setPantryItems((prev) => [...prev, addedItem]);
        setStatus(
          `Connected to service. Logged in as ${user.email} with ${pantryItems.length + 1} pantry items.`
        );
      }

      setInputValue('');
    } catch (err) {
      setApiError((err as Error).message || 'Failed to add item to pantry');
    } finally {
      setIsAdding(false);
    }
  };

  const handleCancel = () => {
    setInputValue('');
    setInputError('');
    setApiError('');
  };

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
            <form onSubmit={handleAddItem}>
              <Input
                label="Quick item search"
                placeholder="milk, tomatoes, рис..."
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  if (inputError) setInputError('');
                  if (apiError) setApiError('');
                }}
                error={inputError || apiError}
                helperText="Type ingredients to check availability"
              />
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <Button
                  type="submit"
                  variant="default"
                  fullWidth
                  disabled={isAdding}
                  onClick={handleAddItem}
                >
                  {isAdding ? 'Adding item...' : 'Add item'}
                </Button>
                <Button
                  type="button"
                  variant="outlined"
                  disabled={isAdding}
                  onClick={handleCancel}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Card>

          {pantryItems.length > 0 && (
            <Card>
              <h3
                className="rf-heading"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'var(--font-size-h3)',
                  marginBottom: '12px',
                }}
              >
                Pantry inventory ({pantryItems.length})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {pantryItems.map((item) => (
                  <div
                    key={item.id}
                    data-testid={`pantry-item-${item.id}`}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-card)',
                      border: '1px solid var(--color-ink)',
                      backgroundColor: 'var(--color-paper)',
                    }}
                  >
                    <span style={{ fontWeight: 600 }}>
                      {item.custom_name ||
                        INITIAL_INGREDIENTS.find((i) => i.id === item.ingredient_id)?.canonical_name ||
                        item.ingredient_id}
                    </span>
                    <span style={{ color: 'var(--color-ink-soft)', fontSize: 'var(--font-size-sm)' }}>
                      {item.quantity} {item.unit}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}

      {activeTab === 'matches' && (
        <Card>
          <h2
            className="rf-heading"
            style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--font-size-h3)', marginBottom: '8px' }}
          >
            Matches ({recipes.length})
          </h2>
          <p style={{ color: 'var(--color-ink-soft)', marginBottom: '12px' }}>
            Recipe matches based on your pantry.
          </p>
          {recipes.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {recipes.map((r) => (
                <div
                  key={r.id}
                  role="button"
                  tabIndex={0}
                  aria-label={r.title}
                  data-testid={`recipe-card-${r.id}`}
                  onClick={() => setSelectedRecipeId(r.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
                      e.preventDefault();
                      setSelectedRecipeId(r.id);
                    }
                  }}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-card)',
                    border: '1px solid var(--color-ink)',
                    backgroundColor: 'var(--color-paper)',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: 'var(--font-size-base)' }}>{r.title}</div>
                  <div style={{ color: 'var(--color-ink-soft)', fontSize: 'var(--font-size-sm)' }}>
                    {r.time_minutes} mins · {r.servings} servings · {r.ingredients.length} ingredients
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontStyle: 'italic', color: 'var(--color-ink-soft)' }}>No recipes found.</p>
          )}
        </Card>
      )}

      {activeTab === 'shopping' && (
        <Card>
          <h2
            className="rf-heading"
            style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--font-size-h3)', marginBottom: '8px' }}
          >
            Shopping List ({shoppingItems.length})
          </h2>
          <p style={{ color: 'var(--color-ink-soft)', marginBottom: '12px' }}>
            Budget shopping list for missing ingredients.
          </p>
          {shoppingItems.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {shoppingItems.map((s) => (
                <div
                  key={s.id}
                  data-testid={`shopping-item-${s.id}`}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-card)',
                    border: '1px solid var(--color-ink)',
                    backgroundColor: 'var(--color-paper)',
                  }}
                >
                  <span>{s.custom_name || s.ingredient_id}</span>
                  <span style={{ color: 'var(--color-ink-soft)', fontSize: 'var(--font-size-sm)' }}>
                    {s.quantity} {s.unit}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontStyle: 'italic', color: 'var(--color-ink-soft)' }}>Your shopping list is empty.</p>
          )}
        </Card>
      )}

      {selectedRecipeId && token && (
        <RecipeDetailsModal
          recipeId={selectedRecipeId}
          token={token}
          onClose={() => setSelectedRecipeId(null)}
        />
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
