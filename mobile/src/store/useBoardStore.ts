import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BoardResponse, CreateBoardRequest, UpdateBoardRequest } from '../types';
import { BoardService } from '../services/api';

export interface BoardState {
  boards: BoardResponse[];
  activeBoardId: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchBoards: () => Promise<void>;
  setActiveBoard: (boardId: string) => void;
  createBoard: (title: string, icon?: string, colorTheme?: string) => Promise<BoardResponse | null>;
  updateBoard: (boardId: string, updates: UpdateBoardRequest) => Promise<boolean>;
  archiveBoard: (boardId: string) => Promise<boolean>;
  deleteBoard: (boardId: string) => Promise<boolean>;
  clearError: () => void;
}

const DEFAULT_BOARDS: BoardResponse[] = [
  {
    id: 'board-default-study',
    title: 'Học Tập & Nghiên Cứu',
    icon: '🎓',
    colorTheme: 'sky',
    isArchived: false,
    position: 0,
    totalTasks: 4,
    doingTasks: 1,
    todoTasks: 2,
  },
  {
    id: 'board-default-work',
    title: 'Dự Án & Công Việc',
    icon: '💼',
    colorTheme: 'amber',
    isArchived: false,
    position: 1,
    totalTasks: 2,
    doingTasks: 0,
    todoTasks: 1,
  },
  {
    id: 'board-default-life',
    title: 'Đời Sống & Việc Nhà',
    icon: '🏠',
    colorTheme: 'emerald',
    isArchived: false,
    position: 2,
    totalTasks: 1,
    doingTasks: 0,
    todoTasks: 1,
  },
];

export const useBoardStore = create<BoardState>()(
  persist(
    (set, get) => ({
      boards: DEFAULT_BOARDS,
      activeBoardId: DEFAULT_BOARDS[0].id,
      isLoading: false,
      error: null,

      fetchBoards: async () => {
        set({ isLoading: true, error: null });
        try {
          const fetched = await BoardService.getBoards();
          if (fetched && fetched.length > 0) {
            const currentActive = get().activeBoardId;
            const stillExists = fetched.some((b) => b.id === currentActive);
            set({
              boards: fetched,
              activeBoardId: stillExists ? currentActive : fetched[0].id,
              isLoading: false,
            });
          } else {
            set({ boards: DEFAULT_BOARDS, isLoading: false });
          }
        } catch (err: any) {
          // Offline fallback
          console.warn('[useBoardStore] Failed to fetch boards from backend, using cached boards');
          set({ isLoading: false });
        }
      },

      setActiveBoard: (boardId: string) => {
        set({ activeBoardId: boardId });
      },

      createBoard: async (title: string, icon = '📋', colorTheme = 'sky') => {
        const currentActiveBoards = get().boards.filter((b) => !b.isArchived);
        if (currentActiveBoards.length >= 5) {
          set({
            error:
              'Không gian gọn gàng giúp tâm trí nhẹ nhõm! Bạn đang có 5 bảng hoạt động. Hãy lưu trữ bớt 1 bảng cũ để tạo bảng mới nhé. 🌿',
          });
          return null;
        }

        set({ isLoading: true, error: null });
        try {
          const newBoard = await BoardService.createBoard({ title, icon, colorTheme });
          set((state) => ({
            boards: [...state.boards, newBoard],
            activeBoardId: newBoard.id,
            isLoading: false,
          }));
          return newBoard;
        } catch (err: any) {
          const message =
            err?.response?.data?.message ||
            'Không thể tạo bảng mới lúc này. Vui lòng thử lại sau.';
          set({ error: message, isLoading: false });
          return null;
        }
      },

      updateBoard: async (boardId: string, updates: UpdateBoardRequest) => {
        set({ isLoading: true, error: null });
        try {
          const updated = await BoardService.updateBoard(boardId, updates);
          set((state) => ({
            boards: state.boards.map((b) => (b.id === boardId ? updated : b)),
            isLoading: false,
          }));
          return true;
        } catch (err: any) {
          const message =
            err?.response?.data?.message || 'Không thể cập nhật bảng.';
          set({ error: message, isLoading: false });
          return false;
        }
      },

      archiveBoard: async (boardId: string) => {
        set({ isLoading: true, error: null });
        try {
          await BoardService.archiveBoard(boardId);
          set((state) => {
            const nextBoards = state.boards.filter((b) => b.id !== boardId);
            const nextActive =
              state.activeBoardId === boardId
                ? (nextBoards[0]?.id ?? null)
                : state.activeBoardId;
            return {
              boards: nextBoards,
              activeBoardId: nextActive,
              isLoading: false,
            };
          });
          return true;
        } catch (err: any) {
          const message =
            err?.response?.data?.message || 'Không thể lưu trữ bảng.';
          set({ error: message, isLoading: false });
          return false;
        }
      },

      deleteBoard: async (boardId: string) => {
        set({ isLoading: true, error: null });
        try {
          await BoardService.deleteBoard(boardId);
          set((state) => {
            const nextBoards = state.boards.filter((b) => b.id !== boardId);
            const nextActive =
              state.activeBoardId === boardId
                ? (nextBoards[0]?.id ?? null)
                : state.activeBoardId;
            return {
              boards: nextBoards,
              activeBoardId: nextActive,
              isLoading: false,
            };
          });
          return true;
        } catch (err: any) {
          const message =
            err?.response?.data?.message || 'Không thể xóa bảng.';
          set({ error: message, isLoading: false });
          return false;
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'orbit-board-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        activeBoardId: state.activeBoardId,
      }),
    }
  )
);
