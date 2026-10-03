---
name: adhd-ui-evaluator
description: >
  Quy trình kiểm thử và chấm điểm tự động giao diện React Native của Orbit theo tiêu chuẩn
  trợ năng WCAG 2.1 Level AA và công thái học nhận thức ADHD. Agent sử dụng skill này để audit
  tỷ lệ tương phản màu, kích thước vùng chạm, cấu hình haptic feedback, và 4 trạng thái
  UI Edge States (Empty, AI Shimmer, WIP Rollback, Offline Cache).
---

# 🔍 ADHD UI Evaluator Skill — Quy Trình Kiểm Định Trợ Năng & Công Thái Học Nhận Thức

## Tổng Quan

Skill này hướng dẫn AI Agent thực hiện quy trình kiểm định (**audit**) toàn diện cho bất kỳ component hoặc screen React Native nào trong dự án Orbit, đảm bảo tuân thủ:

1. **WCAG 2.1 Level AA** — Tỷ lệ tương phản màu và kích thước vùng chạm.
2. **ADHD Cognitive Ergonomics** — Triệt tiêu yếu tố gây RSD, đảm bảo WIP = 1, Streak Freeze, Calm UI.
3. **Expo Haptics Engine** — Phản hồi xúc giác đúng loại, đúng thời điểm, đúng độ trễ.
4. **UI Edge States** — Xử lý 4 trạng thái đặc biệt không gây tê liệt nhận thức.

## Tài Liệu Tham Chiếu Bắt Buộc

Trước khi thực hiện audit, Agent **PHẢI** đọc các tài liệu sau:
- `docs/design/02_WIREFRAMES_AND_PROTOTYPE.md` — Design Tokens, 8 Wireframes, Haptics specs.
- `docs/design/03_AI_DESIGN_REVIEW.md` — Bảng kiểm WCAG 2.1 AA và phân tích tâm lý nhận thức.
- `.agents/rules/adhd_cognitive_ux_rules.md` — Quy chuẩn bắt buộc (Always-on Rule).

---

## QUY TRÌNH AUDIT 4 BƯỚC

### Bước 1: Kiểm Định Tỷ Lệ Tương Phản Màu WCAG 2.1 AA

**Mục tiêu:** Đảm bảo mọi cặp foreground/background trong StyleSheet đạt ngưỡng tương phản tối thiểu.

**Ngưỡng bắt buộc:**
- Văn bản thường (font-size < 18pt): Tỷ lệ tương phản ≥ **4.5:1**
- Văn bản lớn (font-size ≥ 18pt hoặc bold ≥ 14pt): Tỷ lệ tương phản ≥ **3.0:1**
- Thành phần UI hoạt động (button border, input border, icon chức năng): ≥ **3.0:1**

**Quy trình thực hiện:**

1. Quét toàn bộ thuộc tính `color` và `backgroundColor` trong `StyleSheet.create({...})` của file đang audit.
2. Xác định các cặp foreground–background thực tế dựa trên component hierarchy (ví dụ: `Text` nằm trong `View` nào).
3. Tính tỷ lệ tương phản theo công thức **WCAG 2.1 Relative Luminance**:
   - Chuyển đổi mỗi kênh RGB (0–255) sang sRGB: `sR = R/255`, sau đó:
     - Nếu `sR ≤ 0.04045`: `linearR = sR / 12.92`
     - Nếu `sR > 0.04045`: `linearR = ((sR + 0.055) / 1.055) ^ 2.4`
   - Luminance `L = 0.2126 * linearR + 0.7152 * linearG + 0.0722 * linearB`
   - Contrast Ratio = `(L_lighter + 0.05) / (L_darker + 0.05)`
4. So sánh với ngưỡng. Ghi nhận kết quả vào bảng checklist.

**Kiểm tra bổ sung — Cấm màu đỏ tươi:**
- Quét TOÀN BỘ file tìm kiếm các pattern: `#FF0000`, `#EF4444`, `#DC2626`, `red`, `crimson`.
- Nếu tìm thấy bất kỳ kết quả nào: **FAIL ngay lập tức** — ghi nhận là vi phạm nghiêm trọng.

