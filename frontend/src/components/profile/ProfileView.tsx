import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { DietaryFilter } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

const DIETARY_OPTIONS: { id: DietaryFilter; label: string }[] = [
  { id: 'vegetarian', label: 'Vegetarian' },
  { id: 'vegan', label: 'Vegan' },
  { id: 'gluten_free', label: 'Gluten-Free' },
  { id: 'dairy_free', label: 'Dairy-Free' },
  { id: 'nut_free', label: 'Nut-Free' },
];

const STANDARD_EQUIPMENT: string[] = ['stovetop', 'microwave', 'oven', 'blender'];

export const ProfileView: React.FC = () => {
  const { user, updateProfile, logout, deleteAccount, formDrafts, setFormDraft, clearFormDraft } =
    useAuth();

  const [dietaryFilters, setDietaryFilters] = useState<DietaryFilter[]>(() => {
    if (formDrafts.profileDraft?.dietary_filters) return formDrafts.profileDraft.dietary_filters;
    return user?.dietary_filters || [];
  });

  const [equipment, setEquipment] = useState<string[]>(() => {
    if (formDrafts.profileDraft?.equipment) return formDrafts.profileDraft.equipment;
    return user?.equipment || ['stovetop'];
  });

  const [servings, setServings] = useState<string>(() => {
    if (formDrafts.profileDraft?.servings !== undefined) return String(formDrafts.profileDraft.servings);
    return String(user?.default_servings ?? 1);
  });

  const [assumedStaples, setAssumedStaples] = useState<{ pepper: boolean; oil: boolean }>(() => {
    if (formDrafts.profileDraft?.assumed_staples) return formDrafts.profileDraft.assumed_staples;
    return {
      pepper: user?.assumed_staples?.pepper ?? true,
      oil: user?.assumed_staples?.oil ?? true,
    };
  });

  const [servingsError, setServingsError] = useState<string | undefined>(undefined);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Sync draft
  useEffect(() => {
    setFormDraft('profileDraft', {
      dietary_filters: dietaryFilters,
      equipment,
      servings,
      assumed_staples: assumedStaples,
    });
  }, [dietaryFilters, equipment, servings, assumedStaples, setFormDraft]);

  const handleDietaryToggle = (id: DietaryFilter) => {
    setSaveSuccess(false);
    if (dietaryFilters.includes(id)) {
      setDietaryFilters(dietaryFilters.filter((item) => item !== id));
    } else {
      const next = [...dietaryFilters, id];
      // Selecting "vegan" automatically activates "vegetarian" and "dairy_free" options
      if (id === 'vegan') {
        if (!next.includes('vegetarian')) next.push('vegetarian');
        if (!next.includes('dairy_free')) next.push('dairy_free');
      }
      setDietaryFilters(next);
    }
  };

  const handleEquipmentToggle = (item: string) => {
    setSaveSuccess(false);
    if (equipment.includes(item)) {
      setEquipment(equipment.filter((e) => e !== item));
    } else {
      setEquipment([...equipment, item]);
    }
  };

  const validateServings = (val: string): boolean => {
    const trimmed = val.trim();
    if (!trimmed) {
      setServingsError('Servings must be a whole number between 1 and 12');
      return false;
    }
    const num = Number(trimmed);
    if (!Number.isInteger(num) || num < 1 || num > 12) {
      setServingsError('Servings must be a whole number between 1 and 12');
      return false;
    }
    setServingsError(undefined);
    return true;
  };

  const handleServingsChange = (val: string) => {
    setServings(val);
    setSaveSuccess(false);
    validateServings(val);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateServings(servings)) return;

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      await updateProfile({
        dietary_filters: dietaryFilters,
        equipment,
        default_servings: parseInt(servings, 10),
        assumed_staples: assumedStaples,
      });
      clearFormDraft('profileDraft');
      setSaveSuccess(true);
    } catch (err: any) {
      setSaveError(err.message || 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await deleteAccount();
      clearFormDraft('profileDraft');
    } catch (err: any) {
      setSaveError(err.message || 'Failed to delete account');
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  return (
    <div className="rf-profile-view" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <header>
        <h1
          className="rf-heading"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--font-size-h2)',
            marginBottom: '4px',
          }}
        >
          Kitchen Profile
        </h1>
        <p style={{ color: 'var(--color-ink-soft)', fontSize: 'var(--font-size-base)' }}>
          {user?.email || 'Logged in user'}
        </p>
      </header>

      {/* Prominently displayed persistent allergy disclaimer */}
      <Card
        data-testid="allergy-disclaimer"
        style={{
          backgroundColor: 'var(--color-paper)',
          border: '1.5px solid var(--color-ink)',
          boxShadow: 'none',
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 'var(--font-size-sm)',
            fontWeight: 600,
            color: 'var(--color-paprika)',
          }}
        >
          Filters help select recipes but do not replace label checks for allergies.
        </p>
      </Card>

      {saveSuccess && (
        <div
          role="status"
          data-testid="save-success-banner"
          style={{
            padding: '10px 14px',
            backgroundColor: 'var(--color-olive-bg)',
            color: 'var(--color-olive)',
            borderRadius: 'var(--radius-card)',
            border: '1.5px solid var(--color-olive)',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 600,
          }}
        >
          Profile updated successfully!
        </div>
      )}

      {saveError && (
        <div
          role="alert"
          style={{
            padding: '10px 14px',
            backgroundColor: 'var(--color-expired-bg)',
            color: 'var(--color-paprika)',
            borderRadius: 'var(--radius-card)',
            border: '1.5px solid var(--color-paprika)',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 600,
          }}
        >
          {saveError}
        </div>
      )}

      <form onSubmit={handleSave} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* Dietary Filters */}
        <Card>
          <h2
            className="rf-heading"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--font-size-h3)',
              marginBottom: '10px',
            }}
          >
            Dietary Preferences
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {DIETARY_OPTIONS.map((opt) => {
              const active = dietaryFilters.includes(opt.id);
              return (
                <button
                  key={opt.id}
                  type="button"
                  data-testid={`dietary-filter-${opt.id}`}
                  onClick={() => handleDietaryToggle(opt.id)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-pill)',
                    border: 'var(--border-ink)',
                    backgroundColor: active ? 'var(--color-olive)' : 'var(--color-card)',
                    color: active ? '#FFFBF2' : 'var(--color-ink)',
                    fontFamily: 'var(--font-body)',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    minHeight: '44px',
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </Card>

        {/* Kitchen Equipment */}
        <Card>
          <h2
            className="rf-heading"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--font-size-h3)',
              marginBottom: '10px',
            }}
          >
            Available Equipment
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {STANDARD_EQUIPMENT.map((item) => {
              const active = equipment.includes(item);
              return (
                <button
                  key={item}
                  type="button"
                  data-testid={`equipment-${item}`}
                  onClick={() => handleEquipmentToggle(item)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-pill)',
                    border: 'var(--border-ink)',
                    backgroundColor: active ? 'var(--color-ink)' : 'var(--color-card)',
                    color: active ? 'var(--color-card)' : 'var(--color-ink)',
                    fontFamily: 'var(--font-body)',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    minHeight: '44px',
                    textTransform: 'capitalize',
                  }}
                >
                  {item}
                </button>
              );
            })}
          </div>
        </Card>

        {/* Default Servings */}
        <Card>
          <h2
            className="rf-heading"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--font-size-h3)',
              marginBottom: '10px',
            }}
          >
            Default Servings
          </h2>
          <Input
            label="Servings (1 - 12)"
            type="number"
            min={1}
            max={12}
            step={1}
            value={servings}
            onChange={(e) => handleServingsChange(e.target.value)}
            error={servingsError}
            helperText="Default portion count for recipes (whole number from 1 to 12)"
          />
        </Card>

        {/* Assumed Staples */}
        <Card>
          <h2
            className="rf-heading"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--font-size-h3)',
              marginBottom: '10px',
            }}
          >
            Assumed Staples
          </h2>
          <p
            style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-ink-soft)',
              marginBottom: '12px',
            }}
          >
            Ingredients you always have on hand and don&apos;t need to buy.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                cursor: 'pointer',
                fontSize: 'var(--font-size-base)',
              }}
            >
              <input
                type="checkbox"
                data-testid="staple-pepper"
                checked={assumedStaples.pepper}
                onChange={(e) => {
                  setSaveSuccess(false);
                  setAssumedStaples({ ...assumedStaples, pepper: e.target.checked });
                }}
                style={{
                  width: '20px',
                  height: '20px',
                  accentColor: 'var(--color-ink)',
                }}
              />
              <span>Black pepper</span>
            </label>

            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                cursor: 'pointer',
                fontSize: 'var(--font-size-base)',
              }}
            >
              <input
                type="checkbox"
                data-testid="staple-oil"
                checked={assumedStaples.oil}
                onChange={(e) => {
                  setSaveSuccess(false);
                  setAssumedStaples({ ...assumedStaples, oil: e.target.checked });
                }}
                style={{
                  width: '20px',
                  height: '20px',
                  accentColor: 'var(--color-ink)',
                }}
              />
              <span>Cooking oil</span>
            </label>
          </div>
        </Card>

        <Button
          type="submit"
          variant="default"
          fullWidth
          disabled={isSaving}
          data-testid="save-profile-button"
        >
          {isSaving ? 'Saving profile...' : 'Save profile'}
        </Button>
      </form>

      {/* Account actions: Logout & Delete */}
      <Card style={{ marginTop: '12px' }}>
        <h2
          className="rf-heading"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--font-size-h3)',
            marginBottom: '12px',
          }}
        >
          Account Actions
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <Button
            type="button"
            variant="outlined"
            fullWidth
            onClick={() => logout()}
            data-testid="logout-button"
          >
            Log out
          </Button>

          <Button
            type="button"
            variant="outlined"
            fullWidth
            onClick={() => setShowDeleteModal(true)}
            data-testid="delete-account-button"
            style={{
              borderColor: 'var(--color-paprika)',
              color: 'var(--color-paprika)',
            }}
          >
            Delete account
          </Button>
        </div>
      </Card>

      {/* Explicit Confirmation Dialog for Delete Account */}
      {showDeleteModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
          data-testid="delete-confirmation-dialog"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(43, 33, 24, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            zIndex: 1000,
          }}
        >
          <div style={{ maxWidth: '400px', width: '100%' }}>
            <Card>
              <h2
                id="delete-dialog-title"
                className="rf-heading"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'var(--font-size-h3)',
                  color: 'var(--color-paprika)',
                  marginBottom: '10px',
                }}
              >
                Delete Account?
              </h2>
              <p
                style={{
                  fontSize: 'var(--font-size-base)',
                  color: 'var(--color-ink)',
                  marginBottom: '16px',
                }}
              >
                Are you sure you want to delete your account? This action cannot be undone. All your
                pantry items, custom recipes, and shopping lists will be permanently deleted.
              </p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <Button
                  type="button"
                  variant="outlined"
                  fullWidth
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="default"
                  fullWidth
                  onClick={handleDeleteAccount}
                  disabled={isDeleting}
                  data-testid="confirm-delete-button"
                  style={{
                    backgroundColor: 'var(--color-paprika)',
                    color: '#FFFBF2',
                  }}
                >
                  {isDeleting ? 'Deleting...' : 'Confirm Delete'}
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileView;
