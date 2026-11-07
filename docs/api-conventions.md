# Quy ước API

API JSON có prefix `/api/v1`. ID dùng UUID. Thành công trả `{ "success": true, "message": "Request successful", "data": {} }` với `data` tùy endpoint. Lỗi trả `{ "success": false, "message": "...", "errors": [] }`. Lỗi validation có `errors` dạng danh sách `{ "field": "...", "message": "..." }`.

| HTTP      | Ý nghĩa                                                                                  |
| --------- | ---------------------------------------------------------------------------------------- |
| 200 / 201 | Thành công / tạo mới                                                                     |
| 400 / 413 | JSON sai cú pháp / body quá lớn                                                          |
| 401 / 403 | Thiếu hoặc hết hạn phiên / thiếu quyền, tài khoản không hoạt động hoặc origin bị từ chối |
| 404 / 409 | Không tìm thấy / trùng email hoặc trạng thái duyệt đã thay đổi                           |
| 422 / 429 | Input không hợp lệ / vượt giới hạn thử đăng nhập hoặc đăng ký                            |
| 500 / 501 | Lỗi máy chủ / endpoint đã định tuyến cho phần triển khai sau                             |

## Endpoint đang hoạt động

| Method và path                                  | Quyền     | Input hoặc hành vi                                                   |
| ----------------------------------------------- | --------- | -------------------------------------------------------------------- |
| GET `/health`                                   | Công khai | Kiểm tra HTTP server                                                 |
| POST `/auth/register`                           | Công khai | `email`, `password`, `displayName`                                   |
| POST `/auth/login`                              | Công khai | `email`, `password`; trả user và cookie access                       |
| POST `/auth/logout`                             | Đăng nhập | Thu hồi access token hiện có của tài khoản, xóa cookie               |
| GET `/users/profile`                            | Đăng nhập | Hồ sơ tài khoản hiện tại                                             |
| GET `/categories`                               | Công khai | Danh mục đang hoạt động                                              |
| GET `/posts`                                    | Công khai | `page`, `limit`, `q`, `category` (slug). Chỉ trả tin công khai       |
| GET `/posts/:id`                                | Công khai | Chi tiết tin công khai                                               |
| GET `/posts/mine`                               | Đăng nhập | `page`, `limit`; tin chưa xóa của tài khoản hiện tại                 |
| POST `/posts`                                   | Đăng nhập | `title`, `description`, `categoryId`, `price` (VND nguyên, tùy chọn) |
| GET `/admin/users`                              | ADMIN     | `page`, `limit`; trả trường tài khoản công khai cho admin            |
| GET `/admin/posts/pending`                      | ADMIN     | `page`, `limit`; trả tin chờ duyệt                                   |
| PATCH `/admin/posts/:id/approve` hoặc `/reject` | ADMIN     | Chuyển trạng thái từ PENDING và ghi audit                            |

`page` mặc định 1, tối đa 1.000. `limit` mặc định 20, tối đa 50. Phân trang trả mảng. Giá bỏ trống được trả là `null`. Mật khẩu có ít nhất tám ký tự và tối đa 72 byte UTF-8. Khi gọi API từ trình duyệt, gửi `credentials: 'include'` và dùng đúng `FRONTEND_URL`.

## Endpoint scaffold

Những endpoint này trả 501 khi người gọi đã thỏa quyền truy cập. Chúng dành chỗ cho hợp đồng API sau này.

| Method và path                                                               | Quyền                                               |
| ---------------------------------------------------------------------------- | --------------------------------------------------- |
| PATCH `/users/profile`                                                       | Đăng nhập                                           |
| PUT, DELETE `/posts/:id`                                                     | Đăng nhập. Luồng triển khai cần kiểm tra chủ bài    |
| GET `/posts/:id/comments`                                                    | Công khai                                           |
| POST `/posts/:id/comments`, PATCH và DELETE `/comments/:id`                  | Đăng nhập                                           |
| GET và POST `/conversations`, GET và POST `/conversations/:id/messages`      | Đăng nhập. Luồng triển khai cần kiểm tra thành viên |
| POST `/reports`                                                              | Đăng nhập                                           |
| PATCH `/admin/users/:id/status`                                              | ADMIN                                               |
| GET `/admin/posts`, PATCH `/admin/posts/:id/hide`, DELETE `/admin/posts/:id` | ADMIN                                               |
| GET và POST `/admin/categories`, PATCH và DELETE `/admin/categories/:id`     | ADMIN                                               |
| DELETE `/admin/comments/:id`                                                 | ADMIN                                               |
| GET `/admin/reports`, PATCH `/admin/reports/:id`                             | ADMIN                                               |
| GET `/admin/audit-logs`, GET `/admin/stats`                                  | ADMIN                                               |

## Socket.IO

Kết nối tới API origin qua path Socket.IO mặc định `/socket.io`. Client trình duyệt cần `withCredentials: true`. Socket dùng cookie đăng nhập và kiểm tra origin khi kết nối. Sự kiện `session:check` trả acknowledgement `{ authenticated: boolean }` và ngắt kết nối nếu phiên đã hết hạn hoặc bị thu hồi. Sự kiện chat, room và gửi tin sẽ được bổ sung khi triển khai luồng hội thoại.
