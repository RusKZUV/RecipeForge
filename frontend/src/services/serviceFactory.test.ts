import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { getApiService, resetApiService } from './index';
import { MockApiService } from './mockApi';
import { HttpApiService } from './httpApi';

describe('Service Factory (getApiService)', () => {
  beforeEach(() => {
    resetApiService();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns MockApiService by default when VITE_USE_MOCK_API is unset', () => {
    const service = getApiService({ forceNew: true });
    expect(service).toBeInstanceOf(MockApiService);
  });

  it('returns MockApiService when VITE_USE_MOCK_API is explicitly "true"', () => {
    vi.stubEnv('VITE_USE_MOCK_API', 'true');
    const service = getApiService({ forceNew: true });
    expect(service).toBeInstanceOf(MockApiService);
  });

  it('returns HttpApiService when VITE_USE_MOCK_API is "false"', () => {
    vi.stubEnv('VITE_USE_MOCK_API', 'false');
    const service = getApiService({ forceNew: true });
    expect(service).toBeInstanceOf(HttpApiService);
  });

  it('allows overriding mock switch via config parameter', () => {
    const mockService = getApiService({ useMock: true, forceNew: true });
    expect(mockService).toBeInstanceOf(MockApiService);

    const httpService = getApiService({ useMock: false, forceNew: true });
    expect(httpService).toBeInstanceOf(HttpApiService);
  });

  it('returns singleton instance across multiple calls without forceNew', () => {
    const first = getApiService();
    const second = getApiService();
    expect(first).toBe(second);
  });
});
