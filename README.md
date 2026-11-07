# BAV-Connect

## Tổng quan dự án

BAV-Connect là chợ đồ dùng học tập và sinh hoạt dành cho cộng đồng sinh viên Học viện Ngân hàng. Repository là nền tảng phát triển Marketplace của đội ICU Code tại DEV Champion.

## Mục tiêu

- Giúp sinh viên tìm và trao đổi giáo trình, đồng phục, thiết bị và đồ dùng cũ.
- Cho người đăng theo dõi trạng thái tin và cho quản trị viên kiểm duyệt trước khi công khai.
- Xây dựng nền tảng có xác thực, phân quyền, migration và kiểm tra tự động cho từng Pull Request.

## Tính năng chính

| Hoạt động                                                                    | Trạng thái                                                              |
| ---------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Đăng ký, đăng nhập, đăng xuất, xem hồ sơ                                     | Có API và giao diện                                                     |
| Danh mục, danh sách và chi tiết tin đã duyệt, tìm theo từ khóa, lọc danh mục | Có API và giao diện                                                     |
| Đăng tin, theo dõi tin của mình                                              | Có API và giao diện                                                     |
| Danh sách người dùng, duyệt và từ chối tin, lưu audit                        | Có API và giao diện quản trị. Audit được lưu trong cơ sở dữ liệu        |
| Cập nhật hồ sơ, sửa và xóa tin, bình luận, chat và báo cáo                   | Có schema hoặc route scaffold, theo [bảng API](docs/api-conventions.md) |
| Quản trị danh mục, khóa người dùng, xử lý báo cáo, thống kê                  | Route scaffold                                                          |

## Vai trò

| Vai trò | Quyền đã triển khai                                                                 |
| ------- | ----------------------------------------------------------------------------------- |
| USER    | Xem hồ sơ, tạo tin, theo dõi tin của mình. Mọi người đều xem được tin đã duyệt      |
| ADMIN   | Quyền của USER, xem danh sách người dùng, xem tin chờ duyệt, duyệt hoặc từ chối tin |

Tài khoản mới luôn có vai trò USER. Backend kiểm tra role và trạng thái tài khoản trên các endpoint cần xác thực.

## Công nghệ

- **Backend** · Node.js 22 LTS, Express 5, TypeScript 5, Prisma ORM 6, PostgreSQL 17, JWT, bcryptjs, Socket.IO 4, Zod 4, Helmet, CORS và Morgan.
- **Frontend** · Next.js 16 App Router, React 19, Tailwind CSS 4, Fetch API, React Hook Form và Zod.
- **Phát triển** · npm Workspaces, Docker Compose, ESLint, Prettier, Vitest, Supertest và GitHub Actions. Phiên bản cụ thể trong `package-lock.json`.

## Kiến trúc hệ thống

```mermaid
flowchart LR
  Browser["Trình duyệt"] --> Web["Next.js App Router"]
  Web --> API["Express REST API"]
  Browser -->|Cookie HttpOnly| API
  Browser -. Socket.IO .-> API
  API --> DB["Prisma và PostgreSQL"]
```

Next.js tải dữ liệu công khai trên server. Trình duyệt gửi cookie trực tiếp đến API cho các tác vụ cá nhân. [Chi tiết kiến trúc](docs/architecture.md).

## Cấu trúc repository

```text
BAV-Connect/
  .github/workflows/   Backend CI, Frontend CI và PR validation
  backend/
    prisma/            Schema, migration và lệnh cấp quyền admin
    src/               Config, routes, middleware, controller, service, repository và sockets
    tests/             Unit và integration tests
  frontend/
    public/            Logo SVG
    src/               App Router, UI, feature, hook, API client và styles
    tests/             Kiểm thử client API và form schema
  docs/                Kiến trúc, dữ liệu, API và hướng dẫn phát triển
  scripts/             Kiểm tra tiêu đề PR, tệp thay đổi và dấu hiệu lộ credential
```

## Cơ sở dữ liệu

Migration tạo 11 entity, khóa ngoại, chỉ mục và các vai trò/danh mục khởi tạo. Mọi danh sách lấy dữ liệu thật từ PostgreSQL. [Thiết kế dữ liệu](docs/database-design.md).

## Yêu cầu môi trường

Node.js 22.13 trở lên trong dòng 22 LTS, npm 10 trở lên, Git và Docker có Compose v2. PostgreSQL 17 chạy riêng cũng dùng được nếu cấu hình đúng URL.

## Cài đặt

