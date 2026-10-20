import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Profile, LoginRequest, RegisterRequest } from '../types';
import { getApiService } from '../services';
import { ApiError } from '../services/types';

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (req: LoginRequest) => Promise<void>;
  register: (req: RegisterRequest) => Promise<void>;
  loginAsDemo: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (profile: Partial<Profile>) => Promise<User>;
  deleteAccount: () => Promise<void>;
  onUnauthorized: () => void;
  formDrafts: Record<string, any>;
  setFormDraft: (key: string, value: any) => void;
  clearFormDraft: (key: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'recipeforge_token';
const DRAFTS_KEY = 'recipeforge_form_drafts';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [formDrafts, setFormDrafts] = useState<Record<string, any>>(() => {
    try {
      const stored = localStorage.getItem(DRAFTS_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const setFormDraft = useCallback((key: string, value: any) => {
    setFormDrafts((prev) => {
      const updated = { ...prev, [key]: value };
      try {
        localStorage.setItem(DRAFTS_KEY, JSON.stringify(updated));
      } catch {
        // Ignore storage errors
      }
      return updated;
    });
  }, []);

  const clearFormDraft = useCallback((key: string) => {
    setFormDrafts((prev) => {
      const updated = { ...prev };
      delete updated[key];
      try {
        localStorage.setItem(DRAFTS_KEY, JSON.stringify(updated));
      } catch {
        // Ignore storage errors
      }
      return updated;
    });
  }, []);

  const onUnauthorized = useCallback(() => {
    // 401 handling: user is redirected to login by clearing token & user,
    // but in-progress form inputs in formDrafts are PRESERVED!
    setToken(null);
    setUser(null);
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      // Ignore
    }
  }, []);

  // Restore session if token exists
  useEffect(() => {
    let isMounted = true;
    const api = getApiService();

    if (token) {
      api.auth
        .getCurrentUser(token)
        .then((currentUser) => {
          if (isMounted) {
            setUser(currentUser);
            setIsLoading(false);
          }
        })
        .catch((err) => {
          if (isMounted) {
            if (err instanceof ApiError && err.status === 401) {
              onUnauthorized();
            } else {
              setToken(null);
              setUser(null);
            }
            setIsLoading(false);
          }
        });
    } else {
      setIsLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [token, onUnauthorized]);

  const login = useCallback(async (req: LoginRequest) => {
    const api = getApiService();
    const res = await api.auth.login({
      email: req.email.trim().toLowerCase(),
      password: req.password,
    });
    setToken(res.token.access_token);
    setUser(res.user);
    try {
      localStorage.setItem(TOKEN_KEY, res.token.access_token);
    } catch {
      // Ignore
    }
  }, []);

  const register = useCallback(async (req: RegisterRequest) => {
    const api = getApiService();
    const res = await api.auth.register({
      email: req.email.trim().toLowerCase(),
      password: req.password,
      default_servings: req.default_servings,
    });
    setToken(res.token.access_token);
    setUser(res.user);
    try {
      localStorage.setItem(TOKEN_KEY, res.token.access_token);
    } catch {
      // Ignore
    }
  }, []);

  const loginAsDemo = useCallback(async () => {
    const api = getApiService();
    const res = await api.auth.loginAsDemo();
    setToken(res.token.access_token);
    setUser(res.user);
    try {
      localStorage.setItem(TOKEN_KEY, res.token.access_token);
    } catch {
      // Ignore
    }
  }, []);

  const logout = useCallback(async () => {
    const api = getApiService();
    if (token) {
      try {
        await api.auth.logout(token);
      } catch {
        // Logout locally even if service call fails
      }
    }
    setToken(null);
    setUser(null);
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      // Ignore
    }
  }, [token]);

  const updateProfile = useCallback(
    async (profile: Partial<Profile>): Promise<User> => {
      if (!token) throw new ApiError(401, 'Unauthorized');
      const api = getApiService();
      try {
        const updated = await api.auth.updateProfile(token, profile);
        setUser(updated);
        return updated;
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          onUnauthorized();
        }
        throw err;
      }
    },
    [token, onUnauthorized]
  );

  const deleteAccount = useCallback(async () => {
    if (!token) throw new ApiError(401, 'Unauthorized');
    const api = getApiService();
    try {
      await api.auth.deleteAccount(token);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        onUnauthorized();
        return;
      }
      throw err;
    }
    setToken(null);
    setUser(null);
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      // Ignore
    }
  }, [token, onUnauthorized]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        loginAsDemo,
        logout,
        updateProfile,
        deleteAccount,
        onUnauthorized,
        formDrafts,
        setFormDraft,
        clearFormDraft,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
