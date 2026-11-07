# Thiết kế cơ sở dữ liệu

Schema nằm ở `backend/prisma/schema.prisma`. PostgreSQL dùng UUID cho khóa chính và khóa ngoại liên quan. Các bản ghi thay đổi có `createdAt` và `updatedAt` khi phù hợp. Thời gian trong API dùng ISO 8601.

| Entity                  | Trách nhiệm và ràng buộc                                                                    |
| ----------------------- | ------------------------------------------------------------------------------------------- |
| Role                    | Vai trò ADMIN và USER, tên vai trò duy nhất                                                 |
| User                    | Email duy nhất, hash mật khẩu, vai trò, trạng thái ACTIVE/BLOCKED/INACTIVE, phiên bản phiên |
| Category                | Danh mục, slug duy nhất, trạng thái hoạt động                                               |
| Post                    | Tác giả, danh mục, nội dung, giá VND nguyên tùy chọn, trạng thái và thời điểm xóa mềm       |
| PostImage               | URL ảnh theo bài, thứ tự duy nhất trong bài                                                 |
| Comment                 | Bình luận theo bài, tác giả, liên kết bình luận cha cùng bài, hỗ trợ xóa mềm                |
| Conversation            | Định danh hội thoại                                                                         |
| ConversationParticipant | Người tham gia, duy nhất theo cặp hội thoại và người dùng                                   |
| Message                 | Tin theo hội thoại. Khóa ngoại ghép yêu cầu người gửi thuộc hội thoại                       |
| Report                  | Người báo cáo, lý do, trạng thái xử lý, đích là một bài hoặc một người dùng                 |
| AuditLog                | Tác nhân, hành động, loại và ID đối tượng, metadata tùy chọn                                |

## Trạng thái và truy vấn

Tin mới bắt đầu `PENDING`. Admin chuyển sang `APPROVED` hoặc `REJECTED`. Thao tác chuyển trạng thái và ghi audit dùng cùng transaction. `HIDDEN` và `SOLD` được dự trù trong schema. Truy vấn công khai chỉ lấy tin đã duyệt, chưa xóa, thuộc danh mục hoạt động và do tài khoản hoạt động đăng.

Chỉ mục hỗ trợ danh sách tin theo trạng thái, danh mục hoặc tác giả, tin nhắn theo hội thoại và thời gian, báo cáo theo trạng thái, audit theo tác nhân hoặc đối tượng. Tìm từ khóa hiện dùng phép chứa không phân biệt hoa thường của PostgreSQL. Khóa ngoại dùng `Restrict` để giữ dữ liệu liên quan và audit.

## Migration và dữ liệu khởi tạo

Migration đầu tiên tạo bảng, hai role và các danh mục mặc định như giáo trình, đồng phục và đồ dùng học tập. Migration có thêm CHECK cho giá, vị trí ảnh và đích báo cáo. Giữ các ràng buộc SQL này khi chỉnh migration tiếp theo. Migration đã áp dụng được quản lý qua `_prisma_migrations`.
