import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,

      setAuth: (user, accessToken, refreshToken) => {
        set({ user, accessToken, refreshToken });
      },

      setAccessToken: (accessToken) => set({ accessToken }),

      clearAuth: () => set({ user: null, accessToken: null, refreshToken: null }),

      isAuthenticated: () => !!get().accessToken && !!get().user,

      isSuperAdmin: () => get().user?.role === 'super_admin',

      hasRole: (...roles) => roles.includes(get().user?.role),

      canEdit: () => ['super_admin', 'society_admin', 'editor'].includes(get().user?.role),

      isAuditor: () => get().user?.role === 'auditor',
    }),
    {
      name: 'dainik-bahi-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    }
  )
);
