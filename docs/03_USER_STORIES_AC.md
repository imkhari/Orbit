# Danh Mục User Stories & Tiêu Chí Chấp Nhận (Acceptance Criteria)

| Tài Liệu | Đặc Tả User Stories & Acceptance Criteria |
| :--- | :--- |
| **Dự Án** | **Orbit** — Hệ Thống Điều Phối Công Việc Thông Minh Cho Người ADHD |
| **Tiêu Chuẩn** | User Story Format (Connextra) & Acceptance Criteria (Gherkin Syntax) |
| **Phương Pháp Luận** | Agile / Scrum - Phân bổ theo mức ưu tiên MoSCoW |

---

## 1. Bảng Tổng Hợp User Stories (MoSCoW Prioritization)

| Mã Story | Phân Hệ | User Story (As a... I want to... So that...) | Ưu Tiên |
| :--- | :--- | :--- | :--- |
| **US-01** | **Xác Thực** | Là một người dùng mới, tôi muốn đăng ký tài khoản nhanh qua Google hoặc Email/Mật khẩu, để có thể lưu trữ tiến độ cá nhân một cách an toàn. | **Must Have** |
| **US-02** | **Quản Lý Board** | Là một người có nhiều nhóm công việc (học tập, việc nhà), tôi muốn tạo tối đa 3-5 board riêng biệt, để không bị lẫn lộn các ngữ cảnh khác nhau. | **Must Have** |
| **US-03** | **Tạo Task Nhanh** | Là một người dễ quên, tôi muốn gõ tiêu đề công việc và nhấn lưu ngay lập tức (dưới 5 giây), để ghi nhận ý tưởng trước khi bị trôi khỏi đầu. | **Must Have** |
| **US-04** | **Kanban 4 Cột** | Là một người cần cấu trúc rõ ràng, tôi muốn quản lý việc qua 4 cột Backlog → Todo → Doing → Done, để biết công việc đang ở bước nào. | **Must Have** |
| **US-05** | **AI Chia Nhỏ Việc** | Là một người hay bị tê liệt trước việc lớn, tôi muốn AI gợi ý bẻ nhỏ việc thành các bước dưới 20 phút, để tôi có can đảm bắt tay vào làm. | **Must Have** |
| **US-06** | **Duyệt Đề Xuất AI** | Là người làm chủ công việc của mình, tôi muốn được xem trước, chỉnh sửa hoặc hủy bỏ đề xuất của AI, để không bị áp đặt kế hoạch máy móc. | **Must Have** |
| **US-07** | **Lọc Theo Năng Lượng** | Là người có mức năng lượng thất thường, tôi muốn lọc các việc nhẹ nhàng khi đang mệt, để vẫn hoàn thành được việc mà không bị kiệt sức. | **Should Have** |
| **US-08** | **Giới Hạn Việc Đang Làm** | Là người hay nhảy việc đa nhiệm, tôi muốn hệ thống chặn nếu đưa quá 1 việc vào cột Doing, để tôi tập trung dứt điểm từng việc. | **Should Have** |
| **US-09** | **Chế Độ Focus Mode** | Là người dễ bị xao nhãng thị giác, tôi muốn ẩn toàn bộ màn hình và chỉ xem 1 việc đang làm kèm Pomodoro, để không bị cuốn vào việc khác. | **Should Have** |
| **US-10** | **Gamification & Chuỗi** | Là người cần dopamine để duy trì động lực, tôi muốn nhận điểm kinh nghiệm và bảo vệ chuỗi ngày làm việc khi lỡ nghỉ, để không nản lòng. | **Could Have** |
| **US-11** | **Đồng Bộ Google Calendar**| Là người hay bị mù thời gian, tôi muốn các hạn chót hiển thị lên Google Calendar, để nhận thông báo nhắc việc trên thiết bị. | **Could Have** |

---

## 2. Tiêu Chí Chấp Nhận Chi Tiết (Given - When - Then)

### 2.1. Phân Hệ Xác Thực & Hồ Sơ

#### US-01.1: Đăng nhập qua Google OAuth2
```gherkin
Feature: Đăng nhập một chạm bằng Google
  Scenario: Đăng nhập thành công bằng tài khoản Google trên thiết bị di động
    Given Người dùng chưa đăng nhập và đang ở màn hình Chào mừng (Welcome Screen)
    When Người dùng nhấn nút "Tiếp tục với Google"
    And Hoàn tất xác thực trên giao diện Google Authenticator
    Then Hệ thống tạo mới hoặc liên kết tài khoản trong Database
    And Trả về JWT Access Token (hạn 15 phút) và Refresh Token an toàn
    And Điều hướng người dùng thẳng vào Board mặc định trong vòng 1.5 giây
```

---

### 2.2. Phân Hệ Quản Lý Thẻ Việc (Task Management)

#### US-03.1: Ghi nhận nhanh công việc tức thời (Instant Capture)
```gherkin
Feature: Tạo task nhanh không cần mở form phức tạp
  Scenario: Thêm công việc với chỉ một dòng tiêu đề
    Given Người dùng đang mở ứng dụng ở bất kỳ tab nào
    When Người dùng chạm vào thanh "Thêm việc nhanh..." ở đáy màn hình
    And Nhập chuỗi: "Nộp bài tập trắc nghiệm môn Triết"
    And Nhấn phím Enter hoặc nút Gửi trên bàn phím ảo
    Then Một thẻ việc mới lập tức xuất hiện ở đầu cột "Backlog"
    And Thẻ việc có trạng thái mặc định: Chưa có hạn chót, Mức năng lượng mặc định là MEDIUM
    And Thanh nhập liệu được dọn trống để sẵn sàng nhận việc tiếp theo
```

