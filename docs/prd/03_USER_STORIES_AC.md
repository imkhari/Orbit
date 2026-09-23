# Đặc Tả User Stories & Acceptance Criteria — ORBIT
## Intelligent Task Orchestrator for ADHD Minds

| Thông Tin Tài Liệu | Chi Tiết |
| :--- | :--- |
| **Dự Án** | **Orbit** — Intelligent Task Orchestrator for ADHD Minds |
| **Phương Pháp Tiếp Cận** | Agile / Scrum — Chuẩn Hóa Theo Khung MoSCoW |
| **Cú Pháp Đặc Tả** | Connextra Format (`As a... I want to... So that...`) & Gherkin (`Given - When - Then`) |
| **Phiên Bản** | 2.0.0 (Master Engineering Baseline) |
| **Đối Tượng Áp Dụng** | Product Owner, Backend/Frontend Developers, QA/QC Automation Engineers |

---

## 1. Master Epic & Story Register (Ma Trận Phân Loại MoSCoW)

| Epic ID | Tên Epic | Số Lượng Stories | Mức Độ Ưu Tiên | Ý Nghĩa Thần Kinh Học Đối Với ADHD |
| :--- | :--- | :---: | :---: | :--- |
| **EP-01** | Authentication & Onboarding | 3 Stories | **Must Have** | Giảm thiểu ma sát gia nhập, nhận diện nhịp sinh học cá nhân. |
| **EP-02** | Board Management | 4 Stories | **Must Have** | Ngăn ngừa Tê Liệt Thiết Lập (*Configuration Paralysis*) với giới hạn 3–5 board. |
| **EP-03** | Instant Capture & Ticket Life-cycle | 3 Stories | **Must Have** | Khắc phục suy giảm trí nhớ ngắn hạn (*Working Memory Decay*) với thao tác < 5s. |
| **EP-04** | AI Task Decomposition | 4 Stories | **Must Have** | Vượt qua rào cản khởi động (*Task Paralysis*) qua 3–5 micro-steps < 20 phút. |
| **EP-05** | Energy-Adaptive Prioritization | 3 Stories | **Should Have** | Thích ứng với sự biến thiên Dopamine, giải quyết Mù Thời Gian (*Time Blindness*). |
| **EP-06** | WIP Limit & Focus Mode Pomodoro | 4 Stories | **Should Have** | Chặn đa nhiệm phân mảnh (*Multitasking*), cô lập thị giác chống xao nhãng. |
| **EP-07** | Gentle Gamification & Retention | 4 Stories | **Should Have** | Tạo vòng lặp Dopamine tích cực, bảo vệ tâm lý khỏi hội chứng sợ từ chối (*RSD*). |
| **EP-08** | Google Calendar Two-Way Sync | 4 Stories | **Could Have** | Neo giữ nhận thức thời gian vào không gian lịch số thực tế. |

---

## 2. Chi Tiết Toàn Bộ User Stories & Acceptance Criteria Chuẩn Gherkin

---

### Epic 1: Authentication & Onboarding (Xác Thực & Nhập Khởi)

#### US-01.1: Đăng ký & Đăng nhập bằng Email/Mật khẩu an toàn
* **User Story:**
  * **As an** cá nhân có ADHD muốn bảo mật dữ liệu quản lý công việc,
  * **I want to** đăng ký và đăng nhập tài khoản bằng Email và Mật khẩu với thông báo lỗi bảo mật,
  * **So that** dữ liệu cá nhân của tôi được an toàn và không bị lộ trạng thái tài khoản cho kẻ xấu.

```gherkin
Feature: Email and Password Authentication
  As a user with ADHD
  I want a secure and clear login/registration flow
  So that I can access my workspace without confusion or data leakage

  Scenario: Đăng ký tài khoản mới thành công
    Given Người dùng chưa xác thực đang ở màn hình "Đăng ký"
    When Người dùng nhập email "user@orbitapp.me", mật khẩu hợp lệ "SecurePass123@", và tên hiển thị "Minh Triết"
    And Nhấn nút "Tạo tài khoản Orbit"
    Then Hệ thống mã hóa mật khẩu bằng BCrypt (work factor 12)
    And Lưu người dùng vào cơ sở dữ liệu với năng lượng mặc định "MEDIUM"
    And Trả về mã HTTP 201 Created cùng cặp JWT (Access Token 15 phút, Refresh Token 7 ngày)
    And Ứng dụng điều hướng người dùng trực tiếp vào "Màn hình Onboarding Khảo sát Nhịp sinh học"

  Scenario: Đăng nhập thất bại do thông tin không chính xác
    Given Người dùng đang ở màn hình "Đăng nhập"
    When Người dùng nhập email "existing@orbitapp.me" và mật khẩu sai "WrongPass!"
    And Nhấn nút "Đăng nhập"
    Then Hệ thống trả về mã lỗi HTTP 401 Unauthorized
    And Hiển thị thông báo thân thiện: "Email hoặc mật khẩu chưa chính xác. Hãy thử lại nhẹ nhàng nhé!"
    And TUYỆT ĐỐI KHÔNG tiết lộ email này đã tồn tại hay chưa trong hệ thống (chống User Enumeration Attack)
    And Giữ nguyên nội dung ô nhập Email để người dùng không phải gõ lại từ đầu
```

#### US-01.2: Đăng nhập một chạm qua Google OAuth2
* **User Story:**
  * **As an** người dùng ADHD dễ mất kiên nhẫn khi phải ghi nhớ mật khẩu,
  * **I want to** đăng nhập ngay lập tức thông qua tài khoản Google với 1 chạm,
  * **So that** tôi vượt qua rào cản đăng nhập trong dưới 2 giây mà không bị đứt gãy luồng suy nghĩ.

