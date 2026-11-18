import { useSettingsStore } from '../store/useSettingsStore';

const common = {
  'Hôm nay': 'Today',
  'Bảng': 'Board',
  'Cài đặt': 'Settings',
  'Tập trung': 'Focus',
  'Chọn bảng': 'Choose a board',
  'Chờ làm': 'Waiting',
  'Đang làm': 'In progress',
  'Đã xong': 'Done',
  'Tên việc': 'Task name',
  'Ghi chú': 'Notes',
  'Các bước nhỏ': 'Small steps',
  'Bước tiếp theo': 'Next step',
  'Bắt đầu bước này': 'Start this step',
  'Tiếp tục': 'Continue',
  'Tiếp tục việc đang làm': 'Continue current task',
  'Hoàn thành việc': 'Complete task',
  'Mở lại': 'Reopen',
  'Đóng': 'Close',
  'Lưu': 'Save',
  'Hủy': 'Cancel',
  'Thử lại': 'Try again',
  'Đăng nhập': 'Sign in',
  'Tên hiển thị': 'Display name',
  'Thấp': 'Low',
  'Vừa': 'Medium',
  'Cao': 'High',
} as const;

type Translate = {
  (key: keyof typeof common): string;
  (vi: string, en: string): string;
};

const vietnamese: Translate = (vi: string) => vi;
const english: Translate = (vi: string, en?: string) => en ?? common[vi as keyof typeof common] ?? vi;

export function useLocale() {
  return useSettingsStore((state) => state.language === 'en' ? english : vietnamese);
}

export function deviceText(vi: string, en: string) {
  return useSettingsStore.getState().language === 'en' ? en : vi;
}

export function useEnergyLabels() {
  const t = useLocale();
  return { LOW: t('Thấp'), MEDIUM: t('Vừa'), HIGH: t('Cao') };
}
