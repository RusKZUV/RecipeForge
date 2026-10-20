import React, { useState, useEffect, useRef } from 'react';
import { Recipe } from '../../types';
import { getApiService, INITIAL_INGREDIENTS } from '../../services';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

export interface RecipeDetailsModalProps {
  recipeId: string;
  token: string;
  onClose: () => void;
}

export const RecipeDetailsModal: React.FC<RecipeDetailsModalProps> = ({
  recipeId,
  token,
  onClose,
}) => {
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);

  // Store previously focused element to restore focus on unmount
  useEffect(() => {
    previouslyFocusedElementRef.current = document.activeElement as HTMLElement | null;

    return () => {
      // Restore focus to triggering card or previously active element
      const triggerCard = document.querySelector(
        `[data-testid="recipe-card-${recipeId}"]`
      ) as HTMLElement | null;

      if (triggerCard && typeof triggerCard.focus === 'function') {
        triggerCard.focus();
      } else if (
        previouslyFocusedElementRef.current &&
        typeof previouslyFocusedElementRef.current.focus === 'function'
      ) {
        previouslyFocusedElementRef.current.focus();
      }
    };
  }, [recipeId]);

  // Handle Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  // Fetch recipe details
  const fetchRecipe = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const api = getApiService();
      const data = await api.recipes.getRecipe(token, recipeId);
      setRecipe(data);
    } catch (err) {
      setError((err as Error).message || 'Failed to load recipe details. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecipe();
  }, [recipeId, token]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const getIngredientDisplayName = (ingredientId: string, customName?: string | null): string => {
    if (customName) return customName;
    const catalogItem = INITIAL_INGREDIENTS.find((i) => i.id === ingredientId);
    return catalogItem?.canonical_name || ingredientId;
  };

  return (
    <div
      data-testid="recipe-modal-backdrop"
      onClick={handleBackdropClick}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(43, 33, 24, 0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '16px',
        boxSizing: 'border-box',
      }}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={recipe ? 'recipe-modal-title' : undefined}
        aria-label={!recipe ? 'Recipe Details' : undefined}
        data-testid="recipe-details-modal"
        style={{
          backgroundColor: 'var(--color-card)',
          border: 'var(--border-ink)',
          borderRadius: 'var(--radius-card)',
          boxShadow: 'var(--shadow-card)',
          maxWidth: '480px',
          width: '100%',
          maxHeight: '85vh',
          overflowY: 'auto',
          padding: '20px',
          boxSizing: 'border-box',
          position: 'relative',
        }}
      >
        {/* Header bar with close button */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '12px',
            marginBottom: '12px',
          }}
        >
          {recipe && (
            <h2
              id="recipe-modal-title"
              className="rf-heading"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--font-size-h2)',
                margin: 0,
                color: 'var(--color-ink)',
                wordBreak: 'break-word',
              }}
            >
              {recipe.title}
            </h2>
          )}
          {!recipe && !isLoading && !error && (
            <h2
              className="rf-heading"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--font-size-h2)',
                margin: 0,
              }}
            >
              Recipe Details
            </h2>
          )}
          <button
            type="button"
            aria-label="Close"
            data-testid="modal-close-button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '24px',
              lineHeight: 1,
              color: 'var(--color-ink)',
              padding: '4px 8px',
              marginLeft: 'auto',
              borderRadius: '4px',
            }}
          >
            ✕
          </button>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div
            data-testid="recipe-modal-loading"
            style={{ textAlign: 'center', padding: '36px 0' }}
          >
            <p
              style={{
                fontFamily: 'var(--font-handwritten)',
                fontSize: 'var(--font-size-h3)',
                color: 'var(--color-ink)',
                margin: 0,
              }}
            >
              Loading recipe details...
            </p>
          </div>
        )}

        {/* Error state */}
        {!isLoading && error && (
          <div
            data-testid="recipe-modal-error"
            style={{ textAlign: 'center', padding: '24px 0' }}
          >
            <p
              role="alert"
              style={{
                color: 'var(--color-paprika)',
                fontSize: 'var(--font-size-base)',
                marginBottom: '16px',
                fontWeight: 600,
              }}
            >
              {error}
            </p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
              <Button type="button" variant="default" onClick={fetchRecipe}>
                Retry
              </Button>
              <Button type="button" variant="outlined" onClick={onClose}>
                Dismiss
              </Button>
            </div>
          </div>
        )}

        {/* Loaded Recipe Content */}
        {!isLoading && !error && recipe && (
          <div data-testid="recipe-modal-content">
            {/* Meta tags: Cooking time, Servings */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
                marginBottom: '16px',
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-ink-soft)',
                alignItems: 'center',
              }}
            >
              <span
                style={{
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-pill)',
                  backgroundColor: 'var(--color-paper)',
                  border: '1px solid var(--color-ink)',
                  fontWeight: 500,
                  color: 'var(--color-ink)',
                }}
              >
                ⏱ {recipe.time_minutes} mins
              </span>
              <span
                style={{
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-pill)',
                  backgroundColor: 'var(--color-paper)',
                  border: '1px solid var(--color-ink)',
                  fontWeight: 500,
                  color: 'var(--color-ink)',
                }}
              >
                🍽 {recipe.servings} servings
              </span>
            </div>

            {/* Equipment (if present) */}
            {recipe.equipment && recipe.equipment.length > 0 && (
              <div style={{ marginBottom: '16px' }} data-testid="recipe-equipment-section">
                <h3
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'var(--font-size-base)',
                    marginBottom: '6px',
                    color: 'var(--color-ink)',
                  }}
                >
                  Equipment
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {recipe.equipment.map((eq) => (
                    <Badge
                      key={eq}
                      status="default"
                      style={{
                        minHeight: '28px',
                        padding: '0 10px',
                        fontSize: 'var(--font-size-sm)',
                      }}
                    >
                      {eq}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Ingredients list */}
            <div style={{ marginBottom: '20px' }}>
              <h3
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'var(--font-size-base)',
                  marginBottom: '8px',
                  color: 'var(--color-ink)',
                }}
              >
                Ingredients ({recipe.ingredients.length})
              </h3>
              <ul
                data-testid="recipe-ingredients-list"
                style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                {recipe.ingredients.map((ing, idx) => {
                  const displayName = getIngredientDisplayName(ing.ingredient_id, ing.custom_name);
                  return (
                    <li
                      key={ing.id || `${ing.ingredient_id}-${idx}`}
                      data-testid={`recipe-ingredient-${ing.ingredient_id || idx}`}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '6px 10px',
                        borderRadius: '8px',
                        backgroundColor: 'var(--color-paper)',
                        border: '1px solid var(--color-ink)',
                        fontSize: 'var(--font-size-sm)',
                      }}
                    >
                      <span style={{ fontWeight: 500, color: 'var(--color-ink)' }}>
                        {displayName}
                        {ing.optional && (
                          <span
                            style={{
                              marginLeft: '6px',
                              color: 'var(--color-ink-soft)',
                              fontStyle: 'italic',
                              fontWeight: 400,
                            }}
                          >
                            (optional)
                          </span>
                        )}
                      </span>
                      <span style={{ color: 'var(--color-ink-soft)', fontWeight: 600 }}>
                        {ing.quantity} {ing.unit}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Ordered instruction steps */}
            <div style={{ marginBottom: '20px' }}>
              <h3
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'var(--font-size-base)',
                  marginBottom: '8px',
                  color: 'var(--color-ink)',
                }}
              >
                Instructions ({recipe.steps.length} steps)
              </h3>
              <ol
                data-testid="recipe-steps-list"
                style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                {[...recipe.steps]
                  .sort((a, b) => a.position - b.position)
                  .map((step, idx) => (
                    <li
                      key={step.id || step.position || idx}
                      data-testid={`recipe-step-${step.position}`}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-card)',
                        backgroundColor: 'var(--color-paper)',
                        border: '1px solid var(--color-ink)',
                        fontSize: 'var(--font-size-sm)',
                        lineHeight: 1.5,
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'baseline',
                          marginBottom: '4px',
                        }}
                      >
                        <span
                          style={{
                            fontWeight: 700,
                            fontFamily: 'var(--font-display)',
                            color: 'var(--color-ink)',
                          }}
                        >
                          Step {step.position}
                        </span>
                        {step.timer_seconds != null && step.timer_seconds > 0 && (
                          <span
                            data-testid={`step-timer-${step.position}`}
                            style={{
                              fontSize: 'var(--font-size-legal)',
                              fontWeight: 600,
                              color: 'var(--color-card)',
                              backgroundColor: 'var(--color-paprika)',
                              borderRadius: 'var(--radius-pill)',
                              padding: '2px 8px',
                              border: '1px solid var(--color-ink)',
                            }}
                          >
                            ⏱ Timer: {step.timer_seconds}s
                          </span>
                        )}
                      </div>
                      <p style={{ margin: 0, color: 'var(--color-ink)' }}>{step.text}</p>
                    </li>
                  ))}
              </ol>
            </div>

            {/* Source and License note (if present) */}
            {(recipe.source || recipe.license_note) && (
              <div
                data-testid="recipe-source-license"
                style={{
                  padding: '8px 10px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--color-paper)',
                  border: '1px dashed var(--color-ink)',
                  fontSize: 'var(--font-size-legal)',
                  color: 'var(--color-ink-soft)',
                  marginBottom: '16px',
                }}
              >
                {recipe.source && <div>Source: {recipe.source}</div>}
                {recipe.license_note && <div>License: {recipe.license_note}</div>}
              </div>
            )}

            {/* Bottom Dismiss / Close Button */}
            <div style={{ marginTop: '16px' }}>
              <Button type="button" variant="outlined" fullWidth onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