**Công cụ hỗ trợ:**
```bash
# Tìm mã màu đỏ tươi bị cấm trong codebase
grep -rn --include="*.tsx" --include="*.ts" -E "(#FF0000|#EF4444|#DC2626|['\"]red['\"]|crimson)" mobile/src/
```

---

### Bước 2: Kiểm Tra Kích Thước Touch Target (Vùng Chạm ≥ 44pt)

**Mục tiêu:** Đảm bảo mọi thành phần tương tác đủ lớn cho ngón tay bồn chồn vận động của người ADHD.

**Ngưỡng bắt buộc:**
- `minHeight ≥ 44` (pt) trên iOS, tương đương `48` (dp) trên Android.
- Khoảng cách giữa 2 target liền kề ≥ `8px`.

**Quy trình thực hiện:**

1. Liệt kê tất cả component tương tác: `TouchableOpacity`, `Pressable`, `TouchableHighlight`, `TouchableWithoutFeedback`, `Switch`, `TextInput`.
2. Kiểm tra thuộc tính style của mỗi component:
   - Có `minHeight ≥ 44` HOẶC `height ≥ 44` HOẶC `paddingVertical` đủ lớn để tổng height ≥ 44?
   - Có `minWidth ≥ 44` cho các nút icon không có text?
3. Nếu component là checkbox/radio nhỏ (24×24), kiểm tra có `hitSlop` bổ sung:
   ```typescript
   // ✅ Checkbox 24×24 với hitSlop bổ sung
   hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
   ```
4. Kiểm tra `gap` hoặc `margin` giữa các target liền kề trong cùng row/column ≥ 8px.

**Kết quả:**
- ✅ **PASS:** Tất cả target ≥ 44pt, spacing ≥ 8px.
- ⚠️ **WARNING:** Target 38–43pt — gần ngưỡng, khuyến nghị tăng.
- ❌ **FAIL:** Target < 38pt — vi phạm WCAG 2.5.5.

---

### Bước 3: Kiểm Tra Cấu Hình Expo Haptics

**Mục tiêu:** Đảm bảo phản hồi xúc giác được cấu hình đúng loại và đúng thời điểm theo bảng chuẩn.

**Bảng chuẩn Haptic bắt buộc:**

| Hành động người dùng | API Expo Haptics yêu cầu | Độ trễ tối đa |
| :--- | :--- | :---: |
| Ghi việc nhanh (Quick Capture submit) | `Haptics.impactAsync(ImpactFeedbackStyle.Light)` | < 50ms |
| Tick hoàn thành 1 subtask | `Haptics.impactAsync(ImpactFeedbackStyle.Medium)` | < 50ms |
| Hoàn tất toàn bộ task → DONE | `Haptics.notificationAsync(NotificationFeedbackType.Success)` | < 80ms |
| Vi phạm WIP Limit (kéo task thứ 2) | `Haptics.notificationAsync(NotificationFeedbackType.Warning)` | < 50ms |

**Quy trình thực hiện:**

1. Tìm kiếm tất cả lời gọi `Haptics.impactAsync(...)` và `Haptics.notificationAsync(...)` trong file.
2. Xác minh rằng loại haptic (Light/Medium/Success/Warning) khớp với hành động tương ứng theo bảng trên.
3. Xác minh rằng lời gọi Haptic nằm **ngay trong handler** của hành động (không qua setTimeout/debounce lớn).
4. Kiểm tra guard `Platform.OS !== 'web'` trước khi gọi Haptics (Expo Haptics không hỗ trợ web).

**Kết quả:**
- ✅ **PASS:** Đúng loại, đúng vị trí, có platform guard.
- ⚠️ **WARNING:** Thiếu haptic ở hành động quan trọng — khuyến nghị bổ sung.
- ❌ **FAIL:** Dùng sai loại haptic (ví dụ: `Warning` cho hành động tích cực).

---

### Bước 4: Kiểm Tra 4 Trạng Thái UI Edge States

**Mục tiêu:** Đảm bảo 4 trạng thái đặc biệt được xử lý đúng, không gây tê liệt nhận thức cho người ADHD.

