import { test, expect } from '@playwright/test';

test.describe('Desktop Multi-Column Web Application Layout', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to local Vite dev server
    await page.goto('/');
    // If on sign-in screen, click 'Try with demo data'
    const demoBtn = page.getByRole('button', { name: /try with demo data/i });
    if (await demoBtn.isVisible()) {
      await demoBtn.click();
    }
    // Wait for demo account to initialize and status message to be visible
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
});
