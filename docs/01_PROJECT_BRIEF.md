# Orbit — Project Brief

| Thông tin | Chi tiết |
| :--- | :--- |
| **Tên dự án** | **Orbit** — Hệ thống điều phối công việc thông minh cho người ADHD |
| **Trạng thái tài liệu** | Accepted (Đã phê duyệt định hướng) |
| **Nền tảng mục tiêu** | Mobile (iOS & Android via React Native) + Backend (Spring Boot 3) |
| **Phiên bản** | 1.0.0 (Giai đoạn định nghĩa sản phẩm) |

---

## 1. Giả thuyết Vấn đề (Problem Hypothesis)

Người mắc hội chứng **ADHD (Rối loạn giảm chú ý tăng động)** thường gặp khó khăn nghiêm trọng trong việc quản lý và thực thi công việc hằng ngày do các trở ngại nhận thức đặc thù:
- **Rối loạn chức năng điều hành (Executive Dysfunction):** Rất khó để bắt đầu một nhiệm vụ, đặc biệt khi nhiệm vụ đó trừu tượng, mơ hồ hoặc quá lớn.
- **Chứng "Mù thời gian" (Time Blindness):** Khó ước lượng thời gian cần thiết để hoàn thành một việc và dễ quên hạn chót (deadlines).
- **Tê liệt phân tích (Analysis Paralysis):** Cảm giác quá tải và bế tắc khi nhìn vào một danh sách việc làm (To-do list) dày đặc không rõ mức độ ưu tiên.
- **Sự sụt giảm Dopamine:** Nhanh chóng mất hứng thú và bỏ cuộc nếu công việc không mang lại phản hồi hoặc cảm giác thành tựu ngay lập tức.

Các công cụ quản lý phổ biến hiện nay như Trello, Jira, Notion hay Todoist được thiết kế cho người có nhận thức thần kinh điển hình (*Neurotypical*), tập trung vào tổ chức dự án nhóm và nhập liệu thủ công nhiều bước, vô tình trở thành gánh nặng nhận thức (*Cognitive Overload*) cho người ADHD.

**Orbit** ra đời nhằm giảm thiểu gánh nặng nhận thức này bằng cách hỗ trợ người dùng ADHD:
- Ghi nhận công việc nhanh chóng (Instant capture).
- Tự động xác định việc cần làm trước mắt phù hợp với mức năng lượng nhận thức.
- Ứng dụng AI để chia nhỏ các tác vụ khổng lồ thành các hành động vi mô (Micro-actions) dễ thực hiện.
- Theo dõi tiến độ thông qua quy trình Kanban tinh gọn, triệt tiêu xao nhãng.

---

## 2. Đối tượng Người dùng Mục tiêu (Primary User)

Người mắc hội chứng ADHD (bao gồm cả các dạng: Giảm chú ý - Inattentive, Tăng động/Bốc đồng - Hyperactive, hoặc Dạng kết hợp - Combined) có nhu cầu quản lý công việc cá nhân, học tập hoặc công việc hàng ngày một cách nhẹ nhàng, không áp lực.

---

## 3. Kết quả Kỳ vọng (Desired Outcomes)

Người dùng Orbit sẽ đạt được:
1. **Không bỏ sót:** Không bị trôi hoặc quên các công việc quan trọng nhờ cơ chế ghi chú tức thì và thông báo thông minh.
2. **Biết rõ bước tiếp theo:** Luôn biết chính xác mình nên làm gì trong thời điểm hiện tại dựa trên mức năng lượng và độ khẩn cấp.
3. **Dễ bắt đầu hơn (Lower Barrier to Entry):** Vượt qua nỗi sợ bắt đầu nhờ các bước nhỏ có thời lượng dưới 15-20 phút.
4. **Giảm cảm giác tội lỗi và quá tải:** Giao diện tối giản, chỉ tập trung vào 1 việc tại một thời điểm (Single-task focus).
5. **Duy trì động lực:** Nhận phản hồi tích cực (Dopamine hit) lành mạnh qua cơ chế gamification vi mô không tạo áp lực.

---

## 4. Giá trị Sản phẩm Cốt lõi (Core Product Value)

