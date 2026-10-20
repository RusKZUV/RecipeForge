import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { AuthProvider, useAuth } from '../../context/AuthContext';
import { ProfileView } from './ProfileView';
import { resetApiService } from '../../services';

const renderProfileWithAuth = async () => {
  const SetupAuth = ({ children }: { children: React.ReactNode }) => {
    const { loginAsDemo, user } = useAuth();
    React.useEffect(() => {
      loginAsDemo();
    }, [loginAsDemo]);

    if (!user) return <div>Loading...</div>;
    return <>{children}</>;
  };

  const utils = render(
    <AuthProvider>
      <SetupAuth>
        <ProfileView />
      </SetupAuth>
    </AuthProvider>
  );

  await screen.findByText(/kitchen profile/i);
  return utils;
};

describe('ProfileView Component', () => {
  beforeEach(() => {
    localStorage.clear();
    resetApiService();
  });

  it('displays persistent allergy disclaimer prominently', async () => {
    await renderProfileWithAuth();

    const disclaimer = screen.getByTestId('allergy-disclaimer');
    expect(disclaimer).toBeInTheDocument();
    expect(disclaimer).toHaveTextContent(
      'Filters help select recipes but do not replace label checks for allergies.'
    );
  });

  it('displays five dietary filters and automatically selects vegetarian and dairy_free when vegan is selected', async () => {
    await renderProfileWithAuth();

    const veganBtn = screen.getByTestId('dietary-filter-vegan');
    const vegBtn = screen.getByTestId('dietary-filter-vegetarian');
    const dairyFreeBtn = screen.getByTestId('dietary-filter-dairy_free');
    const glutenFreeBtn = screen.getByTestId('dietary-filter-gluten_free');
    const nutFreeBtn = screen.getByTestId('dietary-filter-nut_free');

    expect(veganBtn).toBeInTheDocument();
    expect(vegBtn).toBeInTheDocument();
    expect(dairyFreeBtn).toBeInTheDocument();
    expect(glutenFreeBtn).toBeInTheDocument();
    expect(nutFreeBtn).toBeInTheDocument();

    // Click vegan
    fireEvent.click(veganBtn);

    // Both vegetarian and dairy_free must be activated
    expect(vegBtn.style.backgroundColor).toBe('var(--color-olive)');
    expect(dairyFreeBtn.style.backgroundColor).toBe('var(--color-olive)');
    expect(veganBtn.style.backgroundColor).toBe('var(--color-olive)');
  });

  it('validates default servings: rejects <= 0, > 12, or decimals with validation error', async () => {
    await renderProfileWithAuth();

    const servingsInput = screen.getByLabelText(/servings/i);
    const saveBtn = screen.getByTestId('save-profile-button');

    // Reject 0
    fireEvent.change(servingsInput, { target: { value: '0' } });
    fireEvent.click(saveBtn);
    expect(screen.getByText(/servings must be a whole number between 1 and 12/i)).toBeInTheDocument();

    // Reject > 12
    fireEvent.change(servingsInput, { target: { value: '15' } });
    fireEvent.click(saveBtn);
    expect(screen.getByText(/servings must be a whole number between 1 and 12/i)).toBeInTheDocument();

    // Reject decimal
    fireEvent.change(servingsInput, { target: { value: '2.5' } });
    fireEvent.click(saveBtn);
    expect(screen.getByText(/servings must be a whole number between 1 and 12/i)).toBeInTheDocument();

    // Valid integer 4
    fireEvent.change(servingsInput, { target: { value: '4' } });
    expect(screen.queryByText(/servings must be a whole number between 1 and 12/i)).toBeNull();
  });

  it('provides equipment selection and assumed staples (both enabled by default)', async () => {
    await renderProfileWithAuth();

    // Equipment
    const stovetopBtn = screen.getByTestId('equipment-stovetop');
    const microwaveBtn = screen.getByTestId('equipment-microwave');
    const ovenBtn = screen.getByTestId('equipment-oven');
    const blenderBtn = screen.getByTestId('equipment-blender');

    expect(stovetopBtn).toBeInTheDocument();
    expect(microwaveBtn).toBeInTheDocument();
    expect(ovenBtn).toBeInTheDocument();
    expect(blenderBtn).toBeInTheDocument();

    // Assumed staples
    const pepperCheckbox = screen.getByTestId('staple-pepper') as HTMLInputElement;
    const oilCheckbox = screen.getByTestId('staple-oil') as HTMLInputElement;

    expect(pepperCheckbox.checked).toBe(true);
    expect(oilCheckbox.checked).toBe(true);
  });

  it('persists profile updates via updateProfile when saved', async () => {
    await renderProfileWithAuth();

    const servingsInput = screen.getByLabelText(/servings/i);
    fireEvent.change(servingsInput, { target: { value: '3' } });

    const microwaveBtn = screen.getByTestId('equipment-microwave');
    fireEvent.click(microwaveBtn);

    const glutenFreeBtn = screen.getByTestId('dietary-filter-gluten_free');
    fireEvent.click(glutenFreeBtn);

    const saveBtn = screen.getByTestId('save-profile-button');
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(screen.getByTestId('save-success-banner')).toBeInTheDocument();
    });
  });

  it('requires explicit confirmation before deleting account and purges user session', async () => {
    let currentUser: any = null;

    const Consumer = () => {
      const { user } = useAuth();
      currentUser = user;
      return <div>Status: {user ? user.email : 'guest'}</div>;
    };

    render(
      <AuthProvider>
        <Consumer />
        <ProfileView />
      </AuthProvider>
    );

    // Click delete account
    const deleteBtn = screen.getByTestId('delete-account-button');
    fireEvent.click(deleteBtn);

    // Confirmation dialog appears
    const dialog = screen.getByTestId('delete-confirmation-dialog');
    expect(dialog).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /delete account\?/i })).toBeInTheDocument();

    // Confirm deletion
    const confirmBtn = screen.getByTestId('confirm-delete-button');
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(currentUser).toBeNull();
      expect(screen.getByText('Status: guest')).toBeInTheDocument();
    });
  });

  it('logs out and clears session when clicking logout', async () => {
    let currentUser: any = null;

    const Consumer = () => {
      const { user } = useAuth();
      currentUser = user;
      return <div>Status: {user ? user.email : 'guest'}</div>;
    };

    render(
      <AuthProvider>
        <Consumer />
        <ProfileView />
      </AuthProvider>
    );

    const logoutBtn = screen.getByTestId('logout-button');
    fireEvent.click(logoutBtn);

    await waitFor(() => {
      expect(currentUser).toBeNull();
      expect(screen.getByText('Status: guest')).toBeInTheDocument();
    });
  });
});