```gherkin
Feature: Google OAuth2 Single-Tap Sign In
  As an easily distracted ADHD user
  I want one-tap Google login
  So that I enter the app immediately without password cognitive load

  Scenario: Đăng nhập Google thành công lần đầu (Auto-provisioning)
    Given Người dùng chưa có tài khoản Orbit đang ở màn hình Chào mừng
    When Người dùng nhấn "Tiếp tục với Google"
    And Xác thực thành công trên Google OAuth Consent Screen với email "alex@gmail.com"
    Then Backend Spring Boot nhận Google ID Token, xác thực chữ ký số qua Google Public Keys
    And Tự động khởi tạo bản ghi User mới với email "alex@gmail.com" và avatar từ Google Profile
    And Tự động khởi tạo 1 Board mặc định mang tên "Không Gian Đầu Tiên" gồm 4 cột Kanban chuẩn
    And Trả về JWT Access Token và chuyển hướng vào màn hình Onboarding
    And Thời gian phản hồi toàn luồng không vượt quá 1.5 giây

  Scenario: Người dùng hủy luồng đăng nhập Google giữa chừng
    Given Người dùng nhấn "Tiếp tục với Google"
    When Người dùng đóng cửa sổ duyệt web OAuth hoặc nhấn nút "Hủy" trên thiết bị
    Then Ứng dụng khôi phục lại màn hình Chào mừng ở trạng thái tĩnh
    And Hiển thị thông báo dịu nhẹ: "Không sao cả, bạn có thể quay lại đăng nhập bất cứ khi nào sẵn sàng."
    And Không xuất hiện bất kỳ cảnh báo lỗi đỏ hay âm thanh thất bại nào
```

#### US-01.3: Onboarding khảo sát nhịp sinh học & Mức năng lượng ban đầu
* **User Story:**
  * **As an** người có nhịp sinh học dao động mạnh,
  * **I want to** trả lời 2 câu hỏi trực quan về khung giờ minh mẫn nhất trong ngày,
  * **So that** Orbit thiết lập mức năng lượng gợi ý ban đầu phù hợp với nhịp sinh học tự nhiên của tôi.

```gherkin
Feature: Chronotype and Cognitive Rhythm Onboarding
  As a neurodivergent individual
  I want Orbit to learn my peak cognitive hours
  So that task suggestions match my biological energy flow

  Scenario: Hoàn thành khảo sát nhịp sinh học 2 bước
    Given Người dùng vừa đăng nhập lần đầu tiên và đang ở màn hình Onboarding
    When Người dùng chọn nhóm nhịp sinh học: "Cú đêm (Peak vào buổi tối 20:00 - 01:00)"
    And Chọn thời lượng làm việc ưa thích: "25 phút Pomodoro tiêu chuẩn"
    And Nhấn nút "Bắt đầu hành trình Orbit 🚀"
    Then Hệ thống lưu thông tin Chronotype = "NIGHT_OWL" vào bảng User Profile
    And Thiết lập baseline năng lượng tự động điều chỉnh theo giờ hệ thống
    And Điều hướng trực tiếp vào Board chính với hiệu ứng chuyển cảnh êm ái
```

---

### Epic 2: Board Management (Quản Lý Không Gian Làm Việc)

#### US-02.1: Tạo Board mới & Tự động sinh 4 cột Kanban chuẩn
* **User Story:**
  * **As an** người dùng muốn tách biệt giữa việc học tập và đời sống cá nhân,
  * **I want to** tạo một Board mới chỉ bằng cách nhập tên,
  * **So that** tôi có ngay một không gian làm việc với cấu trúc 4 cột cố định mà không tốn công cấu hình.

```gherkin
Feature: Board Creation with Canonical 4-Lane Kanban
  As an ADHD user prone to tool-setup procrastination
  I want an instant board setup with predefined columns
  So that I do not waste dopamine configuring workflow structures

  Scenario: Tạo board mới thành công
    Given Người dùng đang có 2 active boards và đang mở Drawer danh sách Board
    When Người dùng nhấn nút "+ Thêm Board mới"
    And Nhập tên board "Đồ Án Tốt Nghiệp", chọn biểu tượng "🎓" và màu nhấn "Xanh Ngọc (Emerald)"
    And Nhấn "Tạo Ngay"
    Then Backend ghi nhận bản ghi Board mới thuộc về user hiện tại
    And Tự động khởi tạo đúng 4 cột Kanban theo thứ tự vị trí:
      | Column Name | Column Type | WIP Limit | Position |
      | Hộp Nháp    | BACKLOG     | null      | 0        |
      | Sẵn Sàng    | TODO        | null      | 1        |
      | Đang Làm    | DOING       | 1         | 2        |
      | Hoàn Thành  | DONE        | null      | 3        |
    And Giao diện lập tức chuyển sang Board vừa tạo trong dưới 200ms
```

#### US-02.2: Ràng buộc giới hạn 3–5 Board chủ động (Chống Configuration Paralysis)
* **User Story:**
  * **As an** người có xu hướng tạo quá nhiều dự án dở dang,
  * **I want to** hệ thống ngăn chặn khi tôi tạo vượt quá 5 active boards,
  * **So that** tâm trí tôi được bảo vệ khỏi sự phân mảnh và tê liệt lựa chọn.

```gherkin
Feature: Enforce Active Board Limit to Prevent Sprawl
  As a user with executive dysfunction
  I want Orbit to gently limit active boards to maximum 5
  So that I stay focused on what truly matters instead of accumulating boards

  Scenario: Cố gắng tạo board thứ 6 khi đã đạt giới hạn tối đa
    Given Người dùng hiện đã có đủ 5 active boards trong tài khoản
    When Người dùng nhấn nút "+ Thêm Board mới"
    Then Hệ thống KHÔNG mở form nhập tạo board
    And Hiển thị Modal thông điệp thấu cảm với phong cách dịu dàng:
      """
      Tâm trí bạn hoạt động bình an nhất khi không gian gọn gàng! 🌿
      Bạn đang có 5 bảng hoạt động. Để tạo bảng mới, hãy hoàn thành hoặc Lưu trữ (Archive) bớt 1 bảng cũ nhé.
      """
    And Cung cấp nút CTA "Xem danh sách Board để Lưu trữ" và nút "Để sau"
    And Không có âm thanh báo lỗi chói tai
```

#### US-02.3: Đổi tên, tạo kiểu và Lưu trữ (Archive) Board
* **User Story:**
  * **As an** người dùng đã hoàn thành một kỳ học hoặc dự án,
  * **I want to** lưu trữ (Archive) board đó lại thay vì xóa vĩnh viễn,
  * **So that** dữ liệu cũ được cất gọn gàng và giải phóng 1 vị trí active board mới.