### 4.1. AI Task Decomposition (Chia nhỏ nhiệm vụ bằng AI)
Khi người dùng nhập một đầu việc lớn hoặc mơ hồ (ví dụ: *"Ôn thi cuối kỳ môn Kiến trúc phần mềm"* hay *"Dọn dẹp phòng ngủ"*):
- AI tự động phân tích và đề xuất 3 - 5 bước nhỏ, cụ thể, hành động được ngay (Actionable steps) với thời lượng ước tính.
- Hiển thị bản xem trước (Preview modal) cho phép người dùng tùy chỉnh/chọn lọc.
- **Chỉ tạo các công việc con sau khi có xác nhận của người dùng** (Human-in-the-loop).

### 4.2. AI Smart Prioritization (Xếp thứ tự ưu tiên thông minh)
Hệ thống sử dụng AI kết hợp logic đánh giá ma trận thích ứng để đề xuất thứ tự công việc dựa trên:
- Độ khẩn cấp (Urgency & Deadline).
- Tầm quan trọng (Importance / Impact).
- Mức độ phức tạp của công việc (Complexity).
- **Mức năng lượng hiện tại của người dùng (Current Energy Level: Cao / Trung bình / Kiệt sức).**

---

## 5. Phạm vi Chức năng MVP (In-Scope Behavior)

### 5.1. Xác thực & Hồ sơ (Authentication & Profile)
- Đăng ký / Đăng nhập bằng Email & Mật khẩu.
- Đăng nhập nhanh qua Google (OAuth2).
- Thiết lập hồ sơ năng lượng cơ bản.

### 5.2. Quản lý Board (Board Management)
- Tạo, chỉnh sửa, lưu trữ hoặc xóa Board cá nhân (ví dụ: *Học tập*, *Dự án cá nhân*, *Việc nhà*).
- Giới hạn số lượng Board nhìn thấy cùng lúc để tránh xao nhãng.

### 5.3. Quy trình Kanban Tinh gọn (ADHD-friendly Kanban)
- Áp dụng 4 trạng thái cố định: **Backlog → Todo → Doing → Done**.
- Cột **Doing** áp dụng giới hạn WIP (Work-In-Progress) nghiêm ngặt (mặc định tối đa 1-2 việc) để chống đa nhiệm (multitasking).
- Chế độ **Focus Mode**: Ẩn toàn bộ các cột khác, chỉ hiển thị duy nhất thẻ công việc đang làm kèm đồng hồ đếm ngược Pomodoro.

### 5.4. Quản lý Thẻ Công việc (Ticket / Task Management)
- Tạo nhanh thẻ việc với tiêu đề, hạn chót và mức độ năng lượng ước tính.
- Check-list công việc con (Subtasks).
- Kéo thả mượt mà giữa các cột trạng thái.

### 5.5. Trợ lý AI (AI Assistance)
- Tích hợp mô hình AI để chia nhỏ công việc.
- Đề xuất sắp xếp lại thứ tự ưu tiên trong cột Todo khi người dùng cập nhật trạng thái năng lượng.

### 5.6. Tích hợp Lịch & Gamification Vi mô
- Đồng bộ hiển thị hạn chót với Google Calendar.
- Thưởng điểm kinh nghiệm (XP), huy hiệu khích lệ, chuỗi hoàn thành (Streak) với cơ chế bảo vệ chuỗi (*Streak Freeze*) để người ADHD không bị nản chí khi lỡ ngắt chuỗi 1 ngày.

---

## 6. Ranh giới Loại trừ (Explicit Exclusions - Không làm trong MVP)

- **Giao tiếp nhóm (Chat/Messaging):** Không hỗ trợ tính năng chat nội bộ hoặc bình luận phức tạp.
- **Tính năng Doanh nghiệp (Enterprise Features):** Không làm phân quyền nhiều cấp (RBAC), quản lý phòng ban, chấm công, timesheet.
- **Báo cáo Phân tích Phức tạp (Heavy Analytics):** Không có biểu đồ Burn-down, velocity, hay các dashboard KPI rối rắm.

---

## 7. Các Ràng buộc Thiết kế (Constraints)

- **Ràng buộc Nhận thức (Cognitive Constraints):** 
  - Tuân thủ nguyên tắc thiết kế cho người suy giảm chú ý: tương phản cao, ít chữ, nút bấm to rõ, không quảng cáo, không notification dồn dập.
