# 🧠 ADHD Cognitive UX Rules — Orbit Design System
# Quy Chuẩn Công Thái Học Nhận Thức Cho Giao Diện Người ADHD

> **Vai Trò:** Always-on Workspace Rule (Scoped: Mobile UI / React Native / Expo)
> **Trách Nhiệm:** Người 2 — Lead Mobile & ADHD UX Designer
> **Chuẩn Áp Dụng:** WCAG 2.1 Level AA, Thuyết Tải Nhận Thức (Cognitive Load Theory), ADHD Ergonomics
> **Phạm Vi Hiệu Lực:** Toàn bộ file `mobile/src/**/*.tsx`, `mobile/App.tsx` và bất kỳ component React Native nào trong dự án Orbit.

---

## 1. BẮT BUỘC — Bảng Màu Calm Dark Canvas (Chống Quá Tải Giác Quan)

Mọi component, screen, và style PHẢI tuân thủ bảng màu sau. AI Agent tuyệt đối **KHÔNG ĐƯỢC** tự ý đưa vào bất kỳ màu nào ngoài Design Token đã đăng ký.

| Token | Hex | Vai trò | Ghi chú WCAG |
| :--- | :--- | :--- | :--- |
| `color.canvas.base` | `#0F172A` | Nền app (Slate-900) | Giảm chói mắt, chống nhòe quầng halation |
| `color.surface.card` | `#1E293B` | Bề mặt thẻ/card (Slate-800) | Phân tách vùng rõ ràng |
| `color.surface.subtle` | `#334155` | Đường viền/divider (Slate-700) | Không tạo "lưới mắt cáo" rối mắt |
| `color.text.primary` | `#F8FAFC` | Chữ chính (Slate-50) | Contrast 15.8:1 / 13.4:1 — vượt AAA |
| `color.text.secondary` | `#94A3B8` | Chữ phụ (Slate-400) | Contrast 4.9:1 — đạt AA |
| `color.text.muted` | `#64748B` | Placeholder, icon disabled | Chỉ dùng cho non-essential info |
| `color.accent.primary` | `#38BDF8` | CTA chính, Pomodoro, highlight | Contrast 8.4:1 — vượt AAA |
| `color.status.done` | `#34D399` | Trạng thái hoàn thành | Mint Emerald nhẹ nhõm |
| `color.energy.low` | `#94A3B8` | Nhãn ☕ Năng lượng thấp | Xám Slate dịu |
| `color.energy.medium` | `#FBBF24` | Nhãn ⚡ Năng lượng vừa | Amber ấm áp, contrast 9.2:1 |
| `color.energy.high` | `#F87171` | Nhãn 🔥 Năng lượng cao | Soft Coral — KHÔNG PHẢI `#FF0000` |
| `color.badge.freeze` | `#818CF8` | Huy hiệu 🛡️ Streak Freeze | Tím Indigo bảo vệ |

### ⛔ QUY TẮC TUYỆT ĐỐI: CẤM MÀU ĐỎ TƯƠI BÁO ĐỘNG

```
CẤM SỬ DỤNG: #FF0000, #EF4444, #DC2626, red, crimson, hoặc bất kỳ sắc đỏ tươi nào
             có chroma > 80 trên hệ LCH.
```

**Lý do khoa học thần kinh:** Màu đỏ tươi kích hoạt phản ứng **Rejection Sensitive Dysphoria (RSD)** — một triệu chứng phổ biến ở người ADHD khiến họ phản ứng cảm xúc cực kỳ dữ dội trước bất kỳ tín hiệu thất bại, trễ hạn, hoặc phán xét nào. Hậu quả trực tiếp: người dùng xóa app vĩnh viễn.

**Thay thế cho trạng thái cảnh báo/lỗi:**
- Dùng Sand Amber `#FBBF24` hoặc Soft Coral `#F87171` — màu ấm áp, có đủ sự chú ý nhưng không gây hoảng loạn.
- Chuỗi thời hạn trễ KHÔNG BAO GIỜ dùng từ `OVERDUE`, `TRỄ HẠN!`, `QUÁ HẠN` kèm icon cảnh báo đỏ. Thay bằng: *"Việc này đã qua ngày dự kiến — hãy điều chỉnh lại khi bạn sẵn sàng nhé."*

---

