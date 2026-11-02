import { test, expect } from '@playwright/test';

test.describe('Authentication Screen on Startup', () => {
  test('displays login screen with demo credentials hint when unauthenticated', async ({ page }) => {
    // Navigate to local Vite dev server without existing session
    await page.goto('/');

    // Check that login screen is displayed instead of the main dashboard
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /log in/i })).toBeVisible();

    // Verify demo credentials hint
    await expect(page.getByTestId('demo-credentials-hint')).toBeVisible();
    await expect(page.getByTestId('demo-credentials-hint')).toContainText('demo@recipeforge.local');
    await expect(page.getByTestId('demo-credentials-hint')).toContainText("'demo'");

    // Dashboard elements should not be visible
    await expect(page.locator('aside.rf-sidebar')).not.toBeVisible();
    await expect(page.getByTestId('status-message')).not.toBeVisible();
  });

  test('manually fills in login form with demo credentials and logs in', async ({ page }) => {
    await page.goto('/');

    // Fill in login credentials manually
    await page.getByLabel(/email/i).fill('demo@recipeforge.local');
    await page.getByLabel(/password/i).fill('demo');
    await page.getByRole('button', { name: /log in/i }).click();

    // Verify dashboard and sidebar appear
    await expect(page.getByTestId('status-message')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('aside.rf-sidebar')).toBeVisible();
    await expect(page.locator('.rf-sidebar__user-email')).toHaveText('demo@recipeforge.local');
  });
});

test.describe('Desktop Multi-Column Web Application Layout', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to local Vite dev server
    await page.goto('/');

    // When unauthenticated, manually fill in login credentials and submit
    const emailInput = page.getByLabel(/email/i);
    const passwordInput = page.getByLabel(/password/i);
    const loginButton = page.getByRole('button', { name: /log in/i });

    if (await emailInput.isVisible()) {
      await emailInput.fill('demo@recipeforge.local');
      await passwordInput.fill('demo');
      await loginButton.click();
    }

    // Wait for account initialization and status message to be visible
    await expect(page.getByTestId('status-message')).toBeVisible({ timeout: 10000 });
  });

  test('displays desktop multi-column layout with left sidebar and expanded container', async ({ page }) => {
    // Verify desktop sidebar exists and is visible
    const sidebar = page.locator('aside.rf-sidebar');
    await expect(sidebar).toBeVisible();

    // Verify sidebar branding
    await expect(sidebar.locator('.rf-sidebar__brand-name')).toHaveText('RecipeForge');
    await expect(sidebar.getByText('Kitchen notebook')).toBeVisible();

    // Verify sidebar navigation contains all 4 tabs
    await expect(page.getByTestId('sidebar-tab-pantry')).toBeVisible();
    await expect(page.getByTestId('sidebar-tab-matches')).toBeVisible();
    await expect(page.getByTestId('sidebar-tab-shopping')).toBeVisible();
    await expect(page.getByTestId('sidebar-tab-profile')).toBeVisible();

    // Verify main content area is expanded
    const mainContent = page.locator('.rf-main-content');
    await expect(mainContent).toBeVisible();
    const container = page.locator('.rf-layout__container');
    await expect(container).toBeVisible();
  });

  test('navigates through views using the sidebar navigation', async ({ page }) => {
    // Click Matches tab in the sidebar
    await page.getByTestId('sidebar-tab-matches').click();
    await expect(page.getByRole('heading', { name: /matches/i })).toBeVisible();
    await expect(page.locator('.rf-grid-recipes')).toBeVisible();

    // Click Shopping tab in the sidebar
    await page.getByTestId('sidebar-tab-shopping').click();
    await expect(page.getByRole('heading', { name: /shopping list/i })).toBeVisible();

    // Click Profile tab in the sidebar
    await page.getByTestId('sidebar-tab-profile').click();
    await expect(page.getByRole('heading', { name: /profile/i })).toBeVisible();

    // Click Pantry tab to return
    await page.getByTestId('sidebar-tab-pantry').click();
    await expect(page.getByTestId('status-message')).toBeVisible();
    await expect(page.locator('.rf-grid-pantry')).toBeVisible();
  });

  test('displays pantry items in a responsive grid and supports adding and deleting items', async ({ page }) => {
    // Top dashboard cards are present
    await expect(page.locator('.rf-grid-dashboard-top')).toBeVisible();

    // Pantry inventory is rendered in the responsive grid
    const pantryGrid = page.locator('.rf-grid-pantry');
    await expect(pantryGrid).toBeVisible();

    // Add a new ingredient via quick item search
    const input = page.getByPlaceholder(/milk, tomatoes, рис/i);
    await input.fill('carrots');
    await page.getByRole('button', { name: 'Add item' }).click();

    // Wait for the item to be listed in the pantry grid (normalized canonical name 'carrot')
    await expect(page.locator('.rf-grid-pantry')).toContainText('carrot');

    // Delete an item from the pantry
    const deleteBtn = page.locator('button[data-testid^="delete-pantry-item-"]').first();
    await deleteBtn.click();
  });

  test('displays recipes in a responsive grid and allows inspecting details and adding to shopping', async ({ page }) => {
    // Navigate to Matches via sidebar
    await page.getByTestId('sidebar-tab-matches').click();

    // Recipe grid is visible with recipe cards
    const recipeGrid = page.locator('.rf-grid-recipes');
    await expect(recipeGrid).toBeVisible();

    const firstRecipe = page.locator('div[data-testid^="recipe-card-"]').first();
    await expect(firstRecipe).toBeVisible();

    // Click the recipe card to open the modal
    await firstRecipe.click();
    await expect(page.getByTestId('recipe-details-modal')).toBeVisible();

    // Add missing ingredients to shopping list if present
    const addMissingBtn = page.getByRole('button', { name: /add missing to shopping/i });
    if (await addMissingBtn.isVisible()) {
      await addMissingBtn.click();
    }

    // Close the modal using close button
    await page.getByTestId('modal-close-button').click();
    await expect(page.getByTestId('recipe-details-modal')).not.toBeVisible();

    // Navigate to Shopping via sidebar
    await page.getByTestId('sidebar-tab-shopping').click();
    await expect(page.getByRole('heading', { name: /shopping list/i })).toBeVisible();
  });

  test('displays enhanced profile view with avatar, budget limit, and statistics dashboard', async ({ page }) => {
    // Navigate to Profile via sidebar
    await page.getByTestId('sidebar-tab-profile').click();
    await expect(page.getByRole('heading', { name: /kitchen profile/i })).toBeVisible();

    // Verify avatar elements (in top nav, sidebar, and profile preview)
    await expect(page.getByTestId('top-nav-avatar')).toBeVisible();
    await expect(page.getByTestId('sidebar-avatar')).toBeVisible();
    await expect(page.getByTestId('profile-avatar-preview')).toBeVisible();

    // Verify "My Stats" block
    await expect(page.getByTestId('stats-recipes-cooked')).toBeVisible();
    await expect(page.getByTestId('stats-items-used')).toBeVisible();
    await expect(page.getByTestId('stats-money-saved')).toBeVisible();

    // Verify Weekly Budget field
    const budgetInput = page.getByTestId('profile-max-budget-input');
    await expect(budgetInput).toBeVisible();

    // Select a predefined emoji avatar
    const pizzaOption = page.getByTestId('avatar-option-🍕');
    await expect(pizzaOption).toBeVisible();
    await pizzaOption.click();

    // Update budget limit
    await budgetInput.fill('25000');

    // Save profile changes
    await page.getByTestId('save-profile-button').click();
    await expect(page.getByTestId('save-success-banner')).toBeVisible();
  });
});