```gherkin
Feature: Board Archival and Customization
  As a user finishing a life chapter
  I want to archive my completed board
  So that I declutter my view while preserving my accomplishments

  Scenario: Lưu trữ board thành công
    Given Người dùng đang ở màn hình cài đặt của Board "Kỳ 1 Năm 3"
    When Người dùng chọn tính năng "Lưu trữ bảng này (Archive)"
    And Xác nhận trong hộp thoại xác nhận dịu nhẹ
    Then Backend cập nhật cờ is_archived = true cho Board đó
    And Board lập tức biến mất khỏi danh sách chọn Board chính
    And Số lượng active board giảm đi 1, cho phép tạo board mới nếu muốn
    And Người dùng có thể tìm lại board này trong tab "Bảng đã lưu trữ" bất kỳ lúc nào
```

#### US-02.4: Xóa vĩnh viễn Board với cơ chế xác nhận an toàn
* **User Story:**
  * **As an** người dùng muốn dọn dẹp board thử nghiệm không còn giá trị,
  * **I want to** xóa vĩnh viễn board cùng toàn bộ task bên trong sau khi xác nhận rõ ràng,
  * **So that** hệ thống không còn rác dữ liệu mà vẫn đảm bảo tôi không bấm nhầm do bốc đồng.

```gherkin
Feature: Safe Permanent Board Deletion
  As an impulsive ADHD user
  I want a confirmation barrier before permanent board deletion
  So that accidental taps do not destroy my valuable tasks

  Scenario: Xóa board có chứa task với cơ chế gõ tên xác nhận
    Given Người dùng chọn "Xóa vĩnh viễn" Board "Dự Án Nháp" đang chứa 8 tasks
    When Hệ thống hiển thị hộp thoại cảnh báo cấp cao
    And Yêu cầu người dùng gõ chính xác chữ "XÓA" vào ô kiểm tra
    And Người dùng gõ "XÓA" và nhấn "Xác nhận xóa vĩnh viễn"
    Then Backend thực hiện xóa Cascade: Board -> Columns -> Tasks -> Subtasks
    And Điều hướng người dùng về Board mặc định còn lại
    And Hiển thị Toast thông báo: "Đã xóa bảng an toàn."
```

---

### Epic 3: Instant Capture & Ticket Life-cycle (Ghi Nhận Nhanh & Vòng Đời Task)

#### US-03.1: Ghi nhận công việc tức thời trong dưới 5 giây (Sub-5s Instant Capture)
* **User Story:**
  * **As an** người có suy nghĩ nảy sinh bất chợt và dễ bị phân tán,
  * **I want to** nhập nhanh tiêu đề việc cần làm ở thanh nhập cố định dưới chân màn hình,
  * **So that** ý tưởng được lưu lại trong vòng dưới 5 giây trước khi trí nhớ ngắn hạn quên mất.

```gherkin
Feature: Sub-5-Second Instant Task Capture
  As an ADHD individual with decaying working memory
  I want a ubiquitous single-tap capture field
  So that no fleeting idea is lost to distraction

  Scenario: Ghi nhận task nhanh chỉ với tiêu đề
    Given Người dùng đang ở bất kỳ màn hình nào trong ứng dụng Orbit
    When Người dùng chạm vào thanh "Ghi nhanh việc đang nghĩ..." ở đáy màn hình
    And Bàn phím nảy lên, người dùng gõ "Gửi báo cáo tiến độ cho thầy Dũng"
    And Nhấn nút "Gửi" trên bàn phím hoặc icon mũi tên gửi
    Then Giao diện áp dụng cơ chế Optimistic UI: Card task xuất hiện ngay trên đầu cột "Hộp Nháp (Backlog)"
    And Thiết bị phát xung rung nhẹ Haptic Feedback dịu dàng (< 100ms)
    And Ô nhập liệu tự động xóa rỗng và giữ sẵn focus cho ý tưởng kế tiếp
    And Task được gán mặc định: Năng lượng = MEDIUM, Urgency = MEDIUM, Deadline = null
    And Toàn bộ thao tác hoàn thành trong thời gian dưới 3 giây
```

#### US-03.2: Chỉnh sửa Deadline, gắn nhãn năng lượng nhận thức và phân loại
* **User Story:**
  * **As an** người dùng muốn bổ sung thông tin sau khi đã bình tâm,
  * **I want to** mở chi tiết task để chọn deadline và gán nhãn mức năng lượng cần thiết,
  * **So that** thuật toán ưu tiên hiểu được độ nặng của công việc.

```gherkin
Feature: Task Detail Enrichment and Energy Tagging
  As an ADHD user organizing captured thoughts
  I want to tag energy requirements and deadlines visually
  So that Orbit can orchestrate my daily queue effectively

  Scenario: Bổ sung nhãn năng lượng và thời hạn cho task
    Given Task "Gửi báo cáo tiến độ cho thầy Dũng" đang nằm ở cột Backlog
    When Người dùng nhấn mở thẻ Task
    And Chọn mức năng lượng nhận thức là "🔥 Năng lượng cao (High)"
    And Chọn hạn chót là "Ngày mai lúc 17:00" qua bộ chọn lịch trực quan
    And Nhập thời gian ước lượng "45 phút"
    And Nhấn "Lưu thay đổi"
    Then Hệ thống lưu trữ các trường dữ liệu vào DB qua API PUT /api/v1/tasks/{id}
    And Thẻ task trên bảng Kanban hiển thị huy hiệu "🔥 High" màu cam dịu và hạn chót định dạng thân thiện "Ngày mai, 17:00"
    And Không dùng màu đỏ tươi cảnh báo dù deadline sắp đến gần
```

#### US-03.3: Di chuyển trạng thái qua 4 cột Kanban cố định
* **User Story:**
  * **As an** người tư duy thị giác,
  * **I want to** kéo thả thẻ task hoặc bấm nút chuyển trạng thái tuần tự giữa Backlog -> Todo -> Doing -> Done,
  * **So that** tôi theo dõi tiến trình trực quan mà không bị nhầm lẫn luồng việc.