## 2. BẮT BUỘC — Quy Chuẩn Vùng Chạm (Touch Target ≥ 44 × 44 pt)

Mọi thành phần tương tác (Button, TouchableOpacity, Pressable, Checkbox, Switch, Chip, Tab) PHẢI đảm bảo:

| Thuộc tính | Giá trị tối thiểu | Ghi chú |
| :--- | :--- | :--- |
| **Bounding box** | `minHeight: 44`, `minWidth: 44` (pt/dp) | WCAG 2.5.5 Level AAA, iOS HIG, Material 48dp |
| **Khoảng cách giữa 2 target liền kề** | `gap ≥ 8px` hoặc `margin ≥ 8px` | Chống bấm nhầm khi tay bồn chồn vận động |
| **Padding bên trong** | `paddingVertical ≥ 8px`, `paddingHorizontal ≥ 12px` | Đảm bảo vùng chạm dù text ngắn |

```typescript
// ✅ ĐÚNG — Button đạt chuẩn
<TouchableOpacity style={{ minHeight: 48, paddingHorizontal: 16, paddingVertical: 10 }}>

// ❌ SAI — Nút quá nhỏ, người ADHD run tay sẽ bấm trượt
<TouchableOpacity style={{ padding: 4 }}>
```

**Với Checkbox/Radio:** Nếu kích thước visual chỉ 24×24, bắt buộc bổ sung `hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}` để vùng chạm thực tế đạt ≥ 44pt.

---

## 3. BẮT BUỘC — Giới Hạn Đơn Nhiệm WIP = 1 (Edge Case 02)

### Quy tắc bất biến:
- Cột **DOING** trên bảng Kanban chỉ cho phép **tối đa 1 task duy nhất** tại mọi thời điểm.
- KHÔNG BAO GIỜ cho phép người dùng kéo/chuyển task thứ 2 vào DOING khi đã có task đang chạy.

### Hành vi bắt buộc khi vi phạm WIP:
1. **Chặn hành động** — Task không được chuyển trạng thái.
2. **Rung phản hồi dịu dàng** — `Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)`.
3. **Hiển thị thông báo ân cần bằng `Alert.alert()`** — Không dùng từ "LỖI", không dùng màu đỏ, không khóa màn hình:
   > *"🎯 Giới hạn đơn nhiệm (WIP Limit: 1/1) — Bộ não người ADHD hoạt động tốt nhất khi tập trung vào duy nhất một việc. Hãy hoàn thành hoặc đưa việc hiện tại về Todo trước nhé!"*
4. **Nút phản hồi:** Chỉ 1 nút duy nhất `"Đã hiểu"` — không cung cấp 2 lựa chọn gây phân vân.

```typescript
// ✅ Pattern chuẩn — Kiểm tra WIP trước khi chuyển trạng thái
if (targetStatus === 'DOING') {
  const doingTasks = tasks.filter(t => t.status === 'DOING' && t.id !== taskId);
  if (doingTasks.length >= 1) {
    Alert.alert(
      '🎯 Giới hạn đơn nhiệm (WIP Limit: 1/1)',
      'Bộ não người ADHD hoạt động tốt nhất khi tập trung vào duy nhất một việc...',
      [{ text: 'Đã hiểu' }]
    );
    return; // CHẶN HOÀN TOÀN
  }
}
```

---

## 4. BẮT BUỘC — Cơ Chế Bảo Toàn Chuỗi Streak Freeze (Edge Case 03)

### Quy tắc:
- Mỗi người dùng được cấp **2 lượt Streak Freeze (`🛡️ 2 Freeze`)**.
- Khi người dùng nghỉ 1 ngày (không hoàn thành task nào), hệ thống **tự động kích hoạt 1 lượt Freeze** để bảo toàn chuỗi ngày liên tiếp, KHÔNG phá chuỗi.
- Nếu cả 2 lượt Freeze đã dùng hết và người dùng nghỉ ngày thứ 3, chuỗi mới bị reset — nhưng KHÔNG hiển thị thông báo trừng phạt.

### Hiển thị UI bắt buộc:
- Widget chuỗi ngày phải **luôn hiển thị** số Freeze còn lại: `🛡️ 2 Streak Freeze sẵn sàng`.
- Khi Freeze được kích hoạt, thông báo phải dùng giọng trấn an:
  > *"🛡️ Lá chắn bảo vệ chuỗi đã giữ nhịp cho bạn hôm qua. Đừng lo lắng, hãy tiếp tục khi bạn sẵn sàng!"*
