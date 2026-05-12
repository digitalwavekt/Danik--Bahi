import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

const KEYS = {
  ACCESS: 'db_access_token',
  REFRESH: 'db_refresh_token',
  USER: 'db_user',
};

export const useAuthStore = create((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  hydrated: false,

  // Called once at app startup — loads from SecureStore
  hydrate: async () => {
    try {
      const [accessToken, refreshToken, userStr] = await Promise.all([
        SecureStore.getItemAsync(KEYS.ACCESS),
        SecureStore.getItemAsync(KEYS.REFRESH),
        SecureStore.getItemAsync(KEYS.USER),
      ]);
      const user = userStr ? JSON.parse(userStr) : null;
      set({ accessToken, refreshToken, user, hydrated: true });
    } catch {
      set({ hydrated: true });
    }
  },

  setAuth: async (user, accessToken, refreshToken) => {
    await Promise.all([
      SecureStore.setItemAsync(KEYS.ACCESS, accessToken),
      SecureStore.setItemAsync(KEYS.REFRESH, refreshToken),
      SecureStore.setItemAsync(KEYS.USER, JSON.stringify(user)),
    ]);
    set({ user, accessToken, refreshToken });
  },

  setAccessToken: async (accessToken) => {
    await SecureStore.setItemAsync(KEYS.ACCESS, accessToken);
    set({ accessToken });
  },

  updateRefreshToken: async (refreshToken) => {
    await SecureStore.setItemAsync(KEYS.REFRESH, refreshToken);
    set({ refreshToken });
  },

  clearAuth: async () => {
    await Promise.all([
      SecureStore.deleteItemAsync(KEYS.ACCESS),
      SecureStore.deleteItemAsync(KEYS.REFRESH),
      SecureStore.deleteItemAsync(KEYS.USER),
    ]);
    set({ user: null, accessToken: null, refreshToken: null });
  },

  isAuthenticated: () => !!get().accessToken && !!get().user,
  canEdit: () => ['super_admin', 'society_admin', 'editor'].includes(get().user?.role),
  isAuditor: () => get().user?.role === 'auditor',
}));