#### US-04.1: Chuyển trạng thái thẻ giữa các cột Kanban
```gherkin
Feature: Di chuyển thẻ công việc trên bảng Kanban
  Scenario: Hoàn thành một công việc từ cột Doing sang Done
    Given Thẻ việc "Viết dàn ý bài thuyết trình" đang nằm ở cột "Doing"
    When Người dùng nhấn vào nút tích chọn (Checkmark) hoặc kéo thẻ thả vào cột "Done"
    Then Thẻ việc được chuyển sang cột "Done" với hiệu ứng âm thanh nhẹ và hạt pháo giấy (gentle confetti)
    And Hệ thống ghi nhận điểm kinh nghiệm (+20 XP) vào hồ sơ người dùng
    And Trạng thái của thẻ được cập nhật về cơ sở dữ liệu Backend
```

---

### 2.3. Phân Hệ Trợ Lý AI (AI Assistance - Cốt Lõi)

#### US-05.1: Yêu cầu AI bẻ nhỏ nhiệm vụ lớn thành micro-actions
```gherkin
Feature: AI Task Decomposition
  Scenario: AI phân tích và trả về các bước khả thi dưới 20 phút
    Given Người dùng mở chi tiết một thẻ việc có tiêu đề "Ôn thi cuối kỳ Giải tích"
    When Người dùng bấm vào nút "✨ Bẻ nhỏ với AI"
    Then Hệ thống hiển thị biểu tượng loading nhẹ nhàng với thông điệp: "Đang giúp bạn bẻ nhỏ thử thách này..."
    And Backend Spring Boot gọi mô hình LLM với prompt tối ưu cho người ADHD
    And Trong vòng tối đa 3 giây, hiển thị một Modal xem trước (Preview Bottom Sheet)
    And Danh sách trả về bao gồm 3 đến 5 bước nhỏ, mỗi bước có thời lượng ≤ 20 phút
```

#### US-06.1: Người dùng chỉnh sửa và phê duyệt đề xuất của AI (Human-in-the-Loop)
```gherkin
Feature: Phê duyệt đề xuất của AI
  Scenario: Người dùng tùy chỉnh các bước trước khi thêm vào thẻ
    Given Modal xem trước đang hiển thị 4 bước do AI đề xuất
    When Người dùng nhấn xóa bước số 4 vì thấy không cần thiết
    And Người dùng sửa tên bước số 1 từ "Đọc sách giáo trình" thành "Lật qua 10 trang bài tập mẫu"
    And Người dùng bấm nút "Áp dụng vào công việc này"
    Then Hệ thống lưu 3 bước đã duyệt thành danh sách Checklist bên trong thẻ việc gốc
    And Modal được đóng lại, hiển thị danh sách công việc con rõ ràng trên giao diện
  
  Scenario: Người dùng từ chối toàn bộ đề xuất của AI
    Given Modal xem trước đang hiển thị danh sách gợi ý
    When Người dùng bấm nút "Hủy bỏ" hoặc vuốt xuống để đóng
    Then Không có bất kỳ dữ liệu nào được lưu thêm vào thẻ việc
    And Giao diện trở về trạng thái ban đầu mà không có thông báo cảnh báo phiền toái
```

#### US-07.1: Sắp xếp danh sách công việc theo mức năng lượng
```gherkin
Feature: Phân loại theo mức năng lượng nhận thức
  Scenario: Người dùng mệt mỏi và muốn tìm việc dễ làm
    Given Người dùng có 10 công việc trong danh sách Todo với các mức năng lượng khác nhau
    When Người dùng bấm vào thanh bộ lọc "Năng lượng hiện tại" và chọn icon "☕ Thấp (Low Energy)"
    Then Hệ thống hiển thị đầu tiên các công việc có thời lượng ngắn (< 15 phút) và ít đòi hỏi tư duy sâu
    And Các công việc phức tạp (đòi hỏi năng lượng cao) được làm mờ nhẹ hoặc ẩn vào nhóm "Dành cho lúc bạn khỏe"
```

---

### 2.4. Phân Hệ Trải Nghiệm ADHD (Focus Mode & WIP Limits)

#### US-08.1: Giới hạn số lượng việc đang làm trong cột Doing (WIP Limit)
```gherkin
Feature: Chống đa nhiệm bằng cách khóa cột Doing
  Scenario: Cột Doing đã đạt giới hạn tối đa 1 việc
    Given Cột "Doing" đã chứa công việc "Soạn thảo tài liệu PRD"
    When Người dùng kéo công việc "Sửa lỗi giao diện" từ cột Todo sang cột Doing
    Then Hệ thống từ chối nhận thẻ và đưa thẻ quay trở lại cột Todo
    And Hiển thị thông điệp khích lệ: "Hãy hoàn thành hoặc tạm dừng việc đang làm trước khi nhận việc mới bạn nhé!"
```

#### US-09.1: Bật chế độ tập trung Focus Mode
```gherkin
Feature: Chế độ tập trung loại bỏ xao nhãng
  Scenario: Kích hoạt Focus Mode cho thẻ đang làm
    Given Người dùng có 1 việc đang nằm trong cột "Doing"
    When Người dùng nhấn nút "Bắt đầu tập trung" (Focus Now)
    Then Toàn bộ bảng Kanban và các thanh điều hướng xung quanh biến mất
    And Màn hình chuyển sang giao diện tối giản với tên duy nhất của thẻ việc, bước checklist đầu tiên
    And Hiển thị đồng hồ đếm ngược Pomodoro 25 phút đếm lùi tĩnh lặng
```