- TUYỆT ĐỐI CẤM thông báo kiểu: *"Bạn đã nghỉ 1 ngày! Chuỗi sắp bị phá!"* — đây là trigger RSD.

---

## 5. BẮT BUỘC — Ngôn Ngữ Micro-Copy Ân Cần (Empathetic Copywriting)

Toàn bộ văn bản trong ứng dụng (toast, alert, empty state, placeholder) PHẢI tuân thủ:

| ❌ CẤM | ✅ THAY BẰNG |
| :--- | :--- |
| "LỖI!", "THẤT BẠI", "SAI" | "Hãy thử lại nhé", "Orbit đã lưu giữ hộ bạn" |
| "QUÁ HẠN!", "TRỄ HẠN" (kèm đỏ) | "Việc này đã qua ngày dự kiến — điều chỉnh khi bạn sẵn sàng" |
| "Bạn chưa hoàn thành!" | "Hãy nghỉ ngơi một chút, công việc vẫn ở đây đợi bạn" |
| "Chuỗi ngày bị phá!" | "Mình bắt đầu lại nhẹ nhàng cùng nhau nhé" |
| Modal lỗi blocking đỏ | Toast tự đóng sau 3.5s, nền Slate-800, viền Amber |

---

## 6. BẮT BUỘC — Phản Hồi Xúc Giác Haptic (Expo Haptics)

| Hành động | API | Độ trễ tối đa |
| :--- | :--- | :---: |
| Ghi việc nhanh (Quick Capture) | `Haptics.impactAsync(ImpactFeedbackStyle.Light)` | < 50ms |
| Tick hoàn thành subtask | `Haptics.impactAsync(ImpactFeedbackStyle.Medium)` | < 50ms |
| Hoàn tất toàn bộ task → DONE | `Haptics.notificationAsync(NotificationFeedbackType.Success)` | < 80ms |
| Vi phạm WIP Limit | `Haptics.notificationAsync(NotificationFeedbackType.Warning)` | < 50ms |

---

## 7. BẮT BUỘC — Focus Mode: Ẩn Hoàn Toàn Distraction

Khi FocusScreen được kích hoạt:
- **ẨN** toàn bộ: Kanban columns, QuickCaptureBar, Bottom Tab (ngoại trừ nút thoát), EnergyFilterWidget.
- **HIỂN THỊ** duy nhất: Tiêu đề task đang DOING, FocusTimer (Pomodoro 25m, màu `#38BDF8`), Checklist micro-steps.
- Đồng hồ Pomodoro PHẢI dùng sắc xanh Sky Blue hoặc Emerald — KHÔNG DÙNG ĐỎ cho bất kỳ phần nào của timer.

---

## 8. BẮT BUỘC — Tỷ Lệ Tương Phản Tối Thiểu WCAG 2.1 AA

| Loại nội dung | Tỷ lệ tối thiểu |
| :--- | :---: |
| Văn bản thường (< 18pt) | ≥ 4.5:1 |
| Văn bản lớn (≥ 18pt hoặc bold ≥ 14pt) | ≥ 3.0:1 |
| Thành phần UI hoạt động (button, input border) | ≥ 3.0:1 |
| Icon trang trí thuần túy | Không yêu cầu |

AI Agent phải kiểm tra mọi cặp foreground/background trong StyleSheet khi tạo hoặc sửa component.

---

## 9. QUY TRÌNH XÁC NHẬN CHẤT LƯỢNG (QUALITY GATE)

Trước khi hoàn tất bất kỳ thay đổi UI nào, AI Agent PHẢI tự xác nhận:

- [ ] Không có màu `#FF0000` hoặc sắc đỏ tươi nào trong code
- [ ] Mọi TouchableOpacity/Pressable có `minHeight ≥ 44`
- [ ] WIP Limit = 1 được enforce ở tầng state management
- [ ] Streak Freeze hiển thị số lượt còn lại
- [ ] Mọi text trên nền tối có contrast ≥ 4.5:1
- [ ] Ngôn ngữ UI không chứa từ gây RSD (LỖI, THẤT BẠI, QUÁ HẠN)
- [ ] TypeScript biên dịch thành công: `npx tsc --noEmit` (0 lỗi)