```gherkin
Feature: Kanban State Progression
  As a visual thinker
  I want seamless card movement across 4 immutable lanes
  So that I experience visual feedback of accomplishment

  Scenario: Chuyển task từ Todo sang Doing khi Doing đang trống
    Given Cột "Đang Làm (Doing)" hiện không có task nào (WIP count = 0)
    And Task "Đọc tài liệu Spring AI" đang nằm ở cột "Sẵn Sàng (Todo)"
    When Người dùng kéo thẻ task thả vào cột "Đang Làm (Doing)"
    Then Task chuyển trạng thái thành "DOING" với hiệu ứng thả mượt mà 60fps
    And Nút "🎯 Bắt đầu Tập Trung" xuất hiện trên thẻ task
    And Backend cập nhật column_id của task và ghi nhận thời điểm bắt đầu

  Scenario: Hoàn thành task từ Doing sang Done
    Given Task "Đọc tài liệu Spring AI" đang ở cột "Đang Làm (Doing)"
    When Người dùng kéo thẻ task thả vào cột "Hoàn Thành (Done)"
    Then Hệ thống kích hoạt hiệu ứng pháo giấy nhẹ (Confetti Particles) trong 1.5 giây
    And Phát xung rung Haptic dạng Success
    And Ghi nhận completed_at = thời điểm hiện tại
    And Cộng ngay +20 XP cho tài khoản người dùng
    And Cột Doing trở về trạng thái trống, sẵn sàng cho công việc kế tiếp
```

---

### Epic 4: AI Task Decomposition (Chia Nhỏ Việc Bằng AI & Human-in-the-Loop)

#### US-04.1: Kích hoạt AI Decomposition sinh 3-5 micro-steps dưới 20 phút
* **User Story:**
  * **As an** người bị tê liệt hành động trước một công việc quá đồ sộ,
  * **I want to** nhấn nút "✨ AI Chia Nhỏ Việc",
  * **So that** Gemini AI phân tách task thành 3–5 bước siêu nhỏ (mỗi bước < 20 phút) giúp tôi dễ dàng bắt đầu.

```gherkin
Feature: AI-Powered Task Decomposition
  As an ADHD user facing executive task paralysis
  I want AI to break intimidating tasks into bite-sized micro-steps
  So that the barrier of starting is lowered to under 5 minutes

  Scenario: Yêu cầu AI phân tích task phức tạp
    Given Task "Viết Đồ Án Tốt Nghiệp Chương 3 Kiến Trúc Hệ Thống" đang mở
    When Người dùng nhấn nút "✨ AI Chia Nhỏ Việc"
    Then Giao diện mở Bottom Sheet dạng Preview với trạng thái đang tải dịu nhẹ:
      "Orbit đang chia nhỏ thử thách này thành từng bước dễ thở cho bạn..."
    And Backend gửi Prompt kèm JSON Schema nghiêm ngặt đến Gemini 1.5 Flash API
    And Trong vòng 3.0 giây, trả về danh sách gồm đúng 3 đến 5 micro-steps
    And Bước đầu tiên (Step 1) luôn là hành động khởi động siêu nhẹ (< 5 phút)
    And Tất cả các bước còn lại đều có thời lượng ước tính <= 20 phút
    And Mỗi bước có tiêu đề bắt đầu bằng động từ hành động rõ ràng
```

#### US-04.2: Tương tác kiểm tra, sửa, bỏ chọn micro-step trước khi lưu DB (Human-in-the-loop)
* **User Story:**
  * **As an** người dùng coi trọng quyền tự chủ của bản thân,
  * **I want to** được quyền tick chọn, chỉnh sửa nội dung hoặc xóa bớt bước do AI gợi ý trước khi lưu,
  * **So that** tôi giữ toàn quyền quyết định và không bị máy móc ép buộc.

```gherkin
Feature: Human-in-the-Loop Verification and Granular Editing
  As an autonomous individual
  I want full editing power over AI suggestions before persistence
  So that the task checklist matches my actual capability and preference

  Scenario: Tùy chỉnh và chấp thuận các bước gợi ý của AI
    Given Bottom Sheet Preview đang hiển thị 4 gợi ý subtasks từ AI
    When Người dùng chạm vào Step 1 để sửa lại tên: "Mở file Word và gõ 3 gạch đầu dòng"
    And Người dùng bỏ tick (uncheck) ở Step 4 vì thấy chưa cần thiết
    And Nhấn nút "Đồng Ý Áp Dụng (3 Bước)"
    Then Backend nhận request POST /api/v1/tasks/{taskId}/subtasks/bulk
    And Lưu chính xác 3 subtasks đã duyệt vào cơ sở dữ liệu
    And Gán thứ tự step_order lần lượt là 1, 2, 3
    And Đóng Bottom Sheet và hiển thị Checklist tương tác trực tiếp trên Task Card
    And Thông báo Toast: "Tuyệt vời! Bạn đã có lộ trình rõ ràng để bắt đầu."
```

#### US-04.3: Hủy bỏ gợi ý AI không làm thay đổi dữ liệu
* **User Story:**
  * **As an** người dùng cảm thấy gợi ý của AI chưa đúng ý mình,
  * **I want to** đóng cửa sổ xem trước bằng cách vuốt xuống hoặc bấm "Hủy",
  * **So that** không có bất kỳ dữ liệu rác nào bị ghi vào cơ sở dữ liệu.

```gherkin
Feature: Safe Dismissal of AI Suggestions
  As a user reviewing AI output
  I want to reject suggestions with zero penalty or friction
  So that my workspace remains entirely clean

  Scenario: Người dùng từ chối đề xuất của AI
    Given Cửa sổ Preview gợi ý của AI đang mở
    When Người dùng nhấn nút "Để sau" hoặc vuốt thanh Bottom Sheet xuống
    Then Cửa sổ đóng lại ngay lập tức
    And Backend KHÔNG nhận bất kỳ lệnh lưu subtask nào
    And Thẻ task gốc giữ nguyên 100% hiện trạng ban đầu
```

#### US-04.4: Xử lý sự cố AI Timeout / Lỗi mạng với Fallback Template
* **User Story:**
  * **As an** người dùng sử dụng app trong điều kiện mạng chập chờn,
  * **I want to** nhận được mẫu chia nhỏ dự phòng khi AI bị timeout quá 3.5 giây,
  * **So that** luồng làm việc của tôi không bị gián đoạn và tâm lý không bị ức chế.