Từ thư mục gốc, chạy `npm ci` để cài hai workspace theo lockfile. `npm install` dùng khi thay đổi dependencies. Cả hai lệnh đều sinh Prisma Client qua lifecycle của root.

## Cấu hình môi trường

### Xem giao diện và chạy backend ngay

Sau `npm ci`, chạy `npm run dev:preview` để mở frontend tại `http://localhost:3000` và API health tại `http://localhost:4000/api/v1/health`. Lệnh dùng cấu hình local tự tạo và tắt truy cập cơ sở dữ liệu. Các API dữ liệu trả HTTP 503 để giao diện hiển thị trạng thái chưa có dữ liệu. Chế độ này phục vụ phát triển giao diện và khung API.

### Cấu hình luồng có lưu dữ liệu

Sao chép `.env.example` thành `.env`, `backend/.env.example` thành `backend/.env` và `frontend/.env.example` thành `frontend/.env.local`. Điền mật khẩu PostgreSQL do bạn tự tạo vào tệp root. Điền `DATABASE_URL` vào tệp backend bằng mẫu trong tệp ví dụ, mã hóa phần mật khẩu theo URL. Tạo JWT secret độc lập bằng lệnh sau và ghi vào `JWT_ACCESS_SECRET` ở backend.

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Giữ `FRONTEND_URL=http://localhost:3000` và `NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1` khi dùng các cổng mặc định. Mở web bằng hostname `localhost` để origin và cookie khớp. `JWT_REFRESH_SECRET` dành cho luồng refresh sau này và có thể để trống.

## Chạy PostgreSQL bằng Docker

```sh
docker compose up -d --wait postgres
docker compose ps
```

Compose chỉ mở cổng trên loopback và giữ dữ liệu trong named volume. Cấu hình cổng bằng `POSTGRES_PORT` và cập nhật URL backend tương ứng.

## Migration

```sh
npm run db:deploy
```

Dùng `npm run db:migrate -- --name <ten_migration>` để tạo migration mới trên môi trường phát triển. Sau khi sửa schema, chạy lại `npm run db:generate` nếu Prisma Client cần cập nhật.

## Chạy Backend

```sh
npm run dev:backend
curl http://localhost:4000/api/v1/health
```

Để cấp quyền quản trị viên local, tạo tài khoản qua trang Đăng ký, sau đó chạy `npm run db:admin -- email-da-dang-ky@example.org` và đăng nhập lại.

## Chạy Frontend

```sh
npm run dev:frontend
```

Mở [localhost:3000](http://localhost:3000). Có thể chạy cả hai ứng dụng trong một lệnh bằng `npm run dev`.

## Chạy kiểm thử

```sh
npm test
npm run test:integration
```

`npm test` chạy unit tests của cả hai workspace. Integration tests cần URL riêng với `schema=bav_test` và migration đã chạy. [Cách tạo cơ sở dữ liệu kiểm thử](docs/development-guide.md#kiểm-thử-tích-hợp).

## Build dự án

```sh
npm run lint
npm run format:check
npm run typecheck
npm run build
```

Khởi động bản build bằng `npm start -w backend` và `npm start -w frontend`. Next.js đọc `NEXT_PUBLIC_API_URL` ở thời điểm build cho mã chạy trên trình duyệt.

## Git workflow

Tạo nhánh tính năng từ `develop`, mở Pull Request và đặt tên theo mẫu `feat(api): add post search`. Khi dùng ZIP, giải nén rồi thực hiện trong thư mục `BAV-Connect`. Nếu dùng bản thư mục đã có Git, bắt đầu từ `git add .`. Thay URL ví dụ bằng URL repository GitHub trống của đội.

```sh
git init -b main
git add .
git commit -m "chore: initialize BAV-Connect"
git remote add origin https://github.com/OWNER/BAV-Connect.git
git push -u origin main
git switch -c develop
git push -u origin develop
```

## GitHub Actions CI/CD

Backend CI và Frontend CI chạy trên push và PR vào `main` hoặc `develop`. Workflow PR validation kiểm tra tiêu đề, tệp thay đổi và format. [Thiết lập branch protection và phạm vi CD](docs/development-guide.md#github-actions-và-bảo-vệ-nhánh).

## Đóng góp

Chạy lint, format, typecheck, test và build trước khi mở PR. Đưa thay đổi schema và migration vào cùng PR. Cập nhật tài liệu API nếu thêm hoặc đổi endpoint. Dùng `npm run check:changes -- --all` để rà soát tệp cục bộ.

## Giấy phép

[MIT](LICENSE).
#   B A V _ C O N N E C T  
 