- **Ràng buộc Quy trình:** 
  - Kanban 4 cột cố định, không cho phép tùy biến cột vô hạn nhằm giảm thiểu tình trạng thiết lập quá đà mà không hành động (*Productivity Tool Procrastination*).

---

## 8. Nguyên tắc Hoạt động của AI (AI Working Rules)

1. **AI chỉ đề xuất, con người quyết định (Human-in-the-loop):** AI không bao giờ tự động thêm, sửa, xóa hoặc thay đổi thứ tự công việc của người dùng mà không có sự phê duyệt rõ ràng.
2. **Minh bạch & Tùy biến:** Mọi đề xuất chia nhỏ task đều phải cho phép người dùng sửa đổi nội dung từng bước trước khi chấp nhận.
3. **Quyền từ chối tức thì:** Người dùng có thể bấm "Bỏ qua" hoặc đóng gợi ý của AI bằng 1 chạm mà không gặp bất kỳ thông báo cảnh báo phiền phức nào.

---

## 9. Nhật ký Quyết định (Decision Log)

| Mã | Quyết định | Lý do / Rationale |
| :--- | :--- | :--- |
| **D1** | Tên sản phẩm: Orbit | Biểu tượng cho quỹ đạo ổn định, giúp tâm trí người ADHD quay về đúng hướng |
| **D2** | Đối tượng: Người dùng ADHD | Tập trung giải quyết triệt để nỗi đau tâm lý thay vì cạnh tranh với các công cụ chung |
| **D3** | Nền tảng: Mobile App (React Native) + Spring Boot | Đảm bảo tính tiện lợi ghi chú mọi lúc mọi nơi trên điện thoại, backend vững chắc, an toàn |
| **D4** | Kiến trúc Kanban 4 cột cố định | Triệt tiêu gánh nặng phải cấu hình hệ thống |
| **D5** | Human-in-the-loop cho AI | Bảo đảm người dùng nắm quyền tự chủ, tránh cảm giác bị máy móc thao túng công việc |
| **D6** | Gamification nhẹ nhàng (Gentle Gamification) | Người ADHD rất nhạy cảm với sự từ chối/thất bại (RSD), cơ chế điểm số phải mang tính khuyến khích, không trừng phạt |
| **D7** | AI Task Decomposition | Đề xuất các bước nhỏ hơn, người dùng phê duyệt trước khi tạo |
| **D8** | Yêu cầu phê duyệt trước khi tạo Subtask | Bảo đảm tính kiểm soát của người dùng (Human-in-the-loop) |
| **D9** | Xác thực Email / Password | Phương thức đăng ký cơ bản |
| **D10** | Đăng nhập Google (OAuth2) | Giảm thiểu ma sát đăng nhập 1 chạm |
| **D11** | Tích hợp Google Calendar | Hỗ trợ người dùng khắc phục hội chứng mù thời gian |
| **D12** | Áp dụng Gamification nhẹ nhàng | Kích hoạt dopamine tích cực mà không tạo áp lực trừng phạt |
| **D13** | Khác biệt cốt lõi: AI Prioritization + AI Decomposition | Định vị độc nhất so với Trello / Jira / Notion |

---

## 10. Các Giả Định Còn Bỏ Ngỏ (Open Assumptions)

1. **Phạm vi chia sẻ:** Người dùng cá nhân hay nhiều người cùng chia sẻ một board (MVP xác định tập trung cho người dùng cá nhân trước).
2. **Xác định mức năng lượng:** Cách xác định trạng thái năng lượng/tập trung của người ADHD (cho người dùng chọn thủ công bằng 3 nấc ☕/⚡/🔥 hoặc dựa trên khung giờ sinh học).
3. **Chi tiết cơ chế gamification:** Tỷ lệ thưởng XP và cơ chế bảo lưu chuỗi (Streak Freeze).
4. **Mức độ đồng bộ với Google Calendar:** Đồng bộ 1 chiều (đẩy deadline lên Calendar) hay đồng bộ 2 chiều.
5. **Tiêu chí đo lường hiệu quả AI:** Tiêu chí đánh giá chất lượng các bước micro-tasks do AI sinh ra.

