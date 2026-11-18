import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface FocusTimerState {
  minutes: number;
  remainingSeconds: number;
  endsAt: number | null;
}

interface FocusSession {
  taskId: string;
  stepId?: string;
  mode: 'step' | 'pomodoro';
  timer?: FocusTimerState;
}

interface FocusState {
  workspaceOwner: string | null;
  savedSessions: Record<string, FocusSession>;
  bindWorkspace: (owner: string) => void;
  session: FocusSession | null;
  open: (taskId: string, stepId?: string) => void;
  selectMode: (mode: FocusSession['mode']) => void;
  advance: (stepId?: string) => void;
  setTimer: (timer?: FocusTimerState) => void;
  pause: () => void;
  clear: () => void;
}

export const secondsRemaining = (timer: FocusTimerState, now = Date.now()) =>
  timer.endsAt === null ? timer.remainingSeconds : Math.max(0, Math.ceil((timer.endsAt - now) / 1000));

export const useFocusStore = create<FocusState>()(
  persist(
    (set, get) => ({
      session: null,
      workspaceOwner: null,
      savedSessions: {},
      bindWorkspace: (owner) => {
        const current = get();
        if (current.workspaceOwner === owner) return;
        current.pause();
        const savedSessions = { ...current.savedSessions };
        const session = get().session;
        if (current.workspaceOwner && session) savedSessions[current.workspaceOwner] = session;
        const next = savedSessions[owner] ?? null;
        delete savedSessions[owner];
        set({ workspaceOwner: owner, savedSessions, session: next });
      },
      open: (taskId, stepId) => {
        const { session } = get();
        if (session?.taskId === taskId && (!stepId || stepId === session.stepId)) return;
        set({ session: { taskId, stepId, mode: stepId ? 'step' : 'pomodoro' } });
      },
      selectMode: (mode) => {
        const { session } = get();
        if (session && mode !== session.mode) set({ session: { ...session, mode, timer: undefined } });
      },
      advance: (stepId) => {
        const { session } = get();
        if (session) {
          set({ session: {
            ...session,
            stepId,
            mode: stepId ? session.mode : 'pomodoro',
            timer: session.mode === 'pomodoro' ? session.timer : undefined,
          } });
        }
      },
      setTimer: (timer) => {
        const { session } = get();
        if (session) set({ session: { ...session, timer } });
      },
      pause: () => {
        const timer = get().session?.timer;
        if (timer?.endsAt != null) {
          const remainingSeconds = secondsRemaining(timer);
          if (remainingSeconds > 0) get().setTimer({ ...timer, remainingSeconds, endsAt: null });
        }
      },
      clear: () => set({ session: null }),
    }),
    {
      name: 'orbit-focus-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ session, workspaceOwner, savedSessions }) => ({ session, workspaceOwner, savedSessions }),
    }
  )
);

export const formatTimer = (seconds: number) =>
  `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
