import { describe, it, expect, beforeEach } from 'vitest';
import { MockApiService } from './mockApi';
import { ApiError } from './types';
import { DEMO_USER_EMAIL, DEMO_USER_PASSWORD } from './mockData';

describe('MockApiService Authentication & Token Flows', () => {
  let api: MockApiService;

  beforeEach(() => {
    api = new MockApiService();
  });

  it('allows registering a new user with email and password', async () => {
    const res = await api.auth.register({
      email: 'student@example.com',
      password: 'password123',
      default_servings: 2,
    });

    expect(res.user.id).toBeDefined();
    expect(res.user.email).toBe('student@example.com');
    expect(res.user.default_servings).toBe(2);
    expect(res.token.access_token).toBeDefined();
    expect(res.token.expires_at).toBeGreaterThan(Date.now());

    // Can fetch current user with the returned token
    const me = await api.auth.getCurrentUser(res.token.access_token);
    expect(me.id).toBe(res.user.id);
    expect(me.email).toBe('student@example.com');
  });

  it('handles case-insensitive email registration and prevents duplicate emails', async () => {
    await api.auth.register({
      email: 'DormCook@Example.com',
      password: 'password123',
    });

    await expect(
      api.auth.register({
        email: 'dormcook@example.com',
        password: 'anotherpassword',
      })
    ).rejects.toThrow(ApiError);
  });

  it('allows logging in with correct credentials', async () => {
    await api.auth.register({
      email: 'chef@dorm.kz',
      password: 'mypassword',
    });

    const loginRes = await api.auth.login({
      email: 'CHEF@DORM.KZ', // case-insensitive
      password: 'mypassword',
    });

    expect(loginRes.user.email).toBe('chef@dorm.kz');
    expect(loginRes.token.access_token).toBeDefined();
  });

  it('returns a generic error on authentication failure without disclosing which field was wrong', async () => {
    // Non-existent email
    await expect(
      api.auth.login({
        email: 'unknown@example.com',
        password: 'any-password',
      })
    ).rejects.toMatchObject({
      name: 'ApiError',
      status: 401,
      message: 'Invalid email or password',
    });

    // Existing demo user with wrong password
    await expect(
      api.auth.login({
        email: DEMO_USER_EMAIL,
        password: 'incorrect-password',
      })
    ).rejects.toMatchObject({
      name: 'ApiError',
      status: 401,
      message: 'Invalid email or password',
    });
  });

  it('provides a demo account preloaded with mock user and starter pantry items', async () => {
    const demoLogin = await api.auth.loginAsDemo();
    expect(demoLogin.user.email).toBe(DEMO_USER_EMAIL);

    // Can also log in with demo credentials via standard login
    const regularDemoLogin = await api.auth.login({
      email: DEMO_USER_EMAIL,
      password: DEMO_USER_PASSWORD,
    });
    expect(regularDemoLogin.user.id).toBe(demoLogin.user.id);

    // Starter pantry items should be preloaded for the demo user
    const pantry = await api.pantry.listItems(demoLogin.token.access_token);
    expect(pantry.length).toBe(8);
    expect(pantry.some((item) => item.ingredient_id === 'ing-eggs')).toBe(true);
    expect(pantry.some((item) => item.ingredient_id === 'ing-milk')).toBe(true);
  });

  it('invalidates tokens upon logout', async () => {
    const loginRes = await api.auth.loginAsDemo();
    const token = loginRes.token.access_token;

    // Token works
    const meBefore = await api.auth.getCurrentUser(token);
    expect(meBefore.id).toBe(loginRes.user.id);

    // Logout
    await api.auth.logout(token);

    // Subsequent access fails with 401
    await expect(api.auth.getCurrentUser(token)).rejects.toMatchObject({
      name: 'ApiError',
      status: 401,
    });
  });

  it('rejects protected methods with 401 on missing or invalid token', async () => {
    await expect(api.auth.getCurrentUser('')).rejects.toMatchObject({
      name: 'ApiError',
      status: 401,
    });

    await expect(api.pantry.listItems('non-existent-token')).rejects.toMatchObject({
      name: 'ApiError',
      status: 401,
    });
  });

  it('rejects protected methods with 401 when token has expired', async () => {
    let mockTime = 1000000;
    const testApi = new MockApiService({
      tokenLifetimeMs: 5000,
      clock: () => mockTime,
    });

    const authRes = await testApi.auth.loginAsDemo();
    const token = authRes.token.access_token;

    // Valid initially
    const me = await testApi.auth.getCurrentUser(token);
    expect(me.id).toBe(authRes.user.id);

    // Advance clock past expiration
    mockTime += 6000;

    await expect(testApi.auth.getCurrentUser(token)).rejects.toMatchObject({
      name: 'ApiError',
      status: 401,
      message: expect.stringContaining('expired'),
    });

    await expect(testApi.pantry.listItems(token)).rejects.toMatchObject({
      name: 'ApiError',
      status: 401,
      message: expect.stringContaining('expired'),
    });
  });

  it('allows explicitly expiring a token for test purposes', async () => {
    const loginRes = await api.auth.loginAsDemo();
    const token = loginRes.token.access_token;

    api.expireToken(token);

    await expect(api.auth.getCurrentUser(token)).rejects.toMatchObject({
      name: 'ApiError',
      status: 401,
    });
  });

  it('updates profile settings correctly', async () => {
    const reg = await api.auth.register({
      email: 'cook@test.kz',
      password: 'testpassword',
    });
    const token = reg.token.access_token;

    const updated = await api.auth.updateProfile(token, {
      default_servings: 3,
      dietary_filters: ['vegetarian', 'dairy_free'],
      equipment: ['stovetop', 'oven'],
      assumed_staples: { pepper: false, oil: true },
    });

    expect(updated.default_servings).toBe(3);
    expect(updated.dietary_filters).toEqual(['vegetarian', 'dairy_free']);
    expect(updated.equipment).toEqual(['stovetop', 'oven']);
    expect(updated.assumed_staples.pepper).toBe(false);

    const me = await api.auth.getCurrentUser(token);
    expect(me.default_servings).toBe(3);
  });

  it('deletes account and cascades associated data', async () => {
    const reg = await api.auth.register({
      email: 'delete-me@test.kz',
      password: 'testpassword',
    });
    const token = reg.token.access_token;

    await api.pantry.addItem(token, {
      ingredient_id: 'ing-eggs',
      quantity: 4,
      unit: 'pcs',
    });

    await api.auth.deleteAccount(token);

    // Token no longer valid
    await expect(api.auth.getCurrentUser(token)).rejects.toMatchObject({
      status: 401,
    });

    // Login fails
    await expect(
      api.auth.login({ email: 'delete-me@test.kz', password: 'testpassword' })
    ).rejects.toMatchObject({
      status: 401,
    });
  });
});

