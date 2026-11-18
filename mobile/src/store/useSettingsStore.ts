import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { EnergyLevel, SoundscapeType } from '../types';
import { SoundscapeService } from '../services/soundscape';

export type Language = 'vi' | 'en';

export interface SettingsState {
  language: Language;
  setLanguage: (language: Language) => void;
  defaultEnergyLevel: EnergyLevel;
  pomodoroMinutes: 15 | 25 | 45;
  soundscape: SoundscapeType;
  isSoundscapePlaying: boolean;
  hapticFeedbackEnabled: boolean;
  gentleNotificationsEnabled: boolean;
  hideRedAlerts: boolean;

  // Actions
  setDefaultEnergyLevel: (energy: EnergyLevel) => void;
  setPomodoroMinutes: (minutes: 15 | 25 | 45) => void;
  setSoundscape: (soundscape: SoundscapeType) => Promise<void>;
  toggleSoundscapePlaying: () => Promise<void>;
  stopSoundscape: () => Promise<void>;
  toggleHapticFeedback: () => void;
  toggleGentleNotifications: () => void;
  toggleHideRedAlerts: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      language: 'vi',
      setLanguage: (language) => set({ language }),
      defaultEnergyLevel: 'MEDIUM',
      pomodoroMinutes: 25,
      soundscape: 'BROWN_NOISE',
      isSoundscapePlaying: false,
      hapticFeedbackEnabled: true,
      gentleNotificationsEnabled: true,
      hideRedAlerts: true,

      setDefaultEnergyLevel: (energy: EnergyLevel) => {
        set({ defaultEnergyLevel: energy });
      },

      setPomodoroMinutes: (minutes: 15 | 25 | 45) => {
        set({ pomodoroMinutes: minutes });
      },

      setSoundscape: async (soundscape: SoundscapeType) => {
        const currentlyPlaying = get().isSoundscapePlaying;
        set({ soundscape });

        if (currentlyPlaying) {
          if (soundscape === 'NONE') {
            await SoundscapeService.stop();
            set({ isSoundscapePlaying: false });
          } else {
            await SoundscapeService.play(soundscape);
          }
        }
      },

      toggleSoundscapePlaying: async () => {
        const currentlyPlaying = get().isSoundscapePlaying;
        const currentSoundscape = get().soundscape;

        if (currentlyPlaying) {
          await SoundscapeService.stop();
          set({ isSoundscapePlaying: false });
        } else {
          const soundToPlay = currentSoundscape === 'NONE' ? 'BROWN_NOISE' : currentSoundscape;
          set({ soundscape: soundToPlay, isSoundscapePlaying: true });
          await SoundscapeService.play(soundToPlay);
        }
      },

      stopSoundscape: async () => {
        await SoundscapeService.stop();
        set({ isSoundscapePlaying: false });
      },

      toggleHapticFeedback: () => {
        set((state) => ({ hapticFeedbackEnabled: !state.hapticFeedbackEnabled }));
      },

      toggleGentleNotifications: () => {
        set((state) => ({ gentleNotificationsEnabled: !state.gentleNotificationsEnabled }));
      },

      toggleHideRedAlerts: () => {
        set((state) => ({ hideRedAlerts: !state.hideRedAlerts }));
      },
    }),
    {
      name: 'orbit-settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        language: state.language,
        defaultEnergyLevel: state.defaultEnergyLevel,
        pomodoroMinutes: state.pomodoroMinutes,
        soundscape: state.soundscape,
        hapticFeedbackEnabled: state.hapticFeedbackEnabled,
        gentleNotificationsEnabled: state.gentleNotificationsEnabled,
        hideRedAlerts: state.hideRedAlerts,
      }),
    }
  )
);
