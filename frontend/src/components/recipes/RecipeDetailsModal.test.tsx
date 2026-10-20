import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RecipeDetailsModal } from './RecipeDetailsModal';
import { getApiService, resetApiService } from '../../services';
import { Recipe } from '../../types';

const mockSeedRecipe: Recipe = {
  id: 'recipe-test-1',
  owner_id: null,
  title: 'Test Garlic Pasta',
  servings: 2,
  time_minutes: 20,
  equipment: ['stovetop', 'pot', 'knife'],
  is_seed: true,
  source: 'RecipeForge Test Kitchen',
  license_note: 'CC-BY-SA 4.0',
  ingredients: [
    {
      ingredient_id: 'ing-pasta',
      custom_name: null,
      quantity: 200,
      unit: 'g',
      optional: false,
    },
    {
      ingredient_id: 'ing-garlic',
      custom_name: null,
      quantity: 3,
      unit: 'pcs',
      optional: false,
    },
    {
      ingredient_id: 'ing-parmesan',
      custom_name: 'parmesan cheese',
      quantity: 30,
      unit: 'g',
      optional: true,
    },
  ],
  steps: [
    {
      id: 'step-1',
      position: 1,
      text: 'Boil water in a pot with salt.',
      timer_seconds: null,
    },
    {
      id: 'step-2',
      position: 2,
      text: 'Cook pasta until al dente.',
      timer_seconds: 480,
    },
    {
      id: 'step-3',
      position: 3,
      text: 'Mince garlic and saute in oil.',
      timer_seconds: 120,
    },
  ],
};