```gherkin
Feature: AI Timeout and Network Degradation Fallback
  As an ADHD user with low frustration tolerance
  I want instant heuristic fallback when AI is slow or offline
  So that I am never blocked by technical hiccups

  Scenario: AI gọi bên thứ ba vượt quá SLA 3.5 giây (Circuit Breaker kích hoạt)
    Given Người dùng bấm "✨ AI Chia Nhỏ Việc" khi kết nối mạng quốc tế bị nghẽn
    When Backend gọi Gemini API và thời gian chờ vượt quá 3500ms
    Then Cơ chế Circuit Breaker ngắt kết nối và chuyển sang Heuristic Fallback Engine
    And Hệ thống trả về 3 micro-steps mẫu phổ quát:
      | Step Order | Title | Estimated Minutes | Energy Level |
      | 1 | Mở tài liệu/công cụ và dọn bàn làm việc thật gọn | 5 | LOW |
      | 2 | Phác thảo 3 ý tưởng chính ra nháp | 15 | MEDIUM |
      | 3 | Thực hiện phần nội dung dễ nhất trước | 15 | MEDIUM |
    And Giao diện hiển thị thông điệp nhẹ nhàng: "AI đang thở một chút, Orbit đã chuẩn bị sẵn 3 bước khởi động này cho bạn!"
    And Người dùng vẫn có thể chỉnh sửa và bấm "Đồng Ý Áp Dụng" như bình thường
```

---

### Epic 5: Energy-Adaptive Prioritization (Ưu Tiên Thích Ứng Mức Năng Lượng)

#### US-05.1: Chuyển đổi bộ lọc mức năng lượng hiện tại
* **User Story:**
  * **As an** người có mức năng lượng não bộ lên xuống thất thường,
  * **I want to** chọn mức năng lượng hiện tại (☕ Thấp, ⚡ Vừa, 🔥 Cao) chỉ với 1 chạm ở đỉnh bảng,
  * **So that** ứng dụng Orbit thấu hiểu trạng thái tâm sinh lý của tôi tại thời điểm đó.

```gherkin
Feature: Cognitive Energy State Switching
  As a neurodivergent user experiencing fluctuating mental energy
  I want a one-tap energy switcher
  So that my task queue reflects my current cognitive capacity

  Scenario: Chuyển mức năng lượng sang "☕ Năng lượng thấp" khi kiệt sức
    Given Người dùng vừa trải qua 3 tiếng họp căng thẳng và cảm thấy cạn kiệt năng lượng
    When Người dùng chạm vào biểu tượng "☕ Thấp" trên thanh Energy Header
    Then Trạng thái người dùng User.currentEnergyLevel đổi thành "LOW"
    And Thiết bị phát xung rung phản hồi êm ái
    And Bảng Kanban lập tức kích hoạt thuật toán sắp xếp lại danh sách trong cột Todo
```

#### US-05.2: Tự động sắp xếp lại danh sách Todo theo công thức thích ứng năng lượng
* **User Story:**
  * **As an** người hay bị áp lực bởi những việc lớn khi đang mệt mỏi,
  * **I want to** các công việc tốn ít sức (☕ Low) tự động trồi lên đầu danh sách Todo khi tôi chọn năng lượng Thấp,
  * **So that** tôi có thể chọn ngay một việc dễ dàng để làm mà không tốn công suy nghĩ chọn lọc.

```gherkin
Feature: Dynamic Energy-Adaptive Task Reranking
  As an exhausted user
  I want low-effort tasks promoted to the top
  So that I maintain momentum through easy wins without burnout

  Scenario: Tái xếp hạng cột Todo khi người dùng ở mức năng lượng LOW
    Given Cột Todo đang có 3 task:
      | Title | Energy Required | Deadline | Estimated Mins |
      | Viết báo cáo đồ án | HIGH | 3 ngày nữa | 90 |
      | Trả lời email xác nhận | LOW | 2 ngày nữa | 10 |
      | Đọc slide bài giảng | MEDIUM | 5 ngày nữa | 30 |
    When Người dùng chọn mức năng lượng hiện tại là "☕ LOW"
    Then Thuật toán tính Priority Score $P(T)$ định vị lại thứ tự các task trong cột:
      1. "Trả lời email xác nhận" (Ưu tiên cao nhất do trùng khớp năng lượng LOW)
      2. "Đọc slide bài giảng" (Đứng thứ hai)
      3. "Viết báo cáo đồ án" (Bị đẩy xuống cuối cùng do đòi hỏi năng lượng HIGH)
    And Các thẻ task di chuyển vị trí mượt mà với animation dạng layout spring
```

#### US-05.3: Trực quan hóa độ mờ thị giác để giảm tải nhận thức
* **User Story:**
  * **As an** người dễ bị quá tải thị giác (*Visual Overload*),
  * **I want to** các task đòi hỏi năng lượng cao tự động mờ đi khi tôi đang mệt mỏi,
  * **So that** mắt tôi chỉ tập trung vào những việc tôi có khả năng giải quyết ngay lúc này.

```gherkin
Feature: Visual Dimming for Cognitive Ergonomics
  As a visually overwhelmed individual
  I want incompatible demanding tasks dimmed out
  So that I am not guilt-tripped by difficult chores when fatigued

  Scenario: Áp dụng hiệu ứng mờ thị giác theo mức năng lượng
    Given Người dùng đang ở trạng thái năng lượng "☕ LOW"
    When Danh sách cột Todo được kết xuất trên màn hình
    Then Các task gắn nhãn "☕ LOW" hiển thị với độ tương phản 100% và viền sáng dịu
    And Các task gắn nhãn "⚡ MEDIUM" hiển thị với độ mờ Opacity = 65%
    And Các task gắn nhãn "🔥 HIGH" hiển thị với độ mờ Opacity = 35% kèm biểu tượng chiếc lá thư giãn
    And Người dùng vẫn có thể bấm chọn task mờ nếu chủ động muốn làm, không khóa cứng chức năng
```

---

