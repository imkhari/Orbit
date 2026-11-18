import React, { useRef, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBoardStore } from '../store/useBoardStore';
import { useTaskStore } from '../store/useTaskStore';
import { BoardResponse } from '../types';
import { ActionButton, ScreenHeader } from '../ui/Controls';
import { useLocale } from '../ui/locale';
import { colors } from '../ui/theme';

const icons = ['🎓', '💼', '🏠', '🚀', '🎨', '📚', '💡', '🌱'];

export function BoardSwitcherModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const t = useLocale();
  const { boards, activeBoardId, setActiveBoard, createBoard, archiveBoard, deleteBoard } = useBoardStore();
  const [mode, setMode] = useState<'choose' | 'manage' | 'create'>('choose');
  const [title, setTitle] = useState('');
  const [icon, setIcon] = useState(icons[0]);
  const [confirm, setConfirm] = useState<{ board: BoardResponse; action: 'archive' | 'delete' } | null>(null);
  const [confirmation, setConfirmation] = useState('');
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const running = useRef(false);
  if (!visible) return null;

  const active = boards.filter((board) => !board.isArchived);
  const selected = active.find((board) => board.id === activeBoardId) ?? active[0];
  const keyword = t('XÓA', 'DELETE');
  const clearConfirmation = () => { setConfirm(null); setConfirmation(''); setFailed(false); };
  const back = () => {
    if (busy) return;
    if (confirm) clearConfirmation();
    else if (mode === 'create') { setMode('manage'); setFailed(false); }
    else if (mode === 'manage') { setMode('choose'); setFailed(false); }
    else onClose();
  };
  const run = async (action: () => Promise<boolean>) => {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    setFailed(false);
    try { setFailed(!await action()); }
    finally { running.current = false; setBusy(false); }
  };
  const create = () => void run(async () => {
    Keyboard.dismiss();
    const created = await createBoard(title.trim(), icon);
    if (created) { setTitle(''); setMode('choose'); }
    return !!created;
  });
  const apply = () => void run(async () => {
    if (!confirm || (confirm.action === 'delete' && confirmation.trim().toUpperCase() !== keyword)) return false;
    Keyboard.dismiss();
    const ok = await (confirm.action === 'archive' ? archiveBoard : deleteBoard)(confirm.board.id);
    if (ok) clearConfirmation();
    if (ok && confirm.action === 'delete') void useTaskStore.getState().fetchTasks();
    return ok;
  });

  return (
    <Modal visible transparent animationType="none" onRequestClose={back}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <SafeAreaView style={styles.sheet} edges={['bottom', 'left', 'right']}>
          <ScreenHeader onClose={back} title={confirm ? (confirm.action === 'archive' ? t('Lưu trữ bảng', 'Archive board') : t('Xóa bảng', 'Delete board'))
            : mode === 'create' ? t('Tạo bảng', 'New board') : mode === 'manage' ? t('Quản lý bảng', 'Manage boards') : t('Chọn bảng')} />
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
            {confirm ? (
              <>
                <Text style={styles.label}>{confirm.board.title}</Text>
                <Text style={styles.muted}>{confirm.action === 'archive'
                  ? t('Bảng sẽ được ẩn. Các việc vẫn được lưu.', 'The board will be hidden. Its tasks stay saved.')
                  : t('Bảng và các việc trong bảng sẽ bị xóa.', 'The board and its tasks will be deleted.')}</Text>
                {confirm.action === 'delete' && <TextInput value={confirmation} onChangeText={setConfirmation}
                  placeholder={t(`Gõ ${keyword} để xác nhận`, `Type ${keyword} to confirm`)} placeholderTextColor={colors.muted}
                  accessibilityLabel={t('Xác nhận xóa', 'Delete confirmation')} style={styles.input} />}
                <ActionButton label={confirm.action === 'archive' ? t('Lưu trữ', 'Archive') : t('Xác nhận xóa', 'Confirm deletion')}
                  disabled={busy || (confirm.action === 'delete' && confirmation.trim().toUpperCase() !== keyword)} onPress={apply} />
                <ActionButton label={t('Hủy')} variant="quiet" disabled={busy} onPress={clearConfirmation} />
              </>
            ) : mode === 'create' ? (
              <>
                <TextInput value={title} onChangeText={setTitle} style={styles.input} maxLength={50} editable={!busy}
                  placeholder={t('Tên bảng', 'Board name')} placeholderTextColor={colors.muted} accessibilityLabel={t('Tên bảng', 'Board name')} />
                <View style={styles.icons}>{icons.map((value) => (
                  <Pressable key={value} accessibilityLabel={t(`Biểu tượng ${value}`, `${value} icon`)} accessibilityRole="radio"
                    accessibilityState={{ checked: icon === value }} onPress={() => setIcon(value)}
                    style={[styles.icon, icon === value && styles.selected]}><Text>{value}</Text></Pressable>
                ))}</View>
                <ActionButton label={t('Tạo bảng', 'Create board')} disabled={title.trim().length < 2 || busy} onPress={create} />
              </>
            ) : mode === 'manage' ? (
              <>
                {boards.map((board) => (
                  <View key={board.id} style={styles.row}>
                    <Text style={styles.label}>{board.title}</Text>
                    {board.isArchived && <Text style={styles.muted}>{t('Đã lưu trữ', 'Archived')}</Text>}
                    <View style={styles.actions}>
                      {!board.isArchived && active.length > 1 && <ActionButton variant="quiet" label={t('Lưu trữ', 'Archive')}
                        onPress={() => setConfirm({ board, action: 'archive' })} />}
                      {(board.isArchived || active.length > 1) && <ActionButton variant="quiet" label={t('Xóa bảng', 'Delete board')}
                        onPress={() => setConfirm({ board, action: 'delete' })} />}
                    </View>
                  </View>
                ))}
                {active.length >= 5 && <Text style={styles.muted}>{t('Lưu trữ một bảng trước khi tạo bảng mới.', 'Archive a board before creating another.')}</Text>}
                <ActionButton label={t('Tạo bảng', 'New board')} variant="secondary" icon="plus" disabled={active.length >= 5}
                  onPress={() => setMode('create')} />
              </>
            ) : (
              <>
                {active.map((board) => (
                  <Pressable key={board.id} accessibilityRole="radio" accessibilityState={{ checked: selected?.id === board.id }}
                    style={[styles.row, styles.choice, selected?.id === board.id && styles.selected]}
                    onPress={() => { setActiveBoard(board.id); onClose(); }}>
                    <Text style={styles.label}>{board.title}</Text>
                    {selected?.id === board.id && <Text style={styles.check}>✓</Text>}
                  </Pressable>
                ))}
                <ActionButton label={t('Quản lý bảng', 'Manage boards')} variant="quiet" onPress={() => setMode('manage')} />
              </>
            )}
            {failed && <Text style={styles.warning} accessibilityLiveRegion="polite">{t('Chưa cập nhật được bảng. Hãy thử lại.', 'Could not update the board. Try again.')}</Text>}
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(2, 6, 23, 0.72)' },
  sheet: { maxHeight: '88%', backgroundColor: colors.surface, paddingHorizontal: 16, paddingTop: 10,
    borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  content: { gap: 8, paddingTop: 14, paddingBottom: 16 },
  row: { minHeight: 52, paddingHorizontal: 12, paddingVertical: 10, justifyContent: 'center', gap: 6, borderRadius: 12,
    backgroundColor: colors.canvas, borderColor: colors.border, borderWidth: 1 },
  choice: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  selected: { borderColor: colors.accent },
  label: { color: colors.text, fontSize: 16, fontWeight: '600', flexShrink: 1 },
  muted: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  check: { color: colors.accent, fontSize: 20 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  icons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  icon: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: 10, borderColor: colors.outline },
  warning: { color: colors.warning, fontSize: 14 },
  input: { minHeight: 48, color: colors.text, fontSize: 16, borderRadius: 12, borderWidth: 1, borderColor: colors.outline,
    backgroundColor: colors.canvas, paddingHorizontal: 12 },
});
