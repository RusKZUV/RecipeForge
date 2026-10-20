import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import App from './App';
import { resetApiService } from './services';

describe('App Smoke Test', () => {
  beforeEach(() => {
    resetApiService();
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
});