describe('RecipeDetailsModal Component (#33)', () => {
  beforeEach(() => {
    resetApiService();
  });

  it('displays loading indicator while fetching recipe details', async () => {
    const api = getApiService();
    let resolveGetRecipe!: (val: Recipe) => void;
    const pendingPromise = new Promise<Recipe>((resolve) => {
      resolveGetRecipe = resolve;
    });
    vi.spyOn(api.recipes, 'getRecipe').mockReturnValueOnce(pendingPromise);

    render(
      <RecipeDetailsModal
        recipeId="recipe-test-1"
        token="test-token"
        onClose={vi.fn()}
      />
    );

    expect(screen.getByTestId('recipe-modal-loading')).toBeInTheDocument();
    expect(screen.getByText(/loading recipe details\.\.\./i)).toBeInTheDocument();

    resolveGetRecipe(mockSeedRecipe);

    await waitFor(() => {
      expect(screen.queryByTestId('recipe-modal-loading')).not.toBeInTheDocument();
    });
  });

  it('renders complete recipe details: title, time, servings, equipment, ingredients, steps with timers, and source notes', async () => {
    const api = getApiService();
    vi.spyOn(api.recipes, 'getRecipe').mockResolvedValueOnce(mockSeedRecipe);

    render(
      <RecipeDetailsModal
        recipeId="recipe-test-1"
        token="test-token"
        onClose={vi.fn()}
      />
    );

    // Title
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 2, name: 'Test Garlic Pasta' })).toBeInTheDocument();
    });

    // Cooking time & servings
    expect(screen.getByText(/20 mins/i)).toBeInTheDocument();
    expect(screen.getByText(/2 servings/i)).toBeInTheDocument();

    // Equipment list
    expect(screen.getByText('stovetop')).toBeInTheDocument();
    expect(screen.getByText('pot')).toBeInTheDocument();
    expect(screen.getByText('knife')).toBeInTheDocument();

    // Ingredients
    expect(screen.getByTestId('recipe-ingredient-ing-pasta')).toHaveTextContent(/pasta/i);
    expect(screen.getByText(/200 g/i)).toBeInTheDocument();
    expect(screen.getByTestId('recipe-ingredient-ing-garlic')).toHaveTextContent(/garlic/i);
    expect(screen.getByText(/3 pcs/i)).toBeInTheDocument();
    expect(screen.getByText(/parmesan cheese/i)).toBeInTheDocument();
    expect(screen.getByText(/\(optional\)/i)).toBeInTheDocument();

    // Steps & Timers
    expect(screen.getByText(/step 1/i)).toBeInTheDocument();
    expect(screen.getByText('Boil water in a pot with salt.')).toBeInTheDocument();

    expect(screen.getByText(/step 2/i)).toBeInTheDocument();
    expect(screen.getByText('Cook pasta until al dente.')).toBeInTheDocument();
    expect(screen.getByTestId('step-timer-2')).toHaveTextContent(/480s/i);

    expect(screen.getByText(/step 3/i)).toBeInTheDocument();
    expect(screen.getByText('Mince garlic and saute in oil.')).toBeInTheDocument();
    expect(screen.getByTestId('step-timer-3')).toHaveTextContent(/120s/i);

    // Source & License
    expect(screen.getByText(/recipeforge test kitchen/i)).toBeInTheDocument();
    expect(screen.getByText(/cc-by-sa 4\.0/i)).toBeInTheDocument();
  });

  it('displays error message with retry and dismiss options when API fails', async () => {
    const api = getApiService();
    const getRecipeSpy = vi.spyOn(api.recipes, 'getRecipe').mockRejectedValueOnce(
      new Error('Failed to reach recipe server')
    );
    const onCloseSpy = vi.fn();

    render(
      <RecipeDetailsModal
        recipeId="recipe-test-1"
        token="test-token"
        onClose={onCloseSpy}
      />
    );

    // Error message is displayed
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/failed to reach recipe server/i);
    });

    const retryBtn = screen.getByRole('button', { name: /^retry$/i });
    const dismissBtn = screen.getByRole('button', { name: /^dismiss$/i });
    expect(retryBtn).toBeInTheDocument();
    expect(dismissBtn).toBeInTheDocument();

    // Mock success on retry
    getRecipeSpy.mockResolvedValueOnce(mockSeedRecipe);
    fireEvent.click(retryBtn);

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 2, name: 'Test Garlic Pasta' })).toBeInTheDocument();
    });

    // Modal close button invokes onClose
    fireEvent.click(screen.getByTestId('modal-close-button'));
    expect(onCloseSpy).toHaveBeenCalledTimes(1);
  });

  it('clicking modal close button triggers onClose', async () => {
    const api = getApiService();
    vi.spyOn(api.recipes, 'getRecipe').mockResolvedValueOnce(mockSeedRecipe);
    const onCloseSpy = vi.fn();

    render(
      <RecipeDetailsModal
        recipeId="recipe-test-1"
        token="test-token"
        onClose={onCloseSpy}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 2, name: 'Test Garlic Pasta' })).toBeInTheDocument();
    });

    const closeBtn = screen.getByTestId('modal-close-button');
    fireEvent.click(closeBtn);
    expect(onCloseSpy).toHaveBeenCalledTimes(1);
  });

  it('clicking outside modal on backdrop overlay triggers onClose', async () => {
    const api = getApiService();
    vi.spyOn(api.recipes, 'getRecipe').mockResolvedValueOnce(mockSeedRecipe);
    const onCloseSpy = vi.fn();

    render(
      <RecipeDetailsModal
        recipeId="recipe-test-1"
        token="test-token"
        onClose={onCloseSpy}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 2, name: 'Test Garlic Pasta' })).toBeInTheDocument();
    });

    const backdrop = screen.getByTestId('recipe-modal-backdrop');
    fireEvent.click(backdrop);
    expect(onCloseSpy).toHaveBeenCalledTimes(1);

    // Clicking inside modal content does not trigger onClose
    const modalContent = screen.getByTestId('recipe-details-modal');
    fireEvent.click(modalContent);
    expect(onCloseSpy).toHaveBeenCalledTimes(1);
  });

  it('pressing Escape key triggers onClose', async () => {
    const api = getApiService();
    vi.spyOn(api.recipes, 'getRecipe').mockResolvedValueOnce(mockSeedRecipe);
    const onCloseSpy = vi.fn();

    render(
      <RecipeDetailsModal
        recipeId="recipe-test-1"
        token="test-token"
        onClose={onCloseSpy}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 2, name: 'Test Garlic Pasta' })).toBeInTheDocument();
    });

    fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });
    expect(onCloseSpy).toHaveBeenCalledTimes(1);
  });

  it('restores focus to previously active element upon unmounting', async () => {
    const api = getApiService();
    vi.spyOn(api.recipes, 'getRecipe').mockResolvedValueOnce(mockSeedRecipe);

    // Create a mock button to simulate previously focused element
    const testButton = document.createElement('button');
    testButton.textContent = 'Previous Button';
    document.body.appendChild(testButton);
    testButton.focus();
    expect(document.activeElement).toBe(testButton);

    const { unmount } = render(
      <RecipeDetailsModal
        recipeId="recipe-test-1"
        token="test-token"
        onClose={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 2, name: 'Test Garlic Pasta' })).toBeInTheDocument();
    });

    unmount();

    // Verify focus was restored to previous button
    expect(document.activeElement).toBe(testButton);
    document.body.removeChild(testButton);
  });

  it('calculates missing ingredients excluding staples (water, salt) and optional items, and posts to shopping.addItem', async () => {
    const api = getApiService();
    const recipeWithStaples: Recipe = {
      ...mockSeedRecipe,
      ingredients: [
        { ingredient_id: 'ing-pasta', custom_name: null, quantity: 200, unit: 'g', optional: false },
        { ingredient_id: 'ing-garlic', custom_name: null, quantity: 3, unit: 'pcs', optional: false },
        { ingredient_id: 'ing-parmesan', custom_name: 'parmesan', quantity: 30, unit: 'g', optional: true },
        { ingredient_id: 'ing-water', custom_name: null, quantity: 500, unit: 'ml', optional: false },
        { ingredient_id: 'ing-salt', custom_name: null, quantity: 5, unit: 'g', optional: false },
      ],
    };

    vi.spyOn(api.recipes, 'getRecipe').mockResolvedValueOnce(recipeWithStaples);
    const addItemSpy = vi.spyOn(api.shopping, 'addItem').mockResolvedValue({ id: 'shop-1' } as any);
    const onShoppingUpdatedSpy = vi.fn();

    // Pantry has 50g pasta
    const mockPantry = [
      {
        id: 'p-1',
        user_id: 'u-1',
        ingredient_id: 'ing-pasta',
        custom_name: null,
        quantity: 50,
        unit: 'g',
        expires_on: null,
        created_at: '',
        updated_at: '',
        expiry_status: 'fresh' as const,
      },
    ];

    render(
      <RecipeDetailsModal
        recipeId="recipe-test-1"
        token="test-token"
        pantryItems={mockPantry}
        onShoppingUpdated={onShoppingUpdatedSpy}
        onClose={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('add-missing-shopping-btn')).toBeInTheDocument();
    });

    const addBtn = screen.getByTestId('add-missing-shopping-btn');
    expect(addBtn).toHaveTextContent(/add missing to shopping/i);
    expect(addBtn).not.toBeDisabled();

    fireEvent.click(addBtn);

    await waitFor(() => {
      expect(screen.getByTestId('shopping-feedback')).toHaveTextContent(
        /added 2 missing items to shopping list/i
      );
    });

    // Verify exactly 2 calls were made: pasta (150g) and garlic (3 pcs)
    // Water and salt are staples (excluded), parmesan is optional (excluded)
    expect(addItemSpy).toHaveBeenCalledTimes(2);
    expect(addItemSpy).toHaveBeenCalledWith(
      'test-token',
      expect.objectContaining({
        ingredient_id: 'ing-pasta',
        quantity: 150,
        unit: 'g',
        source_recipes: ['recipe-test-1'],
      })
    );
    expect(addItemSpy).toHaveBeenCalledWith(
      'test-token',
      expect.objectContaining({
        ingredient_id: 'ing-garlic',
        quantity: 3,
        unit: 'pcs',
        source_recipes: ['recipe-test-1'],
      })
    );

    expect(onShoppingUpdatedSpy).toHaveBeenCalledTimes(1);
    expect(addBtn).toHaveTextContent(/added to shopping list/i);
    expect(addBtn).toBeDisabled();
  });

  it('indicates all items are in pantry when user has sufficient quantities', async () => {
    const api = getApiService();
    vi.spyOn(api.recipes, 'getRecipe').mockResolvedValueOnce(mockSeedRecipe);
    const addItemSpy = vi.spyOn(api.shopping, 'addItem');

    // Pantry has sufficient pasta and garlic
    const fullPantry = [
      {
        id: 'p-1',
        user_id: 'u-1',
        ingredient_id: 'ing-pasta',
        custom_name: null,
        quantity: 300,
        unit: 'g',
        expires_on: null,
        created_at: '',
        updated_at: '',
        expiry_status: 'fresh' as const,
      },
      {
        id: 'p-2',
        user_id: 'u-1',
        ingredient_id: 'ing-garlic',
        custom_name: null,
        quantity: 5,
        unit: 'pcs',
        expires_on: null,
        created_at: '',
        updated_at: '',
        expiry_status: 'fresh' as const,
      },
    ];

    render(
      <RecipeDetailsModal
        recipeId="recipe-test-1"
        token="test-token"
        pantryItems={fullPantry}
        onClose={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('add-missing-shopping-btn')).toBeInTheDocument();
    });

    const addBtn = screen.getByTestId('add-missing-shopping-btn');
    expect(addBtn).toHaveTextContent(/all items in pantry/i);
    expect(addBtn).toBeDisabled();
    expect(addItemSpy).not.toHaveBeenCalled();
  });

  it('displays accessible error message when adding missing items fails', async () => {
    const api = getApiService();
    vi.spyOn(api.recipes, 'getRecipe').mockResolvedValueOnce(mockSeedRecipe);
    vi.spyOn(api.shopping, 'addItem').mockRejectedValueOnce(
      new Error('Shopping service unavailable')
    );

    render(
      <RecipeDetailsModal
        recipeId="recipe-test-1"
        token="test-token"
        pantryItems={[]}
        onClose={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('add-missing-shopping-btn')).toBeInTheDocument();
    });

    const addBtn = screen.getByTestId('add-missing-shopping-btn');
    fireEvent.click(addBtn);

    await waitFor(() => {
      expect(screen.getByTestId('shopping-modal-error')).toHaveTextContent(
        /shopping service unavailable/i
      );
    });

    // Button is re-enabled for retry
    expect(addBtn).not.toBeDisabled();
    expect(addBtn).toHaveTextContent(/add missing to shopping/i);
  });
});
