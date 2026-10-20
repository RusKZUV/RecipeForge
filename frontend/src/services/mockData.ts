/**
 * Initial mock data for Demo account and seed content
 * Aligned with docs/plan.md Section 5 and 6.1
 */

import { User, PantryItem, Recipe, Ingredient } from '../types';

export const DEMO_USER_ID = 'user-demo-1';
export const DEMO_USER_EMAIL = 'demo@recipeforge.app';
export const DEMO_USER_PASSWORD = 'demopassword';

export const DEMO_USER: User = {
  id: DEMO_USER_ID,
  email: DEMO_USER_EMAIL,
  default_servings: 1,
  dietary_filters: [],
  equipment: ['stovetop', 'microwave'],
  assumed_staples: {
    pepper: true,
    oil: true,
  },
  created_at: '2026-10-20T00:00:00.000Z',
};

export const INITIAL_DEMO_PANTRY: PantryItem[] = [
  {
    id: 'pantry-item-1',
    user_id: DEMO_USER_ID,
    ingredient_id: 'ing-eggs',
    custom_name: null,
    quantity: 6,
    unit: 'pcs',
    expires_on: '2026-10-28',
    created_at: '2026-10-20T00:00:00.000Z',
  },
  {
    id: 'pantry-item-2',
    user_id: DEMO_USER_ID,
    ingredient_id: 'ing-milk',
    custom_name: null,
    quantity: 1,
    unit: 'l',
    expires_on: '2026-10-21', // Expiring soon
    created_at: '2026-10-20T00:00:00.000Z',
  },
  {
    id: 'pantry-item-3',
    user_id: DEMO_USER_ID,
    ingredient_id: 'ing-onion',
    custom_name: null,
    quantity: 500,
    unit: 'g',
    expires_on: '2026-11-05',
    created_at: '2026-10-20T00:00:00.000Z',
  },
  {
    id: 'pantry-item-4',
    user_id: DEMO_USER_ID,
    ingredient_id: 'ing-potato',
    custom_name: null,
    quantity: 1000,
    unit: 'g',
    expires_on: '2026-11-10',
    created_at: '2026-10-20T00:00:00.000Z',
  },
  {
    id: 'pantry-item-5',
    user_id: DEMO_USER_ID,
    ingredient_id: 'ing-rice',
    custom_name: null,
    quantity: 800,
    unit: 'g',
    expires_on: '2027-01-01',
    created_at: '2026-10-20T00:00:00.000Z',
  },
  {
    id: 'pantry-item-6',
    user_id: DEMO_USER_ID,
    ingredient_id: 'ing-carrot',
    custom_name: null,
    quantity: 300,
    unit: 'g',
    expires_on: '2026-10-29',
    created_at: '2026-10-20T00:00:00.000Z',
  },
  {
    id: 'pantry-item-7',
    user_id: DEMO_USER_ID,
    ingredient_id: 'ing-tomato',
    custom_name: null,
    quantity: 400,
    unit: 'g',
    expires_on: '2026-10-20', // Expires today
    created_at: '2026-10-20T00:00:00.000Z',
  },
  {
    id: 'pantry-item-8',
    user_id: DEMO_USER_ID,
    ingredient_id: 'ing-chicken',
    custom_name: null,
    quantity: 500,
    unit: 'g',
    expires_on: '2026-10-24',
    created_at: '2026-10-20T00:00:00.000Z',
  },
];

export const INITIAL_INGREDIENTS: Ingredient[] = [
  {
    id: 'ing-eggs',
    canonical_name: 'eggs',
    category: 'dairy_and_eggs',
    base_unit: 'pcs',
    price_per_base_unit: 65, // ~65 KZT per egg
    assumed_staple: false,
    flags: {
      contains_meat: false,
      contains_animal_product: true,
      contains_gluten: false,
      contains_dairy: false,
      contains_nuts: false,
    },
    unit_approximations: { pcs: 50 },
    variant_of: null,
  },
  {
    id: 'ing-rice',
    canonical_name: 'white rice',
    category: 'grains',
    base_unit: 'kg',
    price_per_base_unit: 450, // 450 KZT / kg
    assumed_staple: false,
    flags: {
      contains_meat: false,
      contains_animal_product: false,
      contains_gluten: false,
      contains_dairy: false,
      contains_nuts: false,
    },
    unit_approximations: { cup: 200 },
    variant_of: null,
  },
  {
    id: 'ing-onion',
    canonical_name: 'onion',
    category: 'produce',
    base_unit: 'kg',
    price_per_base_unit: 180, // 180 KZT / kg
    assumed_staple: false,
    flags: {
      contains_meat: false,
      contains_animal_product: false,
      contains_gluten: false,
      contains_dairy: false,
      contains_nuts: false,
    },
    unit_approximations: { pcs: 120 },
    variant_of: null,
  },
];

export const INITIAL_RECIPES: Recipe[] = [
  {
    id: 'recipe-egg-fried-rice',
    owner_id: null,
    title: 'Quick Egg Fried Rice',
    servings: 1,
    time_minutes: 15,
    equipment: ['stovetop'],
    is_seed: true,
    source: 'RecipeForge Staff Hand-Curated',
    license_note: 'Curated for budget students',
    ingredients: [
      { ingredient_id: 'ing-rice', quantity: 150, unit: 'g', optional: false },
      { ingredient_id: 'ing-eggs', quantity: 2, unit: 'pcs', optional: false },
      { ingredient_id: 'ing-onion', quantity: 60, unit: 'g', optional: false },
    ],
    steps: [
      { position: 1, text: 'Chop the onion finely.', timer_seconds: null },
      { position: 2, text: 'Scramble the eggs in hot oil for 2 minutes.', timer_seconds: 120 },
      { position: 3, text: 'Add cooked rice and diced onion, stir fry for 5 minutes.', timer_seconds: 300 },
    ],
  },
];
