/**
 * RecipeForge Core Domain Models
 * Aligned with docs/plan.md Section 5
 */

export type DietaryFilter = 'vegetarian' | 'vegan' | 'gluten_free' | 'dairy_free' | 'nut_free';

export interface AssumedStaplesProfile {
  pepper: boolean;
  oil: boolean;
  [key: string]: boolean;
}

export interface Profile {
  dietary_filters: DietaryFilter[];
  equipment: string[];
  default_servings: number;
  assumed_staples: AssumedStaplesProfile;
}

export interface User {
  id: string;
  email: string;
  default_servings: number;
  dietary_filters: DietaryFilter[];
  equipment: string[];
  assumed_staples: AssumedStaplesProfile;
  created_at: string;
}

export type BaseUnit = 'g' | 'kg' | 'ml' | 'l' | 'pcs';

export interface DietaryFlags {
  contains_meat: boolean;
  contains_animal_product: boolean;
  contains_gluten: boolean;
  contains_dairy: boolean;
  contains_nuts: boolean;
}

export interface Ingredient {
  id: string;
  canonical_name: string;
  category: string;
  base_unit: BaseUnit;
  /** Price per base unit in integer tenge (KZT), never float. Null if unknown */
  price_per_base_unit: number | null;
  assumed_staple: boolean;
  flags: DietaryFlags;
  unit_approximations: Record<string, number>;
  variant_of: string | null;
}

export interface IngredientAlias {
  ingredient_id: string;
  alias: string;
}

export type ExpiryStatus = 'fresh' | 'expiring_soon' | 'expires_today' | 'expired';

export interface PantryItem {
  id: string;
  user_id: string;
  ingredient_id: string | null;
  custom_name?: string | null;
  quantity: number;
  unit: string;
  /** ISO calendar date string (YYYY-MM-DD) or null */
  expires_on: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CustomIngredient {
  id: string;
  user_id: string;
  name: string;
  created_at?: string;
}

export interface RecipeIngredient {
  id?: string;
  recipe_id?: string;
  ingredient_id: string;
  custom_name?: string | null;
  quantity: number;
  unit: string;
  optional: boolean;
}

export interface RecipeStep {
  id?: string;
  recipe_id?: string;
  position: number;
  text: string;
  timer_seconds: number | null;
}

export interface Recipe {
  id: string;
  owner_id: string | null;
  title: string;
  servings: number;
  time_minutes: number;
  equipment: string[];
  is_seed: boolean;
  source?: string | null;
  license_note?: string | null;
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
}

export interface SubstitutionRule {
  id: string;
  from_ingredient: string;
  to_ingredient: string;
  ratio: number;
  quality: number; // 0..1
  note: string;
  context?: string;
  tags?: string[];
}

export interface UserPrice {
  id?: string;
  user_id: string;
  ingredient_id: string;
  /** Price in integer tenge (KZT), never float */
  price: number;
  unit: string;
  updated_at: string;
}

export interface ShoppingListItem {
  id: string;
  user_id: string;
  ingredient_id: string | null;
  custom_name?: string | null;
  quantity: number;
  unit: string;
  source_recipes: string[];
  servings?: number;
  checked: boolean;
  /** Estimated price in integer tenge (KZT), never float */
  estimated_price_kzt?: number | null;
}

export interface Favorite {
  id?: string;
  user_id: string;
  recipe_id: string;
  created_at?: string;
}

export interface CookingHistory {
  id: string;
  user_id: string;
  recipe_id: string | null;
  recipe_title: string;
  cooked_at: string;
  servings: number;
}

export interface CookSession {
  recipe_snapshot: Recipe;
  current_step: number;
  /** Step timers as end timestamps (epoch ms) */
  timers: Record<string, number>;
  checked_ingredients: Record<string, boolean>;
  selected_servings: number;
}

export interface AuthToken {
  access_token: string;
  token_type: 'bearer';
  /** Epoch timestamp (ms) when token expires */
  expires_at: number;
}

export interface AuthResponse {
  user: User;
  token: AuthToken;
}

export interface RegisterRequest {
  email: string;
  password: string;
  default_servings?: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface CreatePantryItemRequest {
  ingredient_id?: string | null;
  custom_name?: string | null;
  quantity: number;
  unit: string;
  expires_on?: string | null;
}

export interface UpdatePantryItemRequest {
  ingredient_id?: string | null;
  custom_name?: string | null;
  quantity?: number;
  unit?: string;
  expires_on?: string | null;
}

export interface CreateRecipeRequest {
  title: string;
  servings: number;
  time_minutes: number;
  equipment: string[];
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  source?: string | null;
  license_note?: string | null;
}

export interface UpdateRecipeRequest {
  title?: string;
  servings?: number;
  time_minutes?: number;
  equipment?: string[];
  ingredients?: RecipeIngredient[];
  steps?: RecipeStep[];
  source?: string | null;
  license_note?: string | null;
}

export interface RecipeFilterParams {
  query?: string;
  dietary_filters?: DietaryFilter[];
  sort_by?: 'balanced' | 'pantry_coverage' | 'cheapest' | 'urgency';
  limit?: number;
  offset?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface CreateShoppingItemRequest {
  ingredient_id?: string | null;
  custom_name?: string | null;
  quantity: number;
  unit: string;
  source_recipes?: string[];
  servings?: number;
  estimated_price_kzt?: number | null;
}

export interface UpdateShoppingItemRequest {
  ingredient_id?: string | null;
  custom_name?: string | null;
  quantity?: number;
  unit?: string;
  source_recipes?: string[];
  servings?: number;
  checked?: boolean;
  estimated_price_kzt?: number | null;
}