### Epic 6: WIP Limit & Focus Mode Pomodoro (Giới Hạn Việc & Chế Độ Tập Trung)

#### US-06.1: Thực thi nghiêm ngặt WIP Limit = 1 ở cột Doing
* **User Story:**
  * **As an** người có xu hướng ôm đồm mở nhiều việc cùng lúc và bỏ dở giữa chừng,
  * **I want to** Orbit chặn không cho tôi kéo task thứ hai vào cột "Đang Làm (Doing)",
  * **So that** tôi buộc phải hoàn thành hoặc tạm dừng việc hiện tại trước khi bắt đầu việc mới.

```gherkin
Feature: Strict WIP Limit Enforcement (Single-Tasking)
  As a chronic multitasker with ADHD
  I want Orbit to strictly limit the Doing column to 1 active task
  So that I focus on sequential finishing rather than fragmented starting

  Scenario: Cố gắng kéo task thứ 2 vào cột Doing khi đã có 1 task đang chạy
    Given Cột "Đang Làm (Doing)" đang có sẵn task "Dọn dẹp bàn học"
    And Task "Làm bài tập giải tích" đang ở cột "Sẵn Sàng (Todo)"
    When Người dùng kéo task "Làm bài tập giải tích" thả vào cột "Đang Làm (Doing)"
    Then Hệ thống từ chối thao tác thả và kích hoạt hoạt ảnh trượt thẻ bài về lại vị trí cũ ở cột Todo
    And Thiết bị phát 2 nhịp rung nhẹ cảnh báo
    And Hiển thị thông báo hướng dẫn thấu cảm:
      """
      Tâm trí bạn tỏa sáng nhất khi chỉ tập trung vào MỘT việc duy nhất! 🌟
      Hãy hoàn thành hoặc tạm dừng việc "Dọn dẹp bàn học" trước khi nhận việc mới nhé.
      """
    And Cột Doing vẫn duy trì duy nhất 1 task
```

#### US-06.2: Kích hoạt Single-Task Focus Mode với Pomodoro Timer
* **User Story:**
  * **As an** người dễ bị xao nhãng bởi các danh sách xung quanh,
  * **I want to** nhấn nút "Tập Trung Ngay" để ẩn toàn bộ giao diện bảng và chỉ thấy duy nhất 1 task cùng đồng hồ Pomodoro,
  * **So that** toàn bộ tầm nhìn của tôi được bảo vệ trong không gian tĩnh lặng tuyệt đối.

```gherkin
Feature: Single-Task Focus Mode Activation
  As a distraction-prone individual
  I want an immersive focus screen for my active task
  So that all extraneous visual stimuli are completely removed

  Scenario: Bật chế độ Focus Mode cho task trong Doing
    Given Task "Viết 1 trang mở đầu tiểu luận" đang nằm trong cột Doing
    When Người dùng nhấn nút "🎯 Tập Trung Ngay" trên thẻ task
    Then Ứng dụng chuyển sang màn hình FocusScreen toàn màn hình
    And Ẩn hoàn toàn: Thanh điều hướng đáy, 3 cột Kanban còn lại, Thanh ghi nhanh
    And Chỉ hiển thị: Tiêu đề task, Checklist micro-steps tương tác, và Đồng hồ đếm ngược 25:00
    And Màu sắc đồng hồ sử dụng gam màu Xanh Lục Bảo (Emerald) hoặc Xanh Lam Dịu (Cyan), tuyệt đối không dùng màu Đỏ Gắt
```

#### US-06.3: Đếm ngược, tạm dừng và chuyển chu kỳ Nghỉ ngơi Pomodoro
* **User Story:**
  * **As an** người thường xuyên mất ý niệm thời gian (*Time Blindness*),
  * **I want to** quan sát thanh tiến trình đếm ngược êm ái và có chuông báo dịu nhẹ khi hết 25 phút,
  * **So that** tôi duy trì nhịp độ làm việc và được nhắc nhở nghỉ ngơi kịp thời.

```gherkin
Feature: Gentle Pomodoro Countdown and Break Cycle
  As a time-blind ADHD individual
  I want a visual countdown timer with serene transitions
  So that I work in rhythmic bursts without hyperfocus burnout

  Scenario: Đồng hồ đếm hết 25 phút tập trung
    Given Người dùng đang trong phiên Focus Pomodoro và đồng hồ đếm về 00:00
    When Phiên tập trung kết thúc
    Then Thiết bị phát âm thanh chuông gió dịu nhẹ (Wind Chime Audio) và rung nhịp nhàng
    And Ghi nhận bản ghi FocusSession: status = "COMPLETED", actual_minutes = 25
    And Tặng thưởng +15 XP tập trung
    And Hiển thị màn hình chuyển tiếp sang "Giờ Nghỉ Dịu Dàng (5 Phút)":
      "Bạn đã làm rất tốt! Hãy đứng dậy uống một ngụm nước và vươn vai nhé. 🌿"
    And Cung cấp nút "Bắt đầu 5 phút nghỉ" hoặc "Tiếp tục làm việc nếu đang có hứng"
```

#### US-06.4: Thoát Focus Mode an toàn và bảo lưu tiến độ
* **User Story:**
  * **As an** người dùng có việc đột xuất cần dừng lại,
  * **I want to** thoát Focus Mode bất cứ lúc nào mà không bị trừ điểm hay phạt cảnh cáo,
  * **So that** tôi không cảm thấy tội lỗi khi cuộc sống thực tế có phát sinh ngắt quãng.

```gherkin
Feature: Non-Punitive Focus Mode Exit
  As a user interrupted by real life
  I want to exit Focus Mode seamlessly
  So that I face zero shame or penalty for unexpected pauses

  Scenario: Người dùng nhấn thoát sớm khi mới chạy được 10 phút
    Given Phiên Pomodoro đang chạy đến phút thứ 10:15
    When Người dùng nhấn nút "Tạm dừng & Thoát về Bảng"
    Then Hệ thống lưu bản ghi FocusSession với status = "PAUSED", actual_minutes = 10
    And Bảo lưu trạng thái các subtasks đã tick chọn
    And Đưa người dùng trở lại màn hình Kanban chính
    And Task vẫn nằm yên ở cột Doing với huy hiệu "Đã tập trung 10 phút"
    And TUYỆT ĐỐI KHÔNG trừ XP, KHÔNG hiển thị thông báo chê trách
```

