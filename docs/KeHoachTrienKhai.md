# Kế hoạch triển khai: Hệ thống Quản lý Nhà hàng & Đặt món

## Đề xuất Công nghệ (Tech Stack) Mới

- **Cơ sở dữ liệu (Database):** **Neon (Serverless Postgres 17)** kết hợp với **Prisma ORM**. PostgreSQL đảm bảo tính toàn vẹn dữ liệu cực tốt cho các nghiệp vụ thanh toán, đơn hàng. Neon cung cấp khả năng scale linh hoạt và quản lý connection hiệu quả.
- **Front-end / Client:** **React.js** (sử dụng **Vite** để tốc độ build nhanh nhất) kết hợp với **Tailwind CSS** để tạo giao diện Dashboard và POS mượt mà, chuyên nghiệp. Sử dụng `axios` gọi API.
- **Back-end (RESTful API):** Node.js với Express.js, Custom code phù hợp với dự án.
- **Xác thực & Phân quyền:** JSON Web Tokens (JWT) kết hợp với Middleware kiểm tra Role (Nhân viên, Quản lý).
- **Upload File:** `multer` kết hợp với lưu trữ trên Cloud (**Cloudinary**) để trả về đường dẫn tĩnh chuyên nghiệp.

---

## Thiết kế Cơ sở dữ liệu (10 Models - Prisma/Postgres Schema)

*Sử dụng `id` kiểu **UUID** cho tất cả các bảng để tăng tính bảo mật và dễ kiểm soát.*

1. **User:** `id` (UUID, PK), `name`, `email`, `password`, `role` (Enum: CUSTOMER, STAFF, MANAGER), `phone`.
2. **Table:** `id` (UUID, PK), `tableNumber`, `floor`, `capacity`, `status` (Enum: AVAILABLE, OCCUPIED, RESERVED).
3. **Category:** `id` (UUID, PK), `name` (Món chính, Khai vị...), `description`.
4. **Food:** `id` (UUID, PK), `name`, `description`, `price`, `imageUrl`, `categoryId` (FK -> Category), `status` (Boolean/Enum).
5. **Ingredient:** `id` (UUID, PK), `name`, `unit`, `stockQuantity`, `reorderLevel`.
6. **Promotion:** `id` (UUID, PK), `code`, `discountPercentage`, `startDate`, `endDate`, `isActive`.
7. **Reservation:** `id` (UUID, PK), `userId` (FK -> User), `tableId` (FK -> Table), `reservationTime`, `guestCount`, `status`.
8. **Order:** `id` (UUID, PK), `staffId` (FK -> User), `tableId` (FK -> Table), `status` (Enum: PENDING, PREPARING, SERVED, PAID), `totalAmount`, `createdAt`, `updatedAt`.
9. **OrderItem:** (Tách Table riêng để query chi tiết tốt hơn) `id` (UUID, PK), `orderId` (FK -> Order), `foodId` (FK -> Food), `quantity`, `priceAtTimeOfOrder`, `notes`.
10. **Invoice:** `id` (UUID, PK), `orderId` (FK -> Order), `promotionId` (FK -> Promotion, Nullable), `finalAmount`, `paymentMethod`, `paymentStatus` (Enum: PAID, REFUNDED), `createdAt`.

---

## Chi tiết Triển khai Tính năng Nổi bật

### 1. Phân quyền (Role-based Access Control)
- **Cơ chế:** Middleware phân tích JWT Token để kiểm tra giá trị `role`.
- **Manager:** Được cấp quyền thực thi trên mọi Route API.
- **Staff:** Chỉ được call API tạo đơn hàng, cập nhật OrderItem, xem menu và thông tin khách hàng, **không được cấp quyền** xóa hóa đơn hay nhân sự.

### 2. Quản trị vòng đời Hóa đơn (Không Xóa)
- Endpoint `DELETE /api/v1/invoices/:id` sẽ xử lý cẩn thận:
- Nếu trạng thái thanh toán `invoice.paymentStatus === 'PAID'`, backend trực tiếp ném ra HTTP Status 403 (Forbidden) với thông báo: "Giao dịch đã tât toán, không thể xóa bỏ để đảm bảo tính an toàn dữ liệu".

### 3. Tối ưu ảnh hiển thị
- FE gửi FormData (dữ liệu kèm file ảnh) lên api đăng ký món ăn.
- Backend sử dụng Middleware `multer` upload trực tiếp Buffer lên Cloudinary qua thư viện `cloudinary`. Kết quả trả về chứa thuộc tính `secure_url` sẽ được đưa vào database trường `imageUrl` của món ăn.

---

## Cấu trúc Dự án Đề xuất (Monorepo)

```text
NNPTUD_DACK/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma # Định nghĩa Schema Postgres và thông tin kết nối Neon
│   ├── src/
│   │   ├── config/       # Instance Prisma Client, cấu hình Cloudinary, Env
│   │   ├── controllers/  # Logic xử lý HTTP request/response
│   │   ├── middlewares/  # Auth, Phân quyền Role, Upload Multer
│   │   ├── models/       # Khai báo các Wrapper Class/Interface xử lý Database với Prisma hoặc Validation Schemas (Zod/Joi)
│   │   ├── routes/       # Khai báo tuyến đường (/api/v1/users, ...)
│   │   ├── services/     # (Tuỳ chọn) Tách logic nghiệp vụ sâu
│   │   └── server.js     # Chạy ứng dụng Express
│   └── package.json
├── frontend/             # Ứng dụng React / Vite
│   ├── src/
│   │   ├── assets/       # Style, image global
│   │   ├── components/   # UI chung (Button, Modal, TableList)
│   │   ├── pages/        # Các view chính (Login, Dashboard, POS)
│   │   ├── context/      # Context API (Auth, Cart/OrderState)
│   │   ├── services/     # File bọc axios config Authorization header
│   │   └── App.jsx
│   ├── index.html
│   ├── tailwind.config.js
│   └── package.json
└── README.md
```
