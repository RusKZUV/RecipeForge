/**
 * HttpApiService stub for real backend integration
 * Will be implemented in iter-5-integration
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
import {
  ApiService,
  AuthService,
  PantryService,
  RecipeService,
  ShoppingService,
  ApiError,
} from './types';

export class HttpApiService implements ApiService {
  readonly baseUrl: string;

  readonly auth: AuthService;
  readonly pantry: PantryService;
  readonly recipes: RecipeService;
  readonly shopping: ShoppingService;

  constructor(baseUrl: string = 'http://localhost:8091') {
    this.baseUrl = baseUrl.replace(/\/$/, '');

    this.auth = {
      register: (req: RegisterRequest) => this.request<AuthResponse>('/auth/register', { method: 'POST', body: req }),
      login: (req: LoginRequest) => this.request<AuthResponse>('/auth/login', { method: 'POST', body: req }),
      loginAsDemo: () => this.request<AuthResponse>('/auth/demo-login', { method: 'POST' }),
      logout: (token: string) => this.request<void>('/auth/logout', { method: 'POST', token }),
      getCurrentUser: (token: string) => this.request<User>('/auth/me', { token }),
      updateProfile: (token: string, profile: Partial<Profile>) =>
        this.request<User>('/auth/profile', { method: 'PATCH', body: profile, token }),
      deleteAccount: (token: string) => this.request<void>('/auth/account', { method: 'DELETE', token }),
    };

    this.pantry = {
      listItems: (token: string) => this.request<PantryItem[]>('/pantry', { token }),
      addItem: (token: string, item: CreatePantryItemRequest) =>
        this.request<PantryItem>('/pantry', { method: 'POST', body: item, token }),
      updateItem: (token: string, id: string, item: UpdatePantryItemRequest) =>
        this.request<PantryItem>(`/pantry/${id}`, { method: 'PATCH', body: item, token }),
      deleteItem: (token: string, id: string) =>
        this.request<void>(`/pantry/${id}`, { method: 'DELETE', token }),
    };

    this.recipes = {
      listRecipes: (token: string, filters?: RecipeFilterParams) => {
        const queryParams = new URLSearchParams();
        if (filters?.query) queryParams.set('query', filters.query);
        if (filters?.sort_by) queryParams.set('sort_by', filters.sort_by);
        if (filters?.limit) queryParams.set('limit', String(filters.limit));
        if (filters?.offset) queryParams.set('offset', String(filters.offset));
        const qs = queryParams.toString() ? `?${queryParams.toString()}` : '';
        return this.request<PaginatedResponse<Recipe>>(`/recipes${qs}`, { token });
      },
      getRecipe: (token: string, id: string) => this.request<Recipe>(`/recipes/${id}`, { token }),
      createRecipe: (token: string, recipe: CreateRecipeRequest) =>
        this.request<Recipe>('/recipes', { method: 'POST', body: recipe, token }),
      updateRecipe: (token: string, id: string, recipe: UpdateRecipeRequest) =>
        this.request<Recipe>(`/recipes/${id}`, { method: 'PATCH', body: recipe, token }),
      deleteRecipe: (token: string, id: string) =>
        this.request<void>(`/recipes/${id}`, { method: 'DELETE', token }),
    };

    this.shopping = {
      listItems: (token: string) => this.request<ShoppingListItem[]>('/shopping', { token }),
      addItem: (token: string, item: CreateShoppingItemRequest) =>
        this.request<ShoppingListItem>('/shopping', { method: 'POST', body: item, token }),
      updateItem: (token: string, id: string, item: UpdateShoppingItemRequest) =>
        this.request<ShoppingListItem>(`/shopping/${id}`, { method: 'PATCH', body: item, token }),
      deleteItem: (token: string, id: string) =>
        this.request<void>(`/shopping/${id}`, { method: 'DELETE', token }),
      markBought: (token: string, id: string, targetPantry?: Partial<CreatePantryItemRequest>) =>
        this.request<void>(`/shopping/${id}/bought`, { method: 'POST', body: targetPantry, token }),
    };
  }

  private async request<T>(
    endpoint: string,
    options?: {
      method?: string;
      body?: unknown;
      token?: string;
    }
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (options?.token) {
      const cleanToken = options.token.startsWith('Bearer ')
        ? options.token
        : `Bearer ${options.token}`;
      headers['Authorization'] = cleanToken;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: options?.method ?? 'GET',
      headers,
      body: options?.body ? JSON.stringify(options.body) : undefined,
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status} ${response.statusText}`;
      try {
        const errorJson = await response.json();
        if (errorJson?.detail) {
          errorMessage = typeof errorJson.detail === 'string'
            ? errorJson.detail
            : JSON.stringify(errorJson.detail);
        } else if (errorJson?.message) {
          errorMessage = errorJson.message;
        }
      } catch {
        // Fallback to text status
      }
      throw new ApiError(response.status, errorMessage);
    }

    if (response.status === 204) {
      return undefined as unknown as T;
    }

    return (await response.json()) as T;
  }
}
