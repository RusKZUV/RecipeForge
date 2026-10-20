/**
 * In-memory MockApiService implementing the service abstractions
 * Includes mock auth, token expiration, demo account, per-user isolation
 */

import {
  User,
  Profile,
  PantryItem,
  Recipe,
  ShoppingListItem,
  AuthResponse,
  AuthToken,
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
import {
  DEMO_USER,
  DEMO_USER_PASSWORD,
  INITIAL_DEMO_PANTRY,
  INITIAL_RECIPES,
} from './mockData';

interface UserRecord {
  user: User;
  password: string;
}

interface StoredToken {
  token: string;
  userId: string;
  expires_at: number;
}

export interface MockApiServiceOptions {
  tokenLifetimeMs?: number;
  clock?: () => number;
}

export class MockApiService implements ApiService {
  private users: Map<string, UserRecord> = new Map();
  private emailToUserId: Map<string, string> = new Map();
  private tokens: Map<string, StoredToken> = new Map();
  private pantryItems: PantryItem[] = [];
  private recipeItems: Recipe[] = [];
  private shoppingItems: ShoppingListItem[] = [];

  private tokenLifetimeMs: number;
  private customClock?: () => number;
  private timeOffsetMs: number = 0;

  readonly auth: AuthService;
  readonly pantry: PantryService;
  readonly recipes: RecipeService;
  readonly shopping: ShoppingService;

  constructor(options?: MockApiServiceOptions) {
    this.tokenLifetimeMs = options?.tokenLifetimeMs ?? 60 * 60 * 1000; // 1 hour default
    this.customClock = options?.clock;

    // Create modular sub-services bound to this instance
    this.auth = {
      register: this.register.bind(this),
      login: this.login.bind(this),
      loginAsDemo: this.loginAsDemo.bind(this),
      logout: this.logout.bind(this),
      getCurrentUser: this.getCurrentUser.bind(this),
      updateProfile: this.updateProfile.bind(this),
      deleteAccount: this.deleteAccount.bind(this),
    };

    this.pantry = {
      listItems: this.listPantryItems.bind(this),
      addItem: this.addPantryItem.bind(this),
      updateItem: this.updatePantryItem.bind(this),
      deleteItem: this.deletePantryItem.bind(this),
    };

    this.recipes = {
      listRecipes: this.listRecipes.bind(this),
      getRecipe: this.getRecipe.bind(this),
      createRecipe: this.createRecipe.bind(this),
      updateRecipe: this.updateRecipe.bind(this),
      deleteRecipe: this.deleteRecipe.bind(this),
    };

    this.shopping = {
      listItems: this.listShoppingItems.bind(this),
      addItem: this.addShoppingItem.bind(this),
      updateItem: this.updateShoppingItem.bind(this),
      deleteItem: this.deleteShoppingItem.bind(this),
      markBought: this.markShoppingItemBought.bind(this),
    };

    this.reset();
  }

  // --- Clock & Testing Utilities ---

  now(): number {
    const base = this.customClock ? this.customClock() : Date.now();
    return base + this.timeOffsetMs;
  }

  setClock(clockFn: () => number): void {
    this.customClock = clockFn;
    this.timeOffsetMs = 0;
  }

  advanceTime(ms: number): void {
    this.timeOffsetMs += ms;
  }

  expireToken(token: string): void {
    const cleanToken = this.stripBearer(token);
    const existing = this.tokens.get(cleanToken);
    if (existing) {
      existing.expires_at = this.now() - 1000;
    }
  }

  reset(): void {
    this.users.clear();
    this.emailToUserId.clear();
    this.tokens.clear();
    this.timeOffsetMs = 0;

    // Seed Demo User
    const demoUserCopy = JSON.parse(JSON.stringify(DEMO_USER));
    this.users.set(demoUserCopy.id, {
      user: demoUserCopy,
      password: DEMO_USER_PASSWORD,
    });
    this.emailToUserId.set(demoUserCopy.email.toLowerCase(), demoUserCopy.id);

    // Seed Demo Pantry
    this.pantryItems = JSON.parse(JSON.stringify(INITIAL_DEMO_PANTRY));

    // Seed Recipes
    this.recipeItems = JSON.parse(JSON.stringify(INITIAL_RECIPES));

    // Reset shopping
    this.shoppingItems = [];
  }

  private stripBearer(token: string): string {
    if (!token) return '';
    return token.startsWith('Bearer ') ? token.slice(7).trim() : token.trim();
  }

  private createToken(userId: string): AuthToken {
    const rawToken = `mock-token-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const expiresAt = this.now() + this.tokenLifetimeMs;
    this.tokens.set(rawToken, {
      token: rawToken,
      userId,
      expires_at: expiresAt,
    });
    return {
      access_token: rawToken,
      token_type: 'bearer',
      expires_at: expiresAt,
    };
  }

  authenticate(token: string): User {
    const cleanToken = this.stripBearer(token);
    if (!cleanToken) {
      throw new ApiError(401, 'Unauthorized: Token is missing', 'UNAUTHORIZED');
    }

    const storedToken = this.tokens.get(cleanToken);
    if (!storedToken) {
      throw new ApiError(401, 'Unauthorized: Invalid token', 'INVALID_TOKEN');
    }

    if (this.now() > storedToken.expires_at) {
      throw new ApiError(401, 'Unauthorized: Token has expired', 'TOKEN_EXPIRED');
    }

    const userRecord = this.users.get(storedToken.userId);
    if (!userRecord) {
      throw new ApiError(401, 'Unauthorized: User not found', 'USER_NOT_FOUND');
    }

    return JSON.parse(JSON.stringify(userRecord.user));
  }

  // --- Auth Service Methods ---

  async register(req: RegisterRequest): Promise<AuthResponse> {
    const email = (req.email || '').trim();
    if (!email || !req.password) {
      throw new ApiError(400, 'Email and password are required', 'VALIDATION_ERROR');
    }

    const normalizedEmail = email.toLowerCase();
    if (this.emailToUserId.has(normalizedEmail)) {
      throw new ApiError(409, 'User with this email already exists', 'USER_EXISTS');
    }

    const newUserId = `user-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const newUser: User = {
      id: newUserId,
      email,
      default_servings: req.default_servings ?? 1,
      dietary_filters: [],
      equipment: ['stovetop'],
      assumed_staples: {
        pepper: true,
        oil: true,
      },
      created_at: new Date(this.now()).toISOString(),
    };

    this.users.set(newUserId, {
      user: newUser,
      password: req.password,
    });
    this.emailToUserId.set(normalizedEmail, newUserId);

    const token = this.createToken(newUserId);
    return {
      user: JSON.parse(JSON.stringify(newUser)),
      token,
    };
  }

  async login(req: LoginRequest): Promise<AuthResponse> {
    const email = (req.email || '').trim().toLowerCase();
    const userId = this.emailToUserId.get(email);
    const userRecord = userId ? this.users.get(userId) : undefined;

    // Return generic error without disclosing whether email or password was incorrect
    if (!userRecord || userRecord.password !== req.password) {
      throw new ApiError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
    }

    const token = this.createToken(userRecord.user.id);
    return {
      user: JSON.parse(JSON.stringify(userRecord.user)),
      token,
    };
  }

  async loginAsDemo(): Promise<AuthResponse> {
    const demoRecord = this.users.get(DEMO_USER.id);
    if (!demoRecord) {
      // Re-seed demo user if deleted
      this.reset();
    }
    const token = this.createToken(DEMO_USER.id);
    return {
      user: JSON.parse(JSON.stringify(this.users.get(DEMO_USER.id)!.user)),
      token,
    };
  }

  async logout(token: string): Promise<void> {
    const cleanToken = this.stripBearer(token);
    if (cleanToken) {
      this.tokens.delete(cleanToken);
    }
  }

  async getCurrentUser(token: string): Promise<User> {
    return this.authenticate(token);
  }

  async updateProfile(token: string, profile: Partial<Profile>): Promise<User> {
    const user = this.authenticate(token);
    const userRecord = this.users.get(user.id);
    if (!userRecord) {
      throw new ApiError(404, 'User not found');
    }

    if (profile.default_servings !== undefined) {
      userRecord.user.default_servings = profile.default_servings;
    }
    if (profile.dietary_filters !== undefined) {
      userRecord.user.dietary_filters = [...profile.dietary_filters];
    }
    if (profile.equipment !== undefined) {
      userRecord.user.equipment = [...profile.equipment];
    }
    if (profile.assumed_staples !== undefined) {
      userRecord.user.assumed_staples = {
        ...userRecord.user.assumed_staples,
        ...profile.assumed_staples,
      };
    }

    return JSON.parse(JSON.stringify(userRecord.user));
  }

  async deleteAccount(token: string): Promise<void> {
    const user = this.authenticate(token);
    this.users.delete(user.id);
    this.emailToUserId.delete(user.email.toLowerCase());

    // Invalidate tokens
    for (const [t, record] of Array.from(this.tokens.entries())) {
      if (record.userId === user.id) {
        this.tokens.delete(t);
      }
    }

    // Cascade deletions
    this.pantryItems = this.pantryItems.filter((item) => item.user_id !== user.id);
    this.recipeItems = this.recipeItems.filter((item) => item.owner_id !== user.id);
    this.shoppingItems = this.shoppingItems.filter((item) => item.user_id !== user.id);
  }

  // --- Pantry Service Methods ---

  async listPantryItems(token: string): Promise<PantryItem[]> {
    const user = this.authenticate(token);
    return this.pantryItems
      .filter((item) => item.user_id === user.id)
      .map((item) => JSON.parse(JSON.stringify(item)));
  }

  async addPantryItem(token: string, req: CreatePantryItemRequest): Promise<PantryItem> {
    const user = this.authenticate(token);
    const nowIso = new Date(this.now()).toISOString();
    const newItem: PantryItem = {
      id: `pantry-item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      user_id: user.id,
      ingredient_id: req.ingredient_id ?? null,
      custom_name: req.custom_name ?? null,
      quantity: req.quantity,
      unit: req.unit,
      expires_on: req.expires_on ?? null,
      created_at: nowIso,
      updated_at: nowIso,
    };
    this.pantryItems.push(newItem);
    return JSON.parse(JSON.stringify(newItem));
  }

  async updatePantryItem(
    token: string,
    id: string,
    req: UpdatePantryItemRequest
  ): Promise<PantryItem> {
    const user = this.authenticate(token);
    const item = this.pantryItems.find((p) => p.id === id);

    if (!item) {
      throw new ApiError(404, 'Pantry item not found');
    }
    if (item.user_id !== user.id) {
      throw new ApiError(403, 'Forbidden: Resource belongs to another user');
    }

    if (req.quantity !== undefined) item.quantity = req.quantity;
    if (req.unit !== undefined) item.unit = req.unit;
    if (req.ingredient_id !== undefined) item.ingredient_id = req.ingredient_id;
    if (req.custom_name !== undefined) item.custom_name = req.custom_name;
    if (req.expires_on !== undefined) item.expires_on = req.expires_on;
    item.updated_at = new Date(this.now()).toISOString();

    return JSON.parse(JSON.stringify(item));
  }

  async deletePantryItem(token: string, id: string): Promise<void> {
    const user = this.authenticate(token);
    const index = this.pantryItems.findIndex((p) => p.id === id);

    if (index === -1) {
      throw new ApiError(404, 'Pantry item not found');
    }
    if (this.pantryItems[index].user_id !== user.id) {
      throw new ApiError(403, 'Forbidden: Resource belongs to another user');
    }

    this.pantryItems.splice(index, 1);
  }

  // --- Recipe Service Methods ---

  async listRecipes(
    token: string,
    filters?: RecipeFilterParams
  ): Promise<PaginatedResponse<Recipe>> {
    const user = this.authenticate(token);

    // Visible recipes: seed recipes (owner_id === null) + author's own recipes
    let visible = this.recipeItems.filter(
      (r) => r.is_seed || r.owner_id === user.id
    );

    if (filters?.query) {
      const q = filters.query.toLowerCase();
      visible = visible.filter((r) => r.title.toLowerCase().includes(q));
    }

    const total = visible.length;
    const offset = filters?.offset ?? 0;
    const limit = filters?.limit ?? 12;
    const paged = visible.slice(offset, offset + limit);

    return {
      items: JSON.parse(JSON.stringify(paged)),
      total,
      limit,
      offset,
    };
  }

  async getRecipe(token: string, id: string): Promise<Recipe> {
    const user = this.authenticate(token);
    const recipe = this.recipeItems.find((r) => r.id === id);

    if (!recipe) {
      throw new ApiError(404, 'Recipe not found');
    }

    if (!recipe.is_seed && recipe.owner_id !== user.id) {
      throw new ApiError(403, 'Forbidden: Resource belongs to another user');
    }

    return JSON.parse(JSON.stringify(recipe));
  }

  async createRecipe(token: string, req: CreateRecipeRequest): Promise<Recipe> {
    const user = this.authenticate(token);
    const newRecipe: Recipe = {
      id: `recipe-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      owner_id: user.id,
      is_seed: false,
      title: req.title,
      servings: req.servings,
      time_minutes: req.time_minutes,
      equipment: [...req.equipment],
      ingredients: JSON.parse(JSON.stringify(req.ingredients)),
      steps: JSON.parse(JSON.stringify(req.steps)),
      source: req.source ?? null,
      license_note: req.license_note ?? null,
    };

    this.recipeItems.push(newRecipe);
    return JSON.parse(JSON.stringify(newRecipe));
  }

  async updateRecipe(token: string, id: string, req: UpdateRecipeRequest): Promise<Recipe> {
    const user = this.authenticate(token);
    const recipe = this.recipeItems.find((r) => r.id === id);

    if (!recipe) {
      throw new ApiError(404, 'Recipe not found');
    }
    if (recipe.is_seed) {
      throw new ApiError(403, 'Forbidden: Cannot edit seed recipe');
    }
    if (recipe.owner_id !== user.id) {
      throw new ApiError(403, 'Forbidden: Resource belongs to another user');
    }

    if (req.title !== undefined) recipe.title = req.title;
    if (req.servings !== undefined) recipe.servings = req.servings;
    if (req.time_minutes !== undefined) recipe.time_minutes = req.time_minutes;
    if (req.equipment !== undefined) recipe.equipment = [...req.equipment];
    if (req.ingredients !== undefined) {
      recipe.ingredients = JSON.parse(JSON.stringify(req.ingredients));
    }
    if (req.steps !== undefined) {
      recipe.steps = JSON.parse(JSON.stringify(req.steps));
    }
    if (req.source !== undefined) recipe.source = req.source;
    if (req.license_note !== undefined) recipe.license_note = req.license_note;

    return JSON.parse(JSON.stringify(recipe));
  }

  async deleteRecipe(token: string, id: string): Promise<void> {
    const user = this.authenticate(token);
    const index = this.recipeItems.findIndex((r) => r.id === id);

    if (index === -1) {
      throw new ApiError(404, 'Recipe not found');
    }
    if (this.recipeItems[index].is_seed) {
      throw new ApiError(403, 'Forbidden: Cannot delete seed recipe');
    }
    if (this.recipeItems[index].owner_id !== user.id) {
      throw new ApiError(403, 'Forbidden: Resource belongs to another user');
    }

    this.recipeItems.splice(index, 1);
  }

  // --- Shopping Service Methods ---

  async listShoppingItems(token: string): Promise<ShoppingListItem[]> {
    const user = this.authenticate(token);
    return this.shoppingItems
      .filter((s) => s.user_id === user.id)
      .map((s) => JSON.parse(JSON.stringify(s)));
  }

  async addShoppingItem(
    token: string,
    req: CreateShoppingItemRequest
  ): Promise<ShoppingListItem> {
    const user = this.authenticate(token);
    const newItem: ShoppingListItem = {
      id: `shop-item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      user_id: user.id,
      ingredient_id: req.ingredient_id ?? null,
      custom_name: req.custom_name ?? null,
      quantity: req.quantity,
      unit: req.unit,
      source_recipes: req.source_recipes ? [...req.source_recipes] : [],
      servings: req.servings ?? 1,
      checked: false,
      estimated_price_kzt: req.estimated_price_kzt ?? null,
    };

    this.shoppingItems.push(newItem);
    return JSON.parse(JSON.stringify(newItem));
  }

  async updateShoppingItem(
    token: string,
    id: string,
    req: UpdateShoppingItemRequest
  ): Promise<ShoppingListItem> {
    const user = this.authenticate(token);
    const item = this.shoppingItems.find((s) => s.id === id);

    if (!item) {
      throw new ApiError(404, 'Shopping item not found');
    }
    if (item.user_id !== user.id) {
      throw new ApiError(403, 'Forbidden: Resource belongs to another user');
    }

    if (req.checked !== undefined) item.checked = req.checked;
    if (req.quantity !== undefined) item.quantity = req.quantity;
    if (req.unit !== undefined) item.unit = req.unit;
    if (req.ingredient_id !== undefined) item.ingredient_id = req.ingredient_id;
    if (req.custom_name !== undefined) item.custom_name = req.custom_name;
    if (req.source_recipes !== undefined) item.source_recipes = [...req.source_recipes];
    if (req.servings !== undefined) item.servings = req.servings;
    if (req.estimated_price_kzt !== undefined) {
      item.estimated_price_kzt = req.estimated_price_kzt;
    }

    return JSON.parse(JSON.stringify(item));
  }

  async deleteShoppingItem(token: string, id: string): Promise<void> {
    const user = this.authenticate(token);
    const index = this.shoppingItems.findIndex((s) => s.id === id);

    if (index === -1) {
      throw new ApiError(404, 'Shopping item not found');
    }
    if (this.shoppingItems[index].user_id !== user.id) {
      throw new ApiError(403, 'Forbidden: Resource belongs to another user');
    }

    this.shoppingItems.splice(index, 1);
  }

  async markShoppingItemBought(
    token: string,
    id: string,
    targetPantry?: Partial<CreatePantryItemRequest>
  ): Promise<void> {
    const user = this.authenticate(token);
    const index = this.shoppingItems.findIndex((s) => s.id === id);

    if (index === -1) {
      throw new ApiError(404, 'Shopping item not found');
    }
    const item = this.shoppingItems[index];
    if (item.user_id !== user.id) {
      throw new ApiError(403, 'Forbidden: Resource belongs to another user');
    }

    item.checked = true;

    // Move to pantry
    await this.addPantryItem(token, {
      ingredient_id: targetPantry?.ingredient_id ?? item.ingredient_id,
      custom_name: targetPantry?.custom_name ?? item.custom_name,
      quantity: targetPantry?.quantity ?? item.quantity,
      unit: targetPantry?.unit ?? item.unit,
      expires_on: targetPantry?.expires_on ?? null,
    });

    this.shoppingItems.splice(index, 1);
  }
}