#### 4.1. Empty State (Trạng Thái Trống)
- [ ] Mỗi cột Kanban (BACKLOG, TODO, DOING, DONE) có empty state riêng biệt.
- [ ] Có icon minh họa dịu nhẹ (emoji hoặc illustration tối giản).
- [ ] Tiêu đề ân cần, không phán xét (VD: *"Đầu óc bạn đang thảnh thơi!"*).
- [ ] Có hướng dẫn hành động cụ thể tiếp theo (VD: *"Thêm nhanh một việc ở thanh dưới đáy"*).
- [ ] KHÔNG có khoảng trống trắng/đen trống rỗng gây *Void Paralysis*.

#### 4.2. AI Loading / Shimmer State (Edge Case 01 & 12)
- [ ] KHÔNG sử dụng spinner/vòng quay tròn giật cục.
- [ ] Sử dụng Skeleton Shimmer êm ái (gradient Slate-800 → Slate-700 → Slate-800).
- [ ] Có lời trấn an xoay vòng ngẫu nhiên (VD: *"AI đang nghiên cứu các bước nhỏ vừa sức..."*).
- [ ] Có cơ chế fallback khi AI timeout > 3.5s: hiển thị 3 bước mẫu mặc định, KHÔNG hiện hộp thoại lỗi đỏ.

#### 4.3. WIP Limit Rollback State (Edge Case 02)
- [ ] Khi kéo task thứ 2 vào DOING: task bị chặn/trả về vị trí cũ.
- [ ] Có rung haptic Warning dịu dàng.
- [ ] Toast thông báo ân cần hiển thị 3–4 giây, KHÔNG dùng modal blocking.
- [ ] Không dùng từ "LỖI" hoặc màu đỏ trong thông báo.

#### 4.4. Offline Cache State
- [ ] Khi mất mạng: KHÔNG hiển thị modal lỗi chặn người dùng.
- [ ] Hiển thị badge nhỏ góc trên: `☁️ Đang lưu trên máy`.
- [ ] Mọi hành động (thêm task, tick subtask) vẫn hoạt động bình thường qua local cache.
- [ ] Tự động đồng bộ ngầm khi có mạng trở lại, KHÔNG yêu cầu thao tác thủ công.

---

## ĐỊNH DẠNG BÁO CÁO AUDIT

Sau khi hoàn thành 4 bước, Agent tổng hợp kết quả theo format sau:

```markdown
## 📋 Báo Cáo Audit ADHD UI — [Tên Component/Screen]

### Tổng Quan
| Bước | Kết quả | Ghi chú |
| :--- | :---: | :--- |
| 1. Tương phản màu WCAG 2.1 AA | ✅/⚠️/❌ | [chi tiết] |
| 2. Touch Target ≥ 44pt | ✅/⚠️/❌ | [chi tiết] |
| 3. Expo Haptics | ✅/⚠️/❌ | [chi tiết] |
| 4. UI Edge States | ✅/⚠️/❌ | [chi tiết] |

### Chi Tiết Tương Phản Màu
| Cặp | Foreground | Background | Ratio | Chuẩn | Kết quả |
| :--- | :--- | :--- | :---: | :---: | :---: |
| [mô tả] | #XXXXXX | #XXXXXX | X.X:1 | ≥4.5:1 | ✅/❌ |

### Hành Động Cần Sửa
1. [Mô tả vấn đề + file + dòng + giải pháp cụ thể]
```

---

## VÍ DỤ SỬ DỤNG

Khi được yêu cầu audit một component:

```
Hãy sử dụng skill adhd-ui-evaluator để kiểm tra component TaskCard.tsx
```

Agent sẽ:
1. Đọc file `mobile/src/components/TaskCard.tsx`.
2. Đọc rule `.agents/rules/adhd_cognitive_ux_rules.md` để nắm ràng buộc.
3. Thực hiện tuần tự 4 bước audit theo quy trình trên.
4. Xuất báo cáo theo format chuẩn.
5. Đề xuất code fix cụ thể cho từng vi phạm (nếu có).

---

## GHI CHÚ QUAN TRỌNG

- Skill này **CHỈ ĐÁNH GIÁ** — không tự động sửa code. Agent đề xuất fix và chờ xác nhận.
- File checklist mẫu JSON nằm tại: `examples/wcag_audit_checklist.json`.
- Mọi kết quả audit nên được lưu dưới dạng artifact Markdown để team review.
