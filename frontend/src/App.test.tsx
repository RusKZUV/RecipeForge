import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import App, { resolveIngredient } from './App';
import { getApiService, resetApiService } from './services';

describe('App & Quick Item Search Integration (#32)', () => {
  beforeEach(() => {
    resetApiService();
    localStorage.clear();
  });

  it('mounts and renders RecipeForge kitchen notebook header without error', async () => {
    render(<App />);

    expect(screen.getByRole('heading', { level: 1, name: /recipeforge/i })).toBeInTheDocument();
    expect(screen.getByText(/kitchen notebook/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('demo-badge')).toBeInTheDocument();
      expect(screen.getByText(/demo account ready/i)).toBeInTheDocument();
    });
  });

  it('successful addition triggers pantry.addItem, increments item count, and clears input', async () => {
    const api = getApiService();
    const addItemSpy = vi.spyOn(api.pantry, 'addItem');

    render(<App />);

    // Wait for demo user & initial pantry to load
    await waitFor(() => {
      expect(screen.getByTestId('status-message')).toHaveTextContent(
        /Connected to service\. Logged in as demo@recipeforge\.local with 8 pantry items\./i
      );
    });

    const input = screen.getByLabelText(/quick item search/i);
    const addButton = screen.getByRole('button', { name: /^add item$/i });

    // Type a catalog ingredient: milk
    fireEvent.change(input, { target: { value: 'milk' } });
    expect(input).toHaveValue('milk');

    // Click Add item
    fireEvent.click(addButton);

    // Verify pantry.addItem was dispatched with auth token and resolved ingredient
    await waitFor(() => {
      expect(addItemSpy).toHaveBeenCalledTimes(1);
    });

    expect(addItemSpy).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        ingredient_id: 'ing-milk',
        custom_name: null,
        quantity: 1,
        unit: 'l',
      })
    );

    // Status updates immediately without full page refresh to 9 items
    await waitFor(() => {
      expect(screen.getByTestId('status-message')).toHaveTextContent(
        /Connected to service\. Logged in as demo@recipeforge\.local with 9 pantry items\./i
      );
    });

    // Input field is cleared on success
    expect(input).toHaveValue('');
  });

  it('submitting empty or whitespace text does not invoke pantry.addItem and shows validation feedback', async () => {
    const api = getApiService();
    const addItemSpy = vi.spyOn(api.pantry, 'addItem');

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('demo-badge')).toBeInTheDocument();
    });

    const input = screen.getByLabelText(/quick item search/i);
    const addButton = screen.getByRole('button', { name: /^add item$/i });

    // 1. Submit completely empty
    fireEvent.click(addButton);

    expect(addItemSpy).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent(/please enter an ingredient name/i);

    // 2. Submit whitespace-only
    fireEvent.change(input, { target: { value: '     ' } });
    fireEvent.click(addButton);

    expect(addItemSpy).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent(/please enter an ingredient name/i);
  });

  it('displays a visible error message, preserves input text, and re-enables button if pantry.addItem fails', async () => {
    const api = getApiService();
    vi.spyOn(api.pantry, 'addItem').mockRejectedValueOnce(
      new Error('Network error: pantry service unreachable')
    );

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('demo-badge')).toBeInTheDocument();
    });

    const input = screen.getByLabelText(/quick item search/i);
    const addButton = screen.getByRole('button', { name: /^add item$/i });

    fireEvent.change(input, { target: { value: 'dragonfruit' } });
    fireEvent.click(addButton);

    // Error is visibly displayed
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        /network error: pantry service unreachable/i
      );
    });

    // Input text is preserved for retry
    expect(input).toHaveValue('dragonfruit');

    // Add item button is re-enabled
    expect(addButton).not.toBeDisabled();
    expect(addButton).toHaveTextContent(/^add item$/i);
  });

  it('disables Add item button and indicates loading while request is in flight', async () => {
    const api = getApiService();
    let resolveAddItem!: (val: any) => void;
    const pendingPromise = new Promise((resolve) => {
      resolveAddItem = resolve;
    });
    vi.spyOn(api.pantry, 'addItem').mockReturnValueOnce(pendingPromise as any);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('demo-badge')).toBeInTheDocument();
    });

    const input = screen.getByLabelText(/quick item search/i);
    const addButton = screen.getByRole('button', { name: /^add item$/i });

    fireEvent.change(input, { target: { value: 'rice' } });
    fireEvent.click(addButton);

    // Button should be disabled and show loading text
    expect(addButton).toBeDisabled();
    expect(addButton).toHaveTextContent(/adding item\.\.\./i);

    // Resolve the promise
    resolveAddItem({
      id: 'pantry-item-rice',
      user_id: 'user-demo-1',
      ingredient_id: 'ing-rice',
      custom_name: null,
      quantity: 1,
      unit: 'kg',
      expires_on: null,
    });

    // Button should re-enable
    await waitFor(() => {
      expect(addButton).not.toBeDisabled();
      expect(addButton).toHaveTextContent(/^add item$/i);
    });
  });

  it('clicking Cancel clears input text and resets validation error without calling pantry.addItem', async () => {
    const api = getApiService();
    const addItemSpy = vi.spyOn(api.pantry, 'addItem');

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('demo-badge')).toBeInTheDocument();
    });

    const input = screen.getByLabelText(/quick item search/i);
    const addButton = screen.getByRole('button', { name: /^add item$/i });
    const cancelButton = screen.getByRole('button', { name: /^cancel$/i });

    // Trigger validation error first
    fireEvent.click(addButton);
    expect(screen.getByRole('alert')).toHaveTextContent(/please enter an ingredient name/i);

    // Type something
    fireEvent.change(input, { target: { value: 'tomatoes' } });
    expect(input).toHaveValue('tomatoes');

    // Click Cancel
    fireEvent.click(cancelButton);

    expect(addItemSpy).not.toHaveBeenCalled();
    expect(input).toHaveValue('');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('resolves catalog ingredients and aliases correctly', () => {
    // Canonical name
    expect(resolveIngredient('milk')).toEqual({
      ingredient_id: 'ing-milk',
      custom_name: null,
      quantity: 1,
      unit: 'l',
    });

    // Russian alias
    expect(resolveIngredient('рис')).toEqual({
      ingredient_id: 'ing-rice',
      custom_name: null,
      quantity: 1,
      unit: 'kg',
    });

    // Plural match
    expect(resolveIngredient('tomatoes')).toEqual({
      ingredient_id: 'ing-tomato',
      custom_name: null,
      quantity: 1,
      unit: 'kg',
    });

    // Custom non-catalog ingredient
    expect(resolveIngredient('dragonfruit')).toEqual({
      ingredient_id: null,
      custom_name: 'dragonfruit',
      quantity: 1,
      unit: 'pcs',
    });
  });

  it('submitting form via enter key dispatches pantry.addItem and adds custom item to inventory list', async () => {
    const api = getApiService();
    const addItemSpy = vi.spyOn(api.pantry, 'addItem');

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('demo-badge')).toBeInTheDocument();
    });

    const input = screen.getByLabelText(/quick item search/i);
    fireEvent.change(input, { target: { value: 'starfruit' } });

    // Submit via form
    const form = input.closest('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(addItemSpy).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          ingredient_id: null,
          custom_name: 'starfruit',
          quantity: 1,
          unit: 'pcs',
        })
      );
    });

    // Input cleared
    expect(input).toHaveValue('');

    // Item rendered in pantry inventory list
    await waitFor(() => {
      expect(screen.getByText('starfruit')).toBeInTheDocument();
    });
  });

  it('typing in input clears active validation error', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('demo-badge')).toBeInTheDocument();
    });

    const input = screen.getByLabelText(/quick item search/i);
    const addButton = screen.getByRole('button', { name: /^add item$/i });

    // Trigger validation error
    fireEvent.click(addButton);
    expect(screen.getByRole('alert')).toHaveTextContent(/please enter an ingredient name/i);

    // Type character into input
    fireEvent.change(input, { target: { value: 'a' } });

    // Error should immediately disappear
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

