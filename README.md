# NNPTUD_DACK - Hệ thống Quản lý Nhà hàng

Dự án này bao gồm hai phần chính: **Frontend** (sử dụng React + Vite) và **Backend** (sử dụng Node.js, Prisma và lưu trữ cơ sở dữ liệu trên Neon PostgreSQL).

---

## 🗂️ Cấu trúc thư mục

- `frontend/`: Chứa mã nguồn giao diện người dùng người dùng (UI).
- `backend/`: Chứa mã nguồn máy chủ xử lý logic và thao tác với Database.
- `docs/`: Chứa các tài liệu thiết kế và kế hoạch triển khai của dự án.

---

## ⚙️ Yêu cầu môi trường

- **Node.js**: Cần phiên bản v18.x trở lên.
- **Git**
- **Trình chỉnh sửa mã**: Khuyên dùng [Visual Studio Code](https://code.visualstudio.com/) với các Extension cho React, TailwindCSS và Prisma.

---

## 🚀 Hướng dẫn Cài đặt & Chạy dự án ở máy Local

### 1. Thiết lập Backend

Mở terminal và di chuyển vào thư mục `backend`:
```bash
cd backend
```

**Bước 1.1: Cài đặt các thư viện (Dependencies)**
```bash
npm install
```

**Bước 1.2: Cấu hình biến môi trường**
- Tạo một file tên là `.env` ngay trong thư mục `backend/` (cùng cấp với tệp `package.json`).
- Nhập thông tin kết nối Database của Neon vào file `.env` (thay thế bằng URL thật do nhóm cung cấp):
  ```env
  DATABASE_URL="postgres://<user>:<password>@<neon-url>.neon.tech/<dbname>?sslmode=require"
  ```
*(Lưu ý: Tuyệt đối không push file `.env` này lên Github).*

**Bước 1.3: Cài đặt Prisma Client (ORMs)**
Chạy lệnh sau để tải Prisma Client làm cầu nối tương tác với Database:
```bash
npx prisma generate
```

**Bước 1.4: Chạy server Backend**
Khởi động máy chủ backend (hiện tại entry point mặc định có thể nằm ở `src/index.js` hoặc file chính):
```bash
node src/index.js
```
*(Nếu sau này dự án được thêm lệnh start, bạn có thể chạy `npm start` hoặc `npm run dev` theo cấu hình).*

---

### 2. Thiết lập Frontend

Mở một cửa sổ Terminal thứ hai, sau đó di chuyển vào thư mục `frontend`:
```bash
cd frontend
```

**Bước 2.1: Cài đặt các thư viện (Dependencies)**
```bash
npm install
```

**Bước 2.2: Chạy Frontend ở chế độ môi trường phát triển (Dev Mode)**
```bash
npm run dev
```

- Chờ một vài giây, Terminal sẽ hiển thị đường dẫn truy cập môi trường local (Ví dụ: `http://localhost:5173/`).
- Mở đường dẫn trên ở trình duyệt để bắt đầu trải nghiệm dự án.

---

### Mẹo nhanh khi sử dụng Git:
Xin lưu ý không commit các file nhạy cảm và file rác lên Git (đã được cấu hình trong file `.gitignore`):
- `node_modules/`
- `.env`
- Các thư mục build như `dist/`
- Code Prisma được auto-generate.