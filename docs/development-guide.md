# Hướng dẫn phát triển

## Làm việc cục bộ

Làm theo [README](../README.md) để cấu hình môi trường, chạy PostgreSQL và migration. Dùng Node.js 22 LTS theo `.nvmrc` và chạy lệnh npm ở root.

| Lệnh                                           | Công việc                                                |
| ---------------------------------------------- | -------------------------------------------------------- |
| `npm ci`                                       | Cài theo lockfile và sinh Prisma Client                  |
| `npm install`                                  | Cập nhật dependency resolution và sinh Prisma Client     |
| `npm run dev`                                  | Chạy hai ứng dụng đồng thời                              |
| `npm run dev:backend` / `npm run dev:frontend` | Chạy một ứng dụng                                        |
| `npm run lint`                                 | Kiểm tra ESLint hai workspace và script                  |
| `npm run format` / `npm run format:check`      | Định dạng hoặc chỉ kiểm tra                              |
| `npm run typecheck`                            | Kiểm tra TypeScript strict mode                          |
| `npm test` / `npm run test:integration`        | Unit tests hoặc suite tích hợp PostgreSQL                |
| `npm run build`                                | Biên dịch API và build Next.js                           |
| `npm run db:generate`                          | Sinh Prisma Client                                       |
| `npm run db:migrate -- --name <ten>`           | Tạo và áp dụng migration phát triển                      |
| `npm run db:deploy`                            | Áp dụng các migration đã commit                          |
| `npm run db:admin -- <email>`                  | Cấp role ADMIN cho tài khoản hiện có và thu hồi phiên cũ |
| `npm run check:changes -- --all`               | Kiểm tra file nhạy cảm và mẫu credential phổ biến        |

Khi cần sửa schema, tạo migration bằng `db:migrate` trên DB phát triển, đọc SQL, chạy tests và commit migration cùng schema. Giữ `package-lock.json` ở root. Tệp `.env` thực tế chỉ để ở máy local hoặc trong hệ thống cấu hình triển khai.

Root dùng npm overrides để chọn Vite 7 tương thích Vitest và tránh lỗi giải optional peer trên npm 10. Các override cho `deepmerge-ts` và `minimatch` chọn bản vá cho Prisma CLI và bộ lint. Khi nâng các package gốc, kiểm tra dependency tree và `npm audit` trước khi bỏ override.

## Kiểm thử tích hợp

Tạo cơ sở dữ liệu riêng một lần, với user PostgreSQL theo cấu hình Compose. Lệnh dưới đây dùng tên mặc định.

```sh
docker compose exec postgres createdb -U bav_connect bav_connect_test
```

Đặt `TEST_DATABASE_URL` bằng URL riêng trỏ tới DB vừa tạo, có `?schema=bav_test`. Thay phần mật khẩu ví dụ bằng giá trị đã mã hóa theo URL. Trong PowerShell, chạy các lệnh sau.

```powershell
$env:TEST_DATABASE_URL = 'postgresql://bav_connect:<password>@localhost:5432/bav_connect_test?schema=bav_test'
$env:DATABASE_URL = $env:TEST_DATABASE_URL
npm run db:deploy
npm run test:integration
Remove-Item Env:DATABASE_URL
Remove-Item Env:TEST_DATABASE_URL
```

Trong Bash hoặc Zsh, dùng `export TEST_DATABASE_URL='…'`, sau đó `DATABASE_URL="$TEST_DATABASE_URL" npm run db:deploy` và `npm run test:integration`. Suite tạo tài khoản, danh mục, bài đăng và audit bằng ID riêng, rồi xóa đúng các bản ghi của lượt chạy. Suite yêu cầu migration được áp dụng trước.

## GitHub Actions và bảo vệ nhánh

- **Backend CI** · job `Backend quality` chạy lint, format, generate Prisma, typecheck, unit tests, migration và integration tests với PostgreSQL 17, rồi build.
- **Frontend CI** · job `Frontend quality` chạy lint, format, typecheck, unit tests và Next.js build.
- **Pull request validation** · job `PR metadata and changes` kiểm tra tiêu đề PR, tên tệp thay đổi, mẫu credential, định dạng và lint script. PR dùng Conventional Commit title.

Sau khi push lần đầu, mở một PR để GitHub ghi nhận đủ ba tên job. Vào **Settings → Rules → Rulesets** hoặc **Settings → Branches**, bảo vệ `main` và chọn ba job nói trên trong danh sách required status checks. Bật Require a pull request before merging, Require status checks to pass, Require branches to be up to date nếu đội dùng chế độ strict, chặn force push và chặn xóa nhánh. Có thể áp dụng quy tắc tương tự cho `develop`.

## Triển khai

CI hiện kiểm tra thay đổi mã nguồn. Khi có môi trường AWS và thông tin hosting, thêm job release có approval phù hợp, cấu hình DB và JWT secret qua môi trường chạy, rồi dùng `npm run db:deploy` để áp dụng migration. Next.js cần URL API công khai tại thời điểm build. Backend cần origin HTTPS chính xác và runtime hỗ trợ kết nối Socket.IO nếu mở rộng chat.
