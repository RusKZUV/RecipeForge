import React, { useState, useEffect, useRef } from 'react';
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

const PREDEFINED_AVATARS = ['👨‍🍳', '👩‍🍳', '🧑‍🍳', '🍳', '🥗', '🍲', '🥑', '🍕', '🍰', '🍜'];

export const ProfileView: React.FC = () => {
  const { user, updateProfile, logout, deleteAccount, formDrafts, setFormDraft, clearFormDraft } =
    useAuth();

  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const [avatarUrl, setAvatarUrl] = useState<string>(() => {
    return user?.avatar_url || '👨‍🍳';
  });

  const [maxBudget, setMaxBudget] = useState<string>(() => {
    if (user?.max_budget !== undefined && user?.max_budget !== null) {
      return String(user.max_budget);
    }
    return '15000';
  });

  const [recipesCooked] = useState<number>(() => {
    try {
      const val = localStorage.getItem(`recipeforge_recipes_cooked_${user?.id || 'demo'}`);
      return val ? parseInt(val, 10) : 4;
    } catch {
      return 4;
    }
  });

  const [itemsUsed] = useState<number>(() => {
    try {
      const val = localStorage.getItem(`recipeforge_items_used_${user?.id || 'demo'}`);
      return val ? parseInt(val, 10) : 12;
    } catch {
      return 12;
    }
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
      avatar_url: avatarUrl,
      max_budget: maxBudget,
    });
  }, [dietaryFilters, equipment, servings, assumedStaples, avatarUrl, maxBudget, setFormDraft]);

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

  const handleAvatarSelect = (emoji: string) => {
    setAvatarUrl(emoji);
    setSaveSuccess(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setAvatarUrl(reader.result);
          setSaveSuccess(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateServings(servings)) return;

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const parsedBudget = maxBudget.trim() ? parseInt(maxBudget.trim(), 10) : null;
      await updateProfile({
        dietary_filters: dietaryFilters,
        equipment,
        default_servings: parseInt(servings, 10),
        assumed_staples: assumedStaples,
        avatar_url: avatarUrl,
        max_budget: parsedBudget,
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

  // Mock estimated savings: 850 KZT per item used
  const moneySaved = itemsUsed * 850;

  return (
    <div className="rf-profile-view" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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

      <form onSubmit={handleSave} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* 2-Column Responsive Layout */}
        <div className="rf-profile-grid">
          {/* Left Column: Avatar & Personal Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Avatar Card */}
            <Card>
              <h2
                className="rf-heading"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'var(--font-size-h3)',
                  marginBottom: '12px',
                }}
              >
                User Avatar
              </h2>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                <div
                  data-testid="profile-avatar-preview"
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    border: '2px solid var(--color-ink)',
                    backgroundColor: 'var(--color-paper-warm, #EAE0D0)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    fontSize: '36px',
                    lineHeight: 1,
                    flexShrink: 0,
                    boxShadow: '2px 2px 0 var(--color-ink)',
                  }}
                >
                  {avatarUrl && (avatarUrl.startsWith('data:') || avatarUrl.startsWith('http')) ? (
                    <img
                      src={avatarUrl}
                      alt="Avatar Preview"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <span>{avatarUrl || '👨‍🍳'}</span>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    data-testid="upload-avatar-input"
                    style={{ display: 'none' }}
                    onChange={handleFileUpload}
                  />
                  <Button
                    type="button"
                    variant="outlined"
                    data-testid="upload-avatar-button"
                    onClick={() => fileInputRef.current?.click()}
                    style={{ fontSize: 'var(--font-size-sm)', padding: '6px 14px', minHeight: '36px' }}
                  >
                    Upload Avatar
                  </Button>
                  <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-ink-soft)' }}>
                    Choose an image or select an icon below
                  </span>
                </div>
              </div>

              <div>
                <span
                  style={{
                    display: 'block',
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: 600,
                    color: 'var(--color-ink-soft)',
                    marginBottom: '8px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  Predefined Icons
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {PREDEFINED_AVATARS.map((emoji) => {
                    const isSelected = avatarUrl === emoji;
                    return (
                      <button
                        key={emoji}
                        type="button"
                        data-testid={`avatar-option-${emoji}`}
                        onClick={() => handleAvatarSelect(emoji)}
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          border: isSelected ? '2px solid var(--color-olive)' : '1px solid var(--color-ink)',
                          backgroundColor: isSelected ? 'var(--color-olive-bg)' : 'var(--color-card)',
                          fontSize: '20px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'transform 0.15s ease',
                          transform: isSelected ? 'scale(1.1)' : 'none',
                        }}
                      >
                        {emoji}
                      </button>
                    );
                  })}
                </div>
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

            {/* Account Actions */}
            <Card>
              <h2
                className="rf-heading"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'var(--font-size-h3)',
                  marginBottom: '12px',
                }}
              >
                Account Settings
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
                    color: 'var(--color-paprika)',
                    borderColor: 'var(--color-paprika)',
                  }}
                >
                  Delete Account
                </Button>
              </div>
            </Card>
          </div>

          {/* Right Column: Budget & Stats */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* My Stats Card */}
            <Card>
              <h2
                className="rf-heading"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'var(--font-size-h3)',
                  marginBottom: '4px',
                }}
              >
                My Stats
              </h2>
              <p
                style={{
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--color-ink-soft)',
                  marginBottom: '14px',
                }}
              >
                Track your kitchen activity, dorm savings, and pantry sustainability
              </p>

              <div className="rf-stats-grid">
                <div className="rf-stat-card">
                  <span className="rf-stat-value" data-testid="stats-recipes-cooked">
                    {recipesCooked}
                  </span>
                  <span className="rf-stat-label">Recipes Cooked</span>
                </div>

                <div className="rf-stat-card">
                  <span className="rf-stat-value" data-testid="stats-items-used">
                    {itemsUsed}
                  </span>
                  <span className="rf-stat-label">Items Used</span>
                </div>

                <div className="rf-stat-card">
                  <span className="rf-stat-value" data-testid="stats-money-saved">
                    {moneySaved.toLocaleString()} ₸
                  </span>
                  <span className="rf-stat-label">Money Saved</span>
                </div>
              </div>
            </Card>

            {/* Weekly Budget Limit Card */}
            <Card>
              <h2
                className="rf-heading"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'var(--font-size-h3)',
                  marginBottom: '8px',
                }}
              >
                Budget Limit
              </h2>
              <p
                style={{
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--color-ink-soft)',
                  marginBottom: '14px',
                }}
              >
                Set your target weekly grocery spend to optimize recipe matches and stay on budget.
              </p>

              <Input
                label="Weekly Budget Limit (KZT)"
                type="number"
                min={0}
                step={500}
                value={maxBudget}
                onChange={(e) => {
                  setMaxBudget(e.target.value);
                  setSaveSuccess(false);
                }}
                data-testid="profile-max-budget-input"
                placeholder="e.g. 15000"
                helperText="Stored in integer Kazakhstani Tenge (KZT ₸)"
              />
            </Card>

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
          </div>
        </div>

        {/* Action Button */}
        <div style={{ marginTop: '8px' }}>
          <Button
            type="submit"
            variant="default"
            fullWidth
            disabled={isSaving}
            data-testid="save-profile-button"
            style={{
              backgroundColor: 'var(--color-ink)',
              color: 'var(--color-card)',
              fontSize: 'var(--font-size-base)',
              padding: '14px 20px',
            }}
          >
            {isSaving ? 'Saving Changes...' : 'Save Profile Changes'}
          </Button>
        </div>
      </form>

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
