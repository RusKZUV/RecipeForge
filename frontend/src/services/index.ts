import { ApiService } from './types';
import { MockApiService } from './mockApi';
import { HttpApiService } from './httpApi';

let activeApiService: ApiService | null = null;

export interface ServiceFactoryConfig {
  useMock?: boolean;
  baseUrl?: string;
  forceNew?: boolean;
}

/**
 * Returns the ApiService singleton instance.
 * Switches between MockApiService and HttpApiService based on VITE_USE_MOCK_API
 * (defaults to true if unset).
 */
export function getApiService(config?: ServiceFactoryConfig): ApiService {
  if (config?.forceNew || !activeApiService) {
    const envValue = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_USE_MOCK_API : undefined;
    const useMock = config?.useMock ?? (envValue !== 'false');

    if (useMock) {
      activeApiService = new MockApiService();
    } else {
      const baseUrl =
        config?.baseUrl ||
        (typeof import.meta !== 'undefined' ? import.meta.env?.VITE_API_URL : undefined) ||
        'http://localhost:8091';
      activeApiService = new HttpApiService(baseUrl);
    }
  }

  return activeApiService;
}

/**
 * Resets the active singleton service instance (useful for unit tests).
 */
export function resetApiService(): void {
  activeApiService = null;
}

export * from './types';
export * from './mockApi';
export * from './httpApi';
export * from './mockData';
