import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { isAxiosError } from 'axios';
import { sessionStorage } from './sessionStorage';
import { UserProfile, EnergyLevel } from '../types';
import { AuthService } from '../services/api';

export interface AuthState {
  user: UserProfile | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  requiresSignIn: boolean;
  sessionRevision: number;
  hasCompletedOnboarding: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (email: string, pass: string) => Promise<boolean>;
  register: (email: string, pass: string, displayName: string, energy?: EnergyLevel) => Promise<boolean>;
  logout: () => void;
  requireSignIn: () => void;
  refreshSession: (revision: number) => Promise<boolean>;
  setEnergyLevel: (energy: EnergyLevel) => Promise<void>;
  completeOnboarding: (energy?: EnergyLevel) => Promise<void>;
  skipAuth: () => void;
  clearError: () => void;
}

const DEMO_USER: UserProfile = {
  id: 'guest-user-id',
  email: 'demo@orbit.app',
  displayName: 'ADHD Explorer',
  currentEnergyLevel: 'MEDIUM',
};

let pendingRefresh: { revision: number; promise: Promise<boolean> } | null = null;

const messageFrom = (error: unknown, fallback: string): string => {
  if (!isAxiosError<{ message?: string; data?: Partial<Record<'displayName' | 'email' | 'password', string>> }>(error)) {
    return fallback;
  }
  if (!error.response) return 'Chưa kết nối được với Orbit. Bạn có thể thử lại.';
  const { data: fields, message } = error.response.data ?? {};
  return fields?.displayName || fields?.email || fields?.password || message || fallback;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      requiresSignIn: false,
      sessionRevision: 0,
      hasCompletedOnboarding: false,
      isLoading: false,
      error: null,

      login: async (email: string, pass: string) => {
        if (get().isLoading) return false;
        const revision = get().sessionRevision;
        set({ isLoading: true, error: null });
        try {
          const authData = await AuthService.login({ email, password: pass });
          if (get().sessionRevision !== revision) return false;
          set({
            user: authData.user,
            token: authData.accessToken,
            refreshToken: authData.refreshToken,
            isAuthenticated: true,
            requiresSignIn: false,
            sessionRevision: revision + 1,
            hasCompletedOnboarding: true,
            isLoading: false,
            error: null,
          });
          return true;
        } catch (error) {
          if (get().sessionRevision === revision) {
            set({ isLoading: false, error: messageFrom(error, 'Chưa đăng nhập được. Hãy thử lại.') });
          }
          return false;
        }
      },

      register: async (email: string, pass: string, displayName: string, energy: EnergyLevel = 'MEDIUM') => {
        if (get().isLoading) return false;
        const revision = get().sessionRevision;
        set({ isLoading: true, error: null });
        try {
          await AuthService.register({
            email,
            password: pass,
            displayName,
            initialEnergyLevel: energy,
          });
          if (get().sessionRevision !== revision) return false;
          set({ isLoading: false, error: null });
          return true;
        } catch (error) {
          if (get().sessionRevision === revision) {
            set({ isLoading: false, error: messageFrom(error, 'Chưa tạo được tài khoản. Hãy thử lại.') });
          }
          return false;
        }
      },

      logout: () => {
        set((state) => ({
          user: null, token: null, refreshToken: null,
          isAuthenticated: false, isLoading: false, requiresSignIn: true,
          sessionRevision: state.sessionRevision + 1, error: null,
        }));
      },

      requireSignIn: () => {
        if (get().requiresSignIn) return;
        set((state) => ({
          user: null, token: null, refreshToken: null, isAuthenticated: false, isLoading: false,
          requiresSignIn: true, sessionRevision: state.sessionRevision + 1,
          error: null,
        }));
      },

      refreshSession: async (revision) => {
        const session = get();
        if (session.sessionRevision !== revision || !session.refreshToken) return false;
        if (pendingRefresh?.revision === revision) return pendingRefresh.promise;

        const promise = AuthService.refreshToken(session.refreshToken).then((refreshed) => {
          if (get().sessionRevision !== revision) return false;
          if (refreshed.user.id !== session.user?.id) {
            get().requireSignIn();
            return false;
          }
          set({ token: refreshed.accessToken, refreshToken: refreshed.refreshToken });
          return true;
        }).catch((error: unknown) => {
          if (isAxiosError(error) && [401, 403].includes(error.response?.status ?? 0)) {
            if (get().sessionRevision === revision) get().requireSignIn();
            return false;
          }
          throw error;
        }).finally(() => {
          if (pendingRefresh?.revision === revision) pendingRefresh = null;
        });
        pendingRefresh = { revision, promise };
        return promise;
      },

      setEnergyLevel: async (energy: EnergyLevel) => {
        const revision = get().sessionRevision;
        // Cập nhật lạc quan
        set((state) => ({
          user: state.user
            ? { ...state.user, currentEnergyLevel: energy }
            : { ...DEMO_USER, currentEnergyLevel: energy },
        }));

        if (get().isAuthenticated && get().token) {
          try {
            const updated = await AuthService.updateEnergyLevel(energy);
            if (get().sessionRevision === revision) set({ user: updated });
          } catch (err: any) {
            console.warn('updateEnergyLevel offline sync (đã lưu tạm local):', err?.message);
          }
        }
      },

      completeOnboarding: async (energy: EnergyLevel = 'MEDIUM') => {
        set((state) => ({
          hasCompletedOnboarding: true,
          user: state.user || { ...DEMO_USER, currentEnergyLevel: energy },
        }));
      },

      skipAuth: () => {
        if (get().requiresSignIn) return;
        set((state) => ({
          hasCompletedOnboarding: true, user: DEMO_USER, token: null, refreshToken: null,
          isAuthenticated: false, sessionRevision: state.sessionRevision + 1, error: null,
        }));
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'orbit-auth-storage',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        requiresSignIn: state.requiresSignIn,
        hasCompletedOnboarding: state.hasCompletedOnboarding,
      }),
    }
  )
);
