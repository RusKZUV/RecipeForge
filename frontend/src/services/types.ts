/**
 * Service interfaces and API abstractions
 * Aligned with docs/plan.md Section 3 & 5
 */

import {
  User,
  Profile,
  PantryItem,
  Recipe,
  ShoppingListItem,
  AuthResponse,
  RegisterRequest,
  LoginRequest,
  CreatePantryItemRequest,
  UpdatePantryItemRequest,
  CreateRecipeRequest,
  UpdateRecipeRequest,
  RecipeFilterParams,
  PaginatedResponse,
  CreateShoppingItemRequest,
  UpdateShoppingItemRequest,
} from '../types';

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

export interface AuthService {
  register(req: RegisterRequest): Promise<AuthResponse>;
  login(req: LoginRequest): Promise<AuthResponse>;
  loginAsDemo(): Promise<AuthResponse>;
  logout(token: string): Promise<void>;
  getCurrentUser(token: string): Promise<User>;
  updateProfile(token: string, profile: Partial<Profile>): Promise<User>;
  deleteAccount(token: string): Promise<void>;
}

export interface PantryService {
  listItems(token: string): Promise<PantryItem[]>;
  addItem(token: string, item: CreatePantryItemRequest): Promise<PantryItem>;
  updateItem(token: string, id: string, item: UpdatePantryItemRequest): Promise<PantryItem>;
  deleteItem(token: string, id: string): Promise<void>;
}

export interface RecipeService {
  listRecipes(token: string, filters?: RecipeFilterParams): Promise<PaginatedResponse<Recipe>>;
  getRecipe(token: string, id: string): Promise<Recipe>;
  createRecipe(token: string, recipe: CreateRecipeRequest): Promise<Recipe>;
  updateRecipe(token: string, id: string, recipe: UpdateRecipeRequest): Promise<Recipe>;
  deleteRecipe(token: string, id: string): Promise<void>;
}

export interface ShoppingService {
  listItems(token: string): Promise<ShoppingListItem[]>;
  addItem(token: string, item: CreateShoppingItemRequest): Promise<ShoppingListItem>;
  updateItem(token: string, id: string, item: UpdateShoppingItemRequest): Promise<ShoppingListItem>;
  deleteItem(token: string, id: string): Promise<void>;
  markBought(token: string, id: string, targetPantry?: Partial<CreatePantryItemRequest>): Promise<void>;
}

export interface ApiService {
  readonly auth: AuthService;
  readonly pantry: PantryService;
  readonly recipes: RecipeService;
  readonly shopping: ShoppingService;
}