describe('MockApiService Per-User Isolation', () => {
  let api: MockApiService;
  let userAToken: string;
  let userBToken: string;

  beforeEach(async () => {
    api = new MockApiService();

    const userA = await api.auth.register({
      email: 'userA@example.com',
      password: 'passwordA',
    });
    userAToken = userA.token.access_token;

    const userB = await api.auth.register({
      email: 'userB@example.com',
      password: 'passwordB',
    });
    userBToken = userB.token.access_token;
  });

  it('enforces pantry isolation: user B cannot view, edit, or delete user A pantry items', async () => {
    // User A adds an item
    const itemA = await api.pantry.addItem(userAToken, {
      ingredient_id: 'ing-eggs',
      quantity: 10,
      unit: 'pcs',
      expires_on: '2026-10-25',
    });

    // User B's pantry does not list user A's item
    const userBPantry = await api.pantry.listItems(userBToken);
    expect(userBPantry.find((i) => i.id === itemA.id)).toBeUndefined();

    // User B cannot update user A's item (403 Forbidden)
    await expect(
      api.pantry.updateItem(userBToken, itemA.id, { quantity: 99 })
    ).rejects.toMatchObject({
      name: 'ApiError',
      status: 403,
    });

    // User B cannot delete user A's item (403 Forbidden)
    await expect(api.pantry.deleteItem(userBToken, itemA.id)).rejects.toMatchObject({
      name: 'ApiError',
      status: 403,
    });

    // Item A is still unchanged for user A
    const userAPantry = await api.pantry.listItems(userAToken);
    expect(userAPantry.find((i) => i.id === itemA.id)?.quantity).toBe(10);
  });

  it('enforces shopping list isolation: user B cannot modify user A shopping items', async () => {
    const shopA = await api.shopping.addItem(userAToken, {
      ingredient_id: 'ing-rice',
      quantity: 500,
      unit: 'g',
      estimated_price_kzt: 225,
    });

    const userBShopping = await api.shopping.listItems(userBToken);
    expect(userBShopping.find((i) => i.id === shopA.id)).toBeUndefined();

    await expect(
      api.shopping.updateItem(userBToken, shopA.id, { checked: true })
    ).rejects.toMatchObject({
      name: 'ApiError',
      status: 403,
    });

    await expect(api.shopping.deleteItem(userBToken, shopA.id)).rejects.toMatchObject({
      name: 'ApiError',
      status: 403,
    });
  });

  it('enforces recipe isolation: user B cannot view, edit, or delete user A private recipe', async () => {
    const recipeA = await api.recipes.createRecipe(userAToken, {
      title: 'Secret Family Pilaf',
      servings: 4,
      time_minutes: 60,
      equipment: ['stovetop'],
      ingredients: [{ ingredient_id: 'ing-rice', quantity: 500, unit: 'g', optional: false }],
      steps: [{ position: 1, text: 'Simmer slowly.', timer_seconds: 1800 }],
    });

    // Seed recipes are visible to everyone, but user A's private recipe is not visible in user B's list
    const userBRecipes = await api.recipes.listRecipes(userBToken);
    expect(userBRecipes.items.find((r) => r.id === recipeA.id)).toBeUndefined();

    // User B cannot retrieve private recipe directly
    await expect(api.recipes.getRecipe(userBToken, recipeA.id)).rejects.toMatchObject({
      name: 'ApiError',
      status: 403,
    });

    // User B cannot edit recipe A
    await expect(
      api.recipes.updateRecipe(userBToken, recipeA.id, { title: 'Hacked Recipe' })
    ).rejects.toMatchObject({
      name: 'ApiError',
      status: 403,
    });

    // User B cannot delete recipe A
    await expect(api.recipes.deleteRecipe(userBToken, recipeA.id)).rejects.toMatchObject({
      name: 'ApiError',
      status: 403,
    });
  });
});
