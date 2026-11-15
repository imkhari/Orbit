import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, EnergyLevel } from '../types';
import { AuthService } from '../services/api';

export interface AuthState {
  user: UserProfile | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  hasCompletedOnboarding: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (email: string, pass: string) => Promise<boolean>;
  register: (email: string, pass: string, displayName: string, energy?: EnergyLevel) => Promise<boolean>;
  logout: () => void;
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

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      hasCompletedOnboarding: false,
      isLoading: false,
      error: null,

      login: async (email: string, pass: string) => {
        set({ isLoading: true, error: null });
        try {
          const authData = await AuthService.login({ email, password: pass });
          set({
            user: authData.user,
            token: authData.accessToken,
            refreshToken: authData.refreshToken,
            isAuthenticated: true,
            hasCompletedOnboarding: true,
            isLoading: false,
            error: null,
          });
          return true;
        } catch (err: any) {
          const message =
            err?.response?.data?.message ||
            err?.message ||
            'Không thể đăng nhập. Vui lòng kiểm tra lại thông tin 🌿';
          set({ isLoading: false, error: message });
          return false;
        }
      },

      register: async (email: string, pass: string, displayName: string, energy: EnergyLevel = 'MEDIUM') => {
        set({ isLoading: true, error: null });
        try {
          const authData = await AuthService.register({
            email,
            password: pass,
            displayName,
            initialEnergyLevel: energy,
          });
          set({
            user: authData.user,
            token: authData.accessToken,
            refreshToken: authData.refreshToken,
            isAuthenticated: true,
            hasCompletedOnboarding: true,
            isLoading: false,
            error: null,
          });
          return true;
        } catch (err: any) {
          const message =
            err?.response?.data?.message ||
            err?.message ||
            'Không thể tạo tài khoản. Vui lòng thử lại nhé 🌿';
          set({ isLoading: false, error: message });
          return false;
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          error: null,
        });
      },

      setEnergyLevel: async (energy: EnergyLevel) => {
        // Cập nhật lạc quan
        set((state) => ({
          user: state.user
            ? { ...state.user, currentEnergyLevel: energy }
            : { ...DEMO_USER, currentEnergyLevel: energy },
        }));

        if (get().isAuthenticated && get().token) {
          try {
            const updated = await AuthService.updateEnergyLevel(energy);
            set({ user: updated });
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
        set({
          hasCompletedOnboarding: true,
          user: DEMO_USER,
          isAuthenticated: false,
          error: null,
        });
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'orbit-auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        hasCompletedOnboarding: state.hasCompletedOnboarding,
      }),
    }
  )
);