---

### Epic 7: Gentle Gamification & Retention (Gamification Dịu Dàng & Giữ Chân Tích Cực)

#### US-07.1: Tích lũy XP tích cực khi hoàn thành Micro-step và Task
* **User Story:**
  * **As an** người có não bộ thiếu hụt Dopamine bẩm sinh,
  * **I want to** nhận được điểm kinh nghiệm (XP) ngay lập tức mỗi khi tick xong 1 micro-step hoặc 1 task,
  * **So that** tôi có cảm giác thỏa mãn (*Instant Gratification*) và muốn tiếp tục hành trình.

```gherkin
Feature: Positive Dopamine XP Feedback Loop
  As an individual with ADHD dopamine deficiency
  I want immediate, tangible positive feedback on micro-accomplishments
  So that my motivation is reinforced sustainably

  Scenario: Nhận XP khi tick hoàn thành một micro-step
    Given Người dùng đang mở checklist của Task
    When Người dùng chạm vào checkbox của micro-step "Mở tài liệu cương lĩnh"
    Then Checkbox chuyển sang trạng thái đã chọn kèm âm thanh "pop" vui tai
    And Hiệu ứng số nổi "+5 XP" bay nhẹ lên và hòa vào thanh cấp độ trên thanh trạng thái
    And Hệ thống ghi nhận hoàn thành subtask vào DB trong 100ms
```

#### US-07.2: Bảo lưu chuỗi ngày với cơ chế Đóng băng Streak Freeze tự động
* **User Story:**
  * **As an** người rất sợ bị đứt chuỗi thói quen dẫn đến chán nản từ bỏ (*Rejection Sensitive Dysphoria - RSD*),
  * **I want to** chuỗi ngày của tôi được tự động bảo lưu bằng Khiên Đóng Băng (*Streak Freeze*) nếu lỡ quên vào app 1 ngày,
  * **So that** nỗ lực cả tháng của tôi không bị xóa sạch chỉ vì một ngày mệt mỏi.

```gherkin
Feature: Automatic Streak Freeze on Missed Days
  As an ADHD user vulnerable to RSD and all-or-nothing abandonment
  I want an automatic Streak Freeze to protect my habits
  So that missing one single day does not erase my hard-earned momentum

  Scenario: Người dùng quên vào app trong 1 ngày nhưng còn lượt Freeze
    Given Người dùng đang có Streak = 14 ngày và Freeze Credits = 1 khiên
    And Lần hoạt động cuối cùng là ngày 2026-09-21
    When Người dùng mở app vào ngày 2026-09-23 (bỏ qua ngày 2026-09-22)
    Then Hệ thống kiểm tra khoảng cách ngày vắng mặt = 1 ngày nghỉ
    And Tự động tiêu thụ 1 Freeze Credit để bảo vệ chuỗi ngày
    And Chuỗi ngày giữ nguyên Streak = 14 ngày (trạng thái FROZEN trong ngày vắng)
    And Số Freeze Credits còn lại = 0 khiên
    And Hiển thị Banner chào mừng ấm áp:
      """
      Chào mừng bạn quay lại! 🛡️
      Khiên Đóng Băng đã tự động bảo vệ chuỗi 14 ngày của bạn trong ngày nghỉ hôm qua.
      Hãy hoàn thành 1 việc nhỏ hôm nay để tiếp tục hành trình nhé!
      """
    And Tuyệt đối KHÔNG có âm báo thất bại hay chữ cảnh báo màu đỏ
```

#### US-07.3: Phục hồi chuỗi ngày và Đón chào nhân văn khi cạn kiệt Freeze
* **User Story:**
  * **As an** người dùng quay lại app sau 1 tuần bận rộn hoặc trầm cảm và đã hết lượt Freeze,
  * **I want to** nhận được lời chào mừng dịu dàng khích lệ thay vì thông báo "Chuỗi của bạn đã bị mất về 0",
  * **So that** tôi không cảm thấy xấu hổ hay tội lỗi và có dũng khí bắt đầu lại.

```gherkin
Feature: Compassionate Reset and Welcome Back
  As a returning user after an extended hiatus
  I want a gentle, shame-free welcome screen
  So that I feel safe to resume without guilt or emotional recoil

  Scenario: Mở lại ứng dụng sau 5 ngày không truy cập và hết lượt Freeze
    Given Người dùng từng đạt Streak = 20 ngày nhưng đã hết Freeze Credits
    When Người dùng mở ứng dụng sau 5 ngày vắng bóng
    Then Hệ thống cập nhật current_streak = 1 (khởi tạo chu kỳ mới)
    And Giữ nguyên kỷ lục max_streak = 20 ngày và tổng điểm tích lũy total_xp
    And Hiển thị Modal chào đón thấu cảm:
      """
      Chúng mình rất vui khi bạn đã trở lại! 🌸
      Cuộc sống đôi khi cần những quãng nghỉ dài. Mọi nỗ lực cũ của bạn vẫn luôn ở đây.
      Hôm nay là một ngày hoàn toàn mới. Hãy cùng Orbit bắt đầu từ một việc thật nhẹ nhàng nhé!
      """
    And Cung cấp nút CTA: "Chọn 1 việc nhẹ ☕ cho hôm nay"
```

#### US-07.4: Mở khóa Huy hiệu Động viên tinh thần (Milestone Badges)
* **User Story:**
  * **As an** người dùng muốn ghi nhận sự tiến bộ nội tại của chính mình,
  * **I want to** mở khóa các danh hiệu mang tính chữa lành và công nhận nỗ lực cá nhân,
  * **So that** lòng tự trọng và sự tự tin của tôi được phục hồi từng bước.

```gherkin
Feature: Non-Competitive Milestone Badges
  As a neurodivergent individual rebuilding self-esteem
  I want affirmative badges celebrating self-compassion and persistence
  So that I feel seen and validated without toxic productivity pressure

  Scenario: Đạt huy hiệu "Bước Khởi Đầu Dũng Cảm"
    Given Người dùng hoàn thành task đầu tiên sau chuỗi ngày trì hoãn
    When Task chuyển sang trạng thái DONE
    Then Hệ thống mở khóa Badge "🌱 Bước Khởi Đầu Dũng Cảm"
    And Hiển thị thẻ chúc mừng với lời nhắn:
      "Vượt qua sự chần chừ là bước đi khó nhất, và bạn đã làm được!"
    And Huy hiệu được lưu vĩnh viễn vào Bộ Sưu Tập Cá Nhân
```

