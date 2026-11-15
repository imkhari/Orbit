import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  FlatList,
  TextInput,
  StyleSheet,
  Platform,
  Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { BoardResponse } from '../types';
import { useBoardStore } from '../store/useBoardStore';
import { useTaskStore } from '../store/useTaskStore';

interface BoardSwitcherModalProps {
  visible: boolean;
  onClose: () => void;
}

const EMOJI_OPTIONS = ['🎓', '💼', '🏠', '🚀', '🎨', '📚', '💡', '🌱'];

export const BoardSwitcherModal: React.FC<BoardSwitcherModalProps> = ({
  visible,
  onClose,
}) => {
  const {
    boards,
    activeBoardId,
    setActiveBoard,
    createBoard,
    archiveBoard,
    deleteBoard,
    error,
    clearError,
  } = useBoardStore();

  const { fetchTasks } = useTaskStore();

  // Tạo bảng mới state
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState(EMOJI_OPTIONS[0]);

  // Xóa bảng modal state (Edge Case 11)
  const [deletingBoard, setDeletingBoard] = useState<BoardResponse | null>(null);
  const [confirmDeleteText, setConfirmDeleteText] = useState('');

  const activeBoards = boards.filter((b) => !b.isArchived);
  const activeCount = activeBoards.length;
  const remainingSlots = Math.max(0, 5 - activeCount);
  const isLimitReached = activeCount >= 5;

  const handleSelectBoard = (board: BoardResponse) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setActiveBoard(board.id);
    fetchTasks(board.id);
    onClose();
  };

  const handleCreateBoard = async () => {
    if (!newTitle.trim()) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    const created = await createBoard(newTitle.trim(), selectedEmoji);
    if (created) {
      setNewTitle('');
      setIsCreating(false);
      fetchTasks(created.id);
    }
  };

  const handleArchiveBoard = (board: BoardResponse) => {
    if (activeCount <= 1) {
      Alert.alert(
        'Không thể lưu trữ',
        'Bạn cần giữ lại ít nhất 1 bảng công việc hoạt động để quản lý nhiệm vụ nhé 🌿'
      );
      return;
    }

    Alert.alert(
      'Lưu trữ bảng công việc?',
      `Bảng "${board.title}" sẽ được ẩn đi để không gian gọn gàng hơn. Mọi công việc bên trong vẫn được giữ an toàn.`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Lưu Trữ',
          onPress: async () => {
            if (Platform.OS !== 'web') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            await archiveBoard(board.id);
          },
        },
      ]
    );
  };

  const handleConfirmDelete = async () => {
    if (!deletingBoard) return;
    if (confirmDeleteText.trim().toUpperCase() !== 'XÓA') return;

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    await deleteBoard(deletingBoard.id);
    setDeletingBoard(null);
    setConfirmDeleteText('');
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View style={styles.sheetContainer}>
              {/* Header kéo xuống */}
              <TouchableOpacity
                style={styles.dragHandleContainer}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <View style={styles.dragHandle} />
                <Text style={styles.closeHint}>GẠT XUỐNG ĐỂ ĐÓNG ▾</Text>
              </TouchableOpacity>

              {/* Tiêu đề & Đếm Slot */}
              <View style={styles.header}>
                <View style={styles.titleRow}>
                  <Text style={styles.title}>Danh Sách Bảng Công Việc</Text>
                  <View style={styles.slotBadge}>
                    <Text style={styles.slotBadgeText}>
                      {activeCount}/5 Bảng
                    </Text>
                  </View>
                </View>
                <Text style={styles.subtitle}>
                  Chọn ngữ cảnh bạn muốn tập trung lúc này 🌿
                </Text>
              </View>

              {/* Thông báo lỗi nếu có */}
              {error && (
                <View style={styles.noticeBox}>
                  <Text style={styles.noticeText}>{error}</Text>
                  <TouchableOpacity onPress={clearError} style={styles.dismissBtn}>
                    <Text style={styles.dismissBtnText}>Đã hiểu</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Danh sách Bảng */}
              <FlatList
                data={activeBoards}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => {
                  const isActive = item.id === activeBoardId;
                  const total = item.totalTasks ?? 0;
                  const doing = item.doingTasks ?? 0;
                  const todo = item.todoTasks ?? 0;

                  return (
                    <TouchableOpacity
                      style={[
                        styles.boardCard,
                        isActive && styles.boardCardActive,
                      ]}
                      onPress={() => handleSelectBoard(item)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.boardCardLeft}>
                        <View style={styles.iconCircle}>
                          <Text style={styles.boardIcon}>{item.icon || '📋'}</Text>
                        </View>
                        <View style={styles.boardInfo}>
                          <View style={styles.nameRow}>
                            <Text
                              style={[
                                styles.boardTitle,
                                isActive && styles.boardTitleActive,
                              ]}
                              numberOfLines={1}
                            >
                              {item.title}
                            </Text>
                            {isActive && (
                              <View style={styles.activePill}>
                                <Text style={styles.activePillText}>Đang xem</Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.boardStats}>
                            {todo} việc cần làm • {doing} việc đang làm
                          </Text>
                        </View>
                      </View>

                      {/* Nút lưu trữ & xóa */}
                      <View style={styles.boardActions}>
                        <TouchableOpacity
                          style={styles.actionBtn}
                          onPress={() => handleArchiveBoard(item)}
                          accessibilityLabel="Lưu trữ bảng"
                        >
                          <Text style={styles.actionBtnIcon}>📦</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.actionBtn}
                          onPress={() => {
                            setDeletingBoard(item);
                            setConfirmDeleteText('');
                          }}
                          accessibilityLabel="Xóa bảng"
                        >
                          <Text style={styles.actionBtnIcon}>🗑️</Text>
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  );
                }}
              />

              {/* Phần tạo bảng mới hoặc Cảnh báo chạm giới hạn 5 bảng (Edge Case 07) */}
              <View style={styles.footerSection}>
                {isLimitReached ? (
                  <View style={styles.limitAlertBox}>
                    <Text style={styles.limitAlertTitle}>
                      🌿 Giữ gìn sự tinh gọn cho tâm trí
                    </Text>
                    <Text style={styles.limitAlertDesc}>
                      Bạn đang có 5 bảng hoạt động. Hãy bấm nút 📦 để lưu trữ bớt
                      1 bảng cũ trước khi tạo bảng mới nhé.
                    </Text>
                  </View>
                ) : isCreating ? (
                  <View style={styles.createCard}>
                    <Text style={styles.createTitle}>Tạo Bảng Mới</Text>

                    {/* Emoji selector */}
                    <View style={styles.emojiRow}>
                      {EMOJI_OPTIONS.map((emoji) => (
                        <TouchableOpacity
                          key={emoji}
                          style={[
                            styles.emojiBtn,
                            selectedEmoji === emoji && styles.emojiBtnSelected,
                          ]}
                          onPress={() => setSelectedEmoji(emoji)}
                          hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                          accessible={true}
                          accessibilityRole="button"
                          accessibilityLabel={`Chọn biểu tượng ${emoji}`}
                        >
                          <Text style={styles.emojiText}>{emoji}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    {/* Title Input */}
                    <TextInput
                      style={styles.input}
                      placeholder="Tên bảng (VD: Khởi Nghiệp, Việc Nhà...)"
                      placeholderTextColor="#64748B"
                      value={newTitle}
                      onChangeText={setNewTitle}
                      maxLength={50}
                      autoFocus
                    />

                    {/* Buttons */}
                    <View style={styles.createActions}>
                      <TouchableOpacity
                        style={styles.cancelBtn}
                        onPress={() => {
                          setIsCreating(false);
                          setNewTitle('');
                        }}
                      >
                        <Text style={styles.cancelBtnText}>Hủy</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.submitBtn,
                          !newTitle.trim() && styles.submitBtnDisabled,
                        ]}
                        disabled={!newTitle.trim()}
                        onPress={handleCreateBoard}
                      >
                        <Text style={styles.submitBtnText}>Tạo Bảng</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.addBoardBtn}
                    onPress={() => setIsCreating(true)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.addBoardBtnText}>
                      + Tạo Bảng Mới (Còn lại {remainingSlots} slot)
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>

      {/* Modal Xác Nhận Xóa Bảng (Edge Case 11: Chống xóa bốc đồng ADHD) */}
      {deletingBoard && (
        <Modal transparent animationType="fade" visible={!!deletingBoard}>
          <View style={styles.confirmBackdrop}>
            <View style={styles.confirmCard}>
              <Text style={styles.confirmTitle}>Xóa Bảng Công Việc?</Text>
              <Text style={styles.confirmDesc}>
                Bảng "{deletingBoard.title}" đang chứa{' '}
                <Text style={styles.highlightText}>
                  {deletingBoard.totalTasks ?? 0} công việc
                </Text>
                . Thao tác này không thể hoàn tác.
              </Text>
              <Text style={styles.confirmInstruction}>
                Để tránh bấm nhầm do bốc đồng, hãy gõ chữ{' '}
                <Text style={styles.keyword}>XÓA</Text> vào ô dưới đây:
              </Text>

              <TextInput
                style={styles.confirmInput}
                placeholder="Gõ chữ XÓA"
                placeholderTextColor="#64748B"
                value={confirmDeleteText}
                onChangeText={setConfirmDeleteText}
                autoCapitalize="characters"
              />

              <View style={styles.confirmActions}>
                <TouchableOpacity
                  style={styles.confirmCancelBtn}
                  onPress={() => {
                    setDeletingBoard(null);
                    setConfirmDeleteText('');
                  }}
                >
                  <Text style={styles.confirmCancelText}>Giữ Lại Bảng</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.confirmDeleteBtn,
                    confirmDeleteText.trim().toUpperCase() !== 'XÓA' &&
                      styles.confirmDeleteBtnDisabled,
                  ]}
                  disabled={confirmDeleteText.trim().toUpperCase() !== 'XÓA'}
                  onPress={handleConfirmDelete}
                >
                  <Text style={styles.confirmDeleteText}>Xác Nhận Xóa</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: '#334155',
    maxHeight: '85%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingVertical: 12,
    minHeight: 44,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#475569',
    borderRadius: 2,
    marginBottom: 6,
  },
  closeHint: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  slotBadge: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#38BDF8',
  },
  slotBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#38BDF8',
  },
  subtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 4,
  },
  noticeBox: {
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: '#1E293B',
    borderColor: '#FBBF24',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  noticeText: {
    flex: 1,
    fontSize: 12,
    color: '#FBBF24',
    lineHeight: 18,
  },
  dismissBtn: {
    marginLeft: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#334155',
    borderRadius: 6,
  },
  dismissBtnText: {
    fontSize: 11,
    color: '#F8FAFC',
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingVertical: 6,
  },
  boardCard: {
    minHeight: 56,
    backgroundColor: '#1E293B',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  boardCardActive: {
    borderColor: '#38BDF8',
    backgroundColor: '#0F2642',
  },
  boardCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  boardIcon: {
    fontSize: 18,
  },
  boardInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  boardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F8FAFC',
    maxWidth: '65%',
  },
  boardTitleActive: {
    color: '#38BDF8',
  },
  activePill: {
    backgroundColor: '#0369A1',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  activePillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  boardStats: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 3,
  },
  boardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 8,
  },
  actionBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnIcon: {
    fontSize: 16,
  },
  footerSection: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  addBoardBtn: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#38BDF8',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
  },
  addBoardBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#38BDF8',
  },
  limitAlertBox: {
    backgroundColor: '#1E293B',
    borderColor: '#FBBF24',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
  },
  limitAlertTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FBBF24',
    marginBottom: 4,
  },
  limitAlertDesc: {
    fontSize: 12,
    color: '#CBD5E1',
    lineHeight: 18,
  },
  createCard: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 14,
  },
  createTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 10,
  },
  emojiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  emojiBtn: {
    width: 38,
    height: 44,
    minHeight: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
  },
  emojiBtnSelected: {
    borderColor: '#38BDF8',
    backgroundColor: '#0F2642',
  },
  emojiText: {
    fontSize: 18,
  },
  input: {
    minHeight: 44,
    backgroundColor: '#0F172A',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#F8FAFC',
    marginBottom: 12,
  },
  createActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  cancelBtn: {
    minHeight: 44,
    minWidth: 70,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#334155',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
  },
  submitBtn: {
    minHeight: 44,
    minWidth: 90,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#0284C7',
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  confirmBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  confirmCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F87171',
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F87171',
    marginBottom: 8,
  },
  confirmDesc: {
    fontSize: 13,
    color: '#E2E8F0',
    lineHeight: 20,
    marginBottom: 8,
  },
  highlightText: {
    color: '#F87171',
    fontWeight: '700',
  },
  confirmInstruction: {
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 12,
  },
  keyword: {
    color: '#F87171',
    fontWeight: '700',
  },
  confirmInput: {
    minHeight: 44,
    backgroundColor: '#0F172A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F87171',
    paddingHorizontal: 12,
    fontSize: 15,
    color: '#F8FAFC',
    fontWeight: '700',
    marginBottom: 16,
  },
  confirmActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  confirmCancelBtn: {
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmCancelText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#CBD5E1',
  },
  confirmDeleteBtn: {
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F87171',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmDeleteBtnDisabled: {
    opacity: 0.4,
  },
  confirmDeleteText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
});
