# Báo cáo phát triển Orbit ngày 18/11/2026

## Mục tiêu trong ngày

Hoàn thiện luồng sử dụng cốt lõi cho người dùng ADHD, từ ghi một việc thật đến tìm lại việc, chọn bước tiếp theo và bắt đầu tập trung. Chuẩn bị bản Android cục bộ để kiểm thử với dữ liệu của từng tài khoản.

## Công việc đã thực hiện

- **Chạy cục bộ với SQLite.** Bổ sung profile SQLite để chạy backend trên máy phát triển. Tài khoản và công việc được lưu trong `backend/orbit-local.sqlite`. Có tùy chọn bật chế độ khách riêng cho bản thử trên máy.
- **Phân quyền theo tài khoản.** Backend xác định người dùng từ phiên đăng nhập và kiểm tra quyền sở hữu khi truy cập bảng, việc, checklist, phiên tập trung, streak hoặc gợi ý chia việc. Mobile lưu token vào SecureStore và tách bộ nhớ đệm theo tài khoản.
- **Sửa luồng đăng ký và đăng nhập.** Đồng bộ màu sắc và biểu tượng của màn tài khoản và splash với giao diện Orbit. Form báo trường nhập thiếu hoặc sai định dạng, email đã đăng ký và sai thông tin đăng nhập. Đăng ký thành công sẽ hiện thông báo, điền sẵn email và chuyển về màn đăng nhập. Mật khẩu được băm bằng BCrypt.
- **Hoàn thiện màn Hôm nay và Bảng.** Hôm nay giữ một thẻ nổi bật cho bước tiếp theo và có danh sách việc đang chờ để cuộn tìm lại. Bảng gộp Đã ghi và Cần làm thành tab **Chờ làm** ở giao diện. Việc thuộc bảng đã lưu trữ được ẩn khỏi Hôm nay sau khi mở lại app và bảng vẫn xuất hiện trong phần quản lý.
- **Thiết kế lại Chi tiết việc.** Đưa bước tiếp theo và nút chính lên đầu. Người dùng có thể thêm bước thủ công, sửa gợi ý trước khi lưu, hoặc tiếp tục việc đang tập trung. Orbit duy trì giới hạn một việc ở trạng thái Đang làm.
- **Thêm chuyển ngôn ngữ Việt–Anh.** Nút VI/EN ở góc trên bên phải của các màn chính và màn con liên quan. App ghi nhớ lựa chọn trên thiết bị và giữ nguyên nội dung đã lưu, bản nháp và bộ đếm khi đổi ngôn ngữ.
- **Cập nhật tích hợp Gemini.** Backend gửi tiêu đề và ghi chú để yêu cầu 3–5 bước theo ngôn ngữ giao diện. Bước đầu từ 1 đến 4 phút, các bước còn lại tối đa 20 phút. Thiếu key, phản hồi lỗi hoặc quá 3 giây sẽ dùng **Gợi ý nhanh**. Model mặc định là `gemini-3.5-flash-lite` và có thể cấu hình qua `GEMINI_MODEL`.

## Kiểm thử

| Phạm vi | Kết quả |
| --- | --- |
| Backend Maven | 33 test đạt, gồm quyền sở hữu, giới hạn một việc đang làm, bảng lưu trữ và phản hồi Gemini giả lập |
| Mobile TypeScript | `tsc --noEmit` đạt |
| Android với hai tài khoản | Đăng ký rồi đăng nhập, làm mới phiên hết hạn và kiểm tra dữ liệu khi đổi tài khoản |
| Android với danh sách việc | Ghi ba việc riêng, cuộn mở từng việc, kiểm tra dữ liệu sau khi mở lại và đổi bảng |
| Android với VI/EN và checklist | Giữ ghi chú chưa lưu và bộ đếm khi đổi ngôn ngữ, ghi nhớ lựa chọn, thêm bước thủ công và lưu gợi ý để quay về Chi tiết việc |

## Phần còn lại

- Cấu hình `GEMINI_API_KEY` trên backend và đánh giá chất lượng, độ trễ của phản hồi thật trên một số loại việc. Bản Android hiện dùng gợi ý dự phòng. Các trường hợp phản hồi hợp lệ, không hợp lệ và quá thời gian đã được kiểm thử với phản hồi giả lập.
- Xác nhận splash gốc trên bản cài Android riêng. Các lần chạy trong ngày dùng Expo Go.
- Trước khi mở beta công khai, hoàn thiện khôi phục mật khẩu và thu hồi phiên phía máy chủ.