---

### Epic 8: Google Calendar Two-Way Sync (Đồng Bộ Lịch Hai Chiều)

#### US-08.1: Kết nối tài khoản Google Calendar & Tạo Calendar "Orbit Tasks" riêng biệt
* **User Story:**
  * **As an** người quản lý lịch trình trên Google Calendar,
  * **I want to** liên kết tài khoản Google và cho phép Orbit tạo riêng một Lịch phụ tên "Orbit Tasks",
  * **So that** các hạn chót của Orbit không bị hòa lẫn làm rối loạn lịch họp hay lịch cá nhân khác.

```gherkin
Feature: Google Calendar Integration and Dedicated Secondary Calendar
  As an organized ADHD user
  I want Orbit deadlines isolated in a dedicated Google Calendar
  So that my main calendar stays tidy and easy to parse

  Scenario: Kết nối Google Calendar lần đầu thành công
    Given Người dùng đang ở màn hình Cài Đặt Tích Hợp của Orbit
    When Người dùng nhấn "Kết nối Google Calendar"
    And Chấp thuận quyền OAuth scope: "https://www.googleapis.com/auth/calendar.events"
    Then Backend Orbit gọi Google Calendar API kiểm tra xem đã có calendar "Orbit Tasks" chưa
    And Nếu chưa có, tự động tạo mới một Secondary Calendar mang tên "Orbit Tasks" với màu Cyan
    And Lưu `google_calendar_id` vào bảng cấu hình của User
    And Hiển thị trạng thái "Đã kết nối với Google Calendar (Lịch: Orbit Tasks)"
```

#### US-08.2: Đồng bộ xuôi (Orbit -> Google Calendar) khi tạo/đổi Deadline
* **User Story:**
  * **As an** người phụ thuộc vào thông báo hệ thống của điện thoại,
  * **I want to** khi tôi đặt hạn chót trên Orbit, một sự kiện tương ứng xuất hiện ngay trên Google Calendar,
  * **So that** điện thoại nhắc nhở tôi đúng giờ ngay cả khi Orbit đang đóng.

```gherkin
Feature: Forward Sync from Orbit to Google Calendar
  As a time-blind user relying on phone-wide calendar pings
  I want task deadlines synced to my Google Calendar
  So that I receive pervasive system-level notifications

  Scenario: Đặt deadline cho task trong Orbit
    Given Tài khoản đã liên kết Google Calendar thành công
    And Task "Nộp đề cương môn Học Máy" chưa có deadline
    When Người dùng đặt deadline là "Thứ Sáu, 15:00" với ước lượng 60 phút
    Then Backend Orbit gọi API Google Calendar tạo Event:
      - Title: "🎯 [Orbit] Nộp đề cương môn Học Máy"
      - Start Time: Thứ Sáu lúc 14:00
      - End Time: Thứ Sáu lúc 15:00
      - Reminders: Báo trước 30 phút và 10 phút
    And Lưu google_calendar_event_id trả về vào bản ghi Task trong PostgreSQL
    And Phản hồi hoàn tất trong dưới 1.0 giây
```

#### US-08.3: Đồng bộ ngược (Google Calendar -> Orbit) khi đổi giờ trên lịch
* **User Story:**
  * **As an** người thường xuyên kéo dời lịch trực tiếp trên ứng dụng Google Calendar trên máy tính,
  * **I want to** khi tôi đổi giờ sự kiện Orbit trên Google Calendar, deadline trong Orbit tự động cập nhật theo,
  * **So that** dữ liệu hai bên luôn khớp nhau mà tôi không phải chỉnh sửa hai lần.

```gherkin
Feature: Backward Sync from Google Calendar to Orbit
  As a dynamic calendar user
  I want changes made on Google Calendar reflected in Orbit
  So that I never have to manually double-enter deadline shifts

  Scenario: Đổi giờ sự kiện trên Google Calendar
    Given Sự kiện "🎯 [Orbit] Nộp đề cương môn Học Máy" đang ở 15:00 trên Google Calendar
    When Người dùng kéo sự kiện sang 17:00 trên ứng dụng Google Calendar
    Then Google gửi Webhook Push Notification đến endpoint `/api/v1/integrations/google-calendar/webhook`
    And Backend Orbit xác thực Webhook Token và truy vấn thông tin Event mới từ Google API
    And Tìm task trong database khớp với `google_calendar_event_id`
    And Cập nhật Task.deadline = 17:00 Thứ Sáu và ghi nhận audit log
    And Bắn WebSocket event thông báo cho Mobile Client cập nhật UI tức thì nếu app đang mở
```

#### US-08.4: Hủy liên kết Google Calendar an toàn (Revoke Calendar Sync)
* **User Story:**
  * **As an** người dùng không muốn tiếp tục đồng bộ lịch nữa,
  * **I want to** ngắt kết nối Google Calendar dễ dàng và tùy chọn giữ lại hay xóa các sự kiện đã tạo,
  * **So that** tôi làm chủ hoàn toàn quyền truy cập dữ liệu bên thứ ba của mình.

```gherkin
Feature: Revoke Google Calendar Integration
  As a privacy-conscious user
  I want to disconnect Google Calendar at any time
  So that third-party sync is severed cleanly

  Scenario: Hủy kết nối Google Calendar thành công
    Given Người dùng đang có kết nối Google Calendar đang hoạt động
    When Người dùng nhấn "Ngắt kết nối Lịch"
    And Chọn "Giữ lại các sự kiện cũ trên Google Calendar"
    Then Backend xóa token OAuth đã lưu trữ và hủy Webhook channel với Google
    And Đặt cờ google_calendar_connected = false
    And Giữ nguyên các trường deadline trong Orbit mà không làm mất dữ liệu
    And Hiển thị thông báo: "Đã ngắt kết nối an toàn."
```
