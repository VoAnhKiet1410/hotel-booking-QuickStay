# 🏨 QuickStay — Hotel Booking Platform

> Nền tảng đặt phòng khách sạn trực tuyến Full-Stack, xây dựng theo kiến trúc **Microservices** với React, Node.js, MongoDB, Stripe và Socket.IO.

![Node.js](https://img.shields.io/badge/Node.js-20-339933?logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)
![Stripe](https://img.shields.io/badge/Stripe-008CDD?logo=stripe&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-010101?logo=socket.io&logoColor=white)
![Clerk](https://img.shields.io/badge/Clerk-Auth-6C47FF?logo=clerk&logoColor=white)
![Cloudinary](https://img.shields.io/badge/Cloudinary-3448C5?logo=cloudinary&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)

---

## 📋 Mục Lục

- [Tổng Quan](#-tổng-quan)
- [Kiến Trúc](#-kiến-trúc)
- [Tech Stack](#-tech-stack)
- [Tính Năng](#-tính-năng)
- [Cấu Trúc Dự Án](#-cấu-trúc-dự-án)
- [Cài Đặt & Chạy Local](#-cài-đặt--chạy-local)
- [Deploy Production](#-deploy-production)
- [Biến Môi Trường](#-biến-môi-trường)

---

## 🎯 Tổng Quan

**QuickStay** là hệ thống đặt phòng khách sạn hoàn chỉnh, hỗ trợ **2 vai trò người dùng**:

| Vai trò | Mô tả |
|---------|-------|
| 🧑‍💼 **Guest** | Tìm kiếm, đặt phòng, thanh toán online, chat với khách sạn, đánh giá |
| 🏢 **Hotel Owner** | Quản lý phòng, booking, doanh thu, housekeeping, night audit, khuyến mãi |

**Điểm nổi bật:**
- 🔐 Xác thực qua **Clerk** (Google, Email/Password)
- 💳 Thanh toán an toàn qua **Stripe Checkout**
- 💬 Chat **real-time** với Socket.IO
- 🔔 Thông báo tức thời (pusher + email)
- 🌙 **Night Audit** chuẩn nghiệp vụ khách sạn OTA
- 💰 Chính sách hoàn tiền phân tầng tự động

---

## 🏗️ Kiến Trúc

### Kiến trúc Microservices (Local Development)

```
┌─────────────────────────────────────────────────────────┐
│                 Client (React + Vite)                    │
│                  http://localhost:5173                    │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│              API Gateway (:3000)                         │
│        Express Reverse Proxy + CORS + Auth               │
└──┬────┬────┬────┬────┬────┬────┬────┬────┬─────────────┘
   │    │    │    │    │    │    │    │    │
   ▼    ▼    ▼    ▼    ▼    ▼    ▼    ▼    ▼
 Auth Hotl Book Pay  Noti Chat Revw Prom  Ops
:3001:3002:3003:3004:3005:3006:3007:3008:3009
   │    │    │    │    │    │    │    │    │
   └────┴────┴────┴────┴────┴────┴────┴────┘
                      │
                      ▼
              ┌──────────────┐
              │ MongoDB Atlas │
              └──────────────┘
```

### Kiến trúc Monolith (Production — Deploy miễn phí)

```
┌─────────────────────────────────────────────────────────┐
│                 Client (React + Vite)                    │
│            https://quickstay.vercel.app                  │
└─────────────────────┬───────────────────────────────────┘
                      │ HTTPS
                      ▼
┌─────────────────────────────────────────────────────────┐
│          QuickStay Monolith Server (:3000)               │
│   (Auth + Hotel + Booking + Payment + Notification       │
│    + Chat + Review + Promo + Operations — in 1 process) │
│                  Railway / Render                         │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
              ┌──────────────┐
              │ MongoDB Atlas │
              │  (Free M0)    │
              └──────────────┘
```

---

## 🛠️ Tech Stack

### Frontend
| Công nghệ | Phiên bản | Vai trò |
|-----------|-----------|---------|
| React | 19 | UI Library |
| Vite | 7.x | Build tool |
| Tailwind CSS | 4.x | Styling |
| React Router DOM | 7.x | Client-side routing |
| Framer Motion | 12.x | UI Animations |
| GSAP + ScrollTrigger | 3.x | Scroll animations |
| Lenis | — | Smooth scrolling |
| Recharts | 3.x | Dashboard charts |
| Socket.IO Client | 4.x | Real-time communication |
| Stripe React | 5.x | Payment UI |
| Clerk | 5.x | Authentication UI |
| Axios | 1.x | HTTP client |
| Lucide React | — | Icons |

### Backend
| Công nghệ | Vai trò |
|-----------|---------|
| Node.js 20 | Runtime |
| Express 5 | HTTP framework |
| Mongoose | MongoDB ODM |
| Clerk Express | Authentication middleware |
| JWT | Admin token |
| Socket.IO | Real-time events (chat, notifications) |
| Stripe SDK | Payment processing & webhooks |
| Nodemailer | Email service (SMTP — local dev) |
| Resend API | Email service (HTTP API — production) |
| Multer + Cloudinary | File upload & image hosting |
| Node-cron | Scheduled jobs (Night Audit, Reminders) |
| Svix | Clerk webhook verification |

### Infrastructure
| Công nghệ | Vai trò |
|-----------|---------|
| MongoDB Atlas | Database (Free M0) |
| Cloudinary | Image hosting |
| Clerk | Authentication provider |
| Stripe | Payment gateway |
| Resend | Email delivery API (production) |
| Vercel | Frontend hosting |
| Railway / Render | Backend hosting |
| Docker | Containerization (local dev) |

---

## ✨ Tính Năng

### 👥 Phía Khách Hàng (Guest)

- **🔍 Tìm kiếm & Đặt phòng** — Tìm khách sạn theo thành phố (HCM, Đà Nẵng, Hà Nội, Đà Lạt), ngày check-in/out, số khách
- **💳 Thanh toán Stripe** — Checkout session an toàn, thanh toán thẻ quốc tế
- **💬 Chat Real-time** — Nhắn tin trực tiếp với khách sạn qua Socket.IO
- **🔔 Thông báo tức thời** — Nhận thông báo đặt phòng, xác nhận, check-in/out
- **⭐ Đánh giá & Xếp hạng** — Review khách sạn sau khi checkout
- **🎁 Mã khuyến mãi** — Áp dụng coupon giảm giá khi đặt phòng
- **💰 Hoàn tiền tự động** — Chính sách hủy phòng phân tầng:
  - Hủy trước > 7 ngày: hoàn **100%**
  - Hủy trước 3–7 ngày: hoàn **50%**
  - Hủy trước < 3 ngày: **không hoàn**

### 🏢 Phía Chủ Khách Sạn (Hotel Owner Dashboard)

- **📊 Dashboard** — Tổng quan doanh thu, booking, công suất phòng (biểu đồ Recharts)
- **🛏️ Quản lý phòng** — CRUD phòng, upload ảnh Cloudinary, cấu hình amenities
- **📅 Quản lý booking** — Danh sách booking, xác nhận, check-in/check-out thủ công
- **📆 Occupancy Calendar** — Lịch chiếm dụng phòng theo tháng
- **🧹 Housekeeping Board** — Theo dõi và cập nhật trạng thái dọn phòng
- **🌙 Night Audit** — Báo cáo cuối ngày: doanh thu, công suất, check-in/out (chuẩn OTA)
- **📈 Revenue Management** — Biểu đồ doanh thu theo ngày/tháng
- **🎫 Quản lý khuyến mãi** — Tạo và quản lý mã giảm giá
- **💸 Xử lý hoàn tiền** — Phê duyệt/từ chối yêu cầu hoàn tiền qua Stripe
- **📨 Chat Inbox** — Hộp thư nhắn tin với khách hàng

### 🔐 Xác Thực & Phân Quyền

- **Clerk Authentication** — Đăng nhập qua Google hoặc Email/Password
- **Clerk Webhooks** — Tự động tạo user trong database khi đăng ký
- **JWT Admin** — Token riêng cho admin/hotel owner actions
- **RBAC** — Phân quyền: `guest`, `hotelOwner`

---

## 📁 Cấu Trúc Dự Án

```
hotel-booking/
├── client/                          # 🖥️ React Frontend (Vite + Tailwind)
│   ├── src/
│   │   ├── assets/                  # Hình ảnh, icons, dữ liệu tĩnh
│   │   ├── components/              # UI components tái sử dụng
│   │   │   ├── hotelOwner/          # Components dành cho Owner Dashboard
│   │   │   ├── Hero.jsx             # Trang chủ hero + search
│   │   │   ├── Navbar.jsx           # Navigation + mobile drawer
│   │   │   ├── ChatModal.jsx        # Chat real-time
│   │   │   ├── NotificationDropdown.jsx
│   │   │   └── ...
│   │   ├── context/                 # React Context providers
│   │   │   ├── AppContext.jsx       # Global state (user, hotels, axios)
│   │   │   ├── SocketContext.jsx    # Notification socket
│   │   │   └── ChatSocketContext.jsx
│   │   ├── pages/                   # Route pages
│   │   │   ├── hotelOwner/          # Owner dashboard pages
│   │   │   │   ├── Dashboard.jsx
│   │   │   │   ├── NightAudit.jsx
│   │   │   │   ├── CheckInOut.jsx
│   │   │   │   ├── HousekeepingBoard.jsx
│   │   │   │   └── ...
│   │   │   ├── Home.jsx
│   │   │   ├── AllRooms.jsx         # Tìm kiếm & danh sách phòng
│   │   │   ├── RoomDetails.jsx
│   │   │   ├── MyBookings.jsx
│   │   │   └── ...
│   │   └── App.jsx                  # Root component + routing
│   └── package.json
│
├── gateway/                         # 🚪 API Gateway (local dev)
│   ├── gateway.js                   # Express reverse proxy
│   └── package.json
│
├── monolith/                        # 🧩 Monolith Server (production deploy)
│   ├── server.js                    # Entry point — gộp tất cả 9 services
│   ├── Dockerfile                   # Docker build cho Railway/Render
│   └── package.json
│
├── services/                        # ⚙️ Backend Microservices
│   ├── auth-service/                # 🔐 Xác thực, user, Clerk webhooks
│   ├── hotel-service/               # 🏨 Hotel, Room, Housekeeping, Cloudinary
│   ├── booking-service/             # 📅 Booking, availability check
│   ├── payment-service/             # 💳 Stripe checkout, refund, webhook
│   ├── notification-service/        # 🔔 Socket.IO real-time + email
│   ├── chat-service/                # 💬 Chat real-time giữa guest & owner
│   ├── review-service/              # ⭐ Đánh giá, xếp hạng
│   ├── promo-service/               # 🎁 Coupon, khuyến mãi, subscribers
│   └── operations-service/          # 🌙 Night Audit, Revenue, Cron Jobs
│
├── shared/                          # 📦 Shared utilities
│   ├── middleware/authMiddleware.js  # Clerk auth middleware dùng chung
│   └── utils/serviceClient.js       # Axios client factory cho inter-service calls
│
├── docker-compose.dev.yml           # 🐳 Docker Compose cho local dev
├── start-all.ps1                    # ▶️  Khởi động tất cả services (Windows)
└── .gitignore
```

---

## 🚀 Cài Đặt & Chạy Local

### Yêu Cầu

- **Node.js** >= 20
- **npm** >= 10
- Tài khoản: **MongoDB Atlas**, **Clerk**, **Stripe**, **Cloudinary**

### Bước 1 — Clone & Install

```bash
git clone https://github.com/VoAnhKiet1410/hotel-booking-QuickStay.git
cd hotel-booking

# Install shared
cd shared && npm install && cd ..

# Install gateway
cd gateway && npm install && cd ..

# Install frontend
cd client && npm install && cd ..

# Install tất cả backend services (PowerShell)
Get-ChildItem services -Directory | ForEach-Object { cd "services/$($_.Name)"; npm install; cd ../.. }
```

### Bước 2 — Tạo file `.env`

Tạo `.env` trong từng thư mục service (xem mục [Biến Môi Trường](#-biến-môi-trường) bên dưới).

### Bước 3 — Khởi động

```powershell
# Khởi động tất cả services cùng lúc (Windows)
.\start-all.ps1
```

**Hoặc** dùng Docker Compose:

```bash
docker compose -f docker-compose.dev.yml up --build
```

### Truy cập

| Service | URL |
|---------|-----|
| **Frontend** | http://localhost:5173 |
| **API Gateway** | http://localhost:3000 |
| Auth Service | http://localhost:3001 |
| Hotel Service | http://localhost:3002 |
| Booking Service | http://localhost:3003 |
| Payment Service | http://localhost:3004 |
| Notification | http://localhost:3005 |
| Chat | http://localhost:3006 |
| Review | http://localhost:3007 |
| Promo | http://localhost:3008 |
| Operations | http://localhost:3009 |

---

## 🌐 Deploy Production

### Kiến trúc deploy

| Thành phần | Platform | Ghi chú |
|---|---|---|
| **Frontend** | Vercel | Free, CI/CD tự động |
| **Backend** | Railway / Render | Monolith — 1 service duy nhất |
| **Database** | MongoDB Atlas | Free M0 (512MB) |

### Deploy Frontend (Vercel)

1. Vào [vercel.com](https://vercel.com) → Import repo
2. **Root Directory**: `client`
3. **Framework**: Vite
4. **Environment Variables**:
   ```
   VITE_BACKEND_URL=https://your-backend.railway.app
   VITE_CLERK_PUBLISHABLE_KEY=pk_live_xxxxx
   ```

### Deploy Backend Monolith (Railway)

1. Vào [railway.app](https://railway.app) → New Project → GitHub Repo
2. **Dockerfile Path**: `monolith/Dockerfile`
3. **Root Directory**: *(để trống)*
4. **Environment Variables** (xem bên dưới)
5. **Networking** → Generate Domain

---

## 🔑 Biến Môi Trường

### Frontend (`client/.env`)

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
VITE_BACKEND_URL=http://localhost:3000
```

### Backend Services (mỗi service có `.env` riêng)

Mỗi service trong `services/*/` cần file `.env`:

```env
# ─── Chung cho tất cả services ───────────────────────────
PORT=3001                          # Port của service (3001–3009)
NODE_ENV=development
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/hotel-booking

# ─── Auth Service ─────────────────────────────────────────
CLERK_SECRET_KEY=sk_test_xxxxx
CLERK_WEBHOOK_SECRET=whsec_xxxxx
JWT_SECRET=your_64_char_random_secret
CLIENT_URL=http://localhost:5173

# ─── Hotel Service ────────────────────────────────────────
CLOUDINARY_CLOUD_NAME=xxxxx
CLOUDINARY_API_KEY=xxxxx
CLOUDINARY_API_SECRET=xxxxx

# ─── Payment Service ──────────────────────────────────────
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

### Monolith Production (`monolith/` trên Railway)

```env
PORT=3000
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/hotel-booking
CLERK_SECRET_KEY=sk_live_xxxxx
CLERK_WEBHOOK_SECRET=whsec_xxxxx
JWT_SECRET=your_64_char_secret
CLIENT_URL=https://your-app.vercel.app
CLOUDINARY_CLOUD_NAME=xxxxx
CLOUDINARY_API_KEY=xxxxx
CLOUDINARY_API_SECRET=xxxxx
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
AUTH_SERVICE_URL=http://localhost:3000
HOTEL_SERVICE_URL=http://localhost:3000
BOOKING_SERVICE_URL=http://localhost:3000
PAYMENT_SERVICE_URL=http://localhost:3000
NOTIFICATION_SERVICE_URL=http://localhost:3000

# ─── Email Service (Resend API — production) ─────────────
RESEND_API_KEY=re_xxxxx                # API key từ resend.com
EMAIL_FROM_NAME=QuickStay Hotel        # Tên hiển thị người gửi
```

### 📧 Email Service

Hệ thống hỗ trợ **2 phương thức gửi email**, tự động chọn dựa trên biến môi trường:

| Phương thức | Khi nào dùng | Cấu hình |
|---|---|---|
| **Resend API** (HTTP) | ✅ Production (Railway, Render...) | `RESEND_API_KEY` |
| **SMTP** (Nodemailer) | 🖥️ Local development | `EMAIL_HOST`, `EMAIL_USER`, `EMAIL_PASS` |

#### Tại sao dùng Resend thay vì SMTP?

Các nền tảng cloud như **Railway, Render, Heroku** thường **block cổng SMTP** (587, 465) để chống spam. Resend gửi email qua **HTTPS API** (port 443) nên không bị ảnh hưởng.

#### Cấu hình Resend (Production)

1. Đăng ký tại [resend.com](https://resend.com) (miễn phí 100 email/ngày)
2. Tạo **API Key** → copy `re_xxxxx`
3. Thêm biến môi trường:
   ```env
   RESEND_API_KEY=re_xxxxx
   EMAIL_FROM_NAME=QuickStay Hotel
   ```
4. *(Tùy chọn)* Verify domain riêng trên Resend để email vào Inbox thay vì Spam

> **Lưu ý:** Khi chưa verify domain, Resend dùng `onboarding@resend.dev` làm địa chỉ gửi → email có thể vào thư mục **Spam**. Verify domain riêng sẽ giải quyết vấn đề này.

#### Cấu hình SMTP (Local Development)

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=xxxx xxxx xxxx xxxx    # Gmail App Password (16 ký tự)
EMAIL_FROM_NAME=QuickStay Hotel
```

> **Gmail App Password:** Bật 2-Step Verification → vào [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords) → tạo App Password.

#### Các loại email được gửi

| Sự kiện | Email | Người nhận |
|---|---|---|
| Đặt phòng thành công | Xác nhận booking | Guest |
| Thanh toán Stripe thành công | Xác nhận thanh toán | Guest |
| Check-out | Email cảm ơn | Guest |
| Hủy booking + hoàn tiền | Thông báo hoàn tiền | Guest |

---

## 👨‍💻 Tác Giả

**Võ Anh Kiệt** — Full-Stack Developer

- 🐙 GitHub: [VoAnhKiet1410](https://github.com/VoAnhKiet1410)
- 📦 Repo: [hotel-booking-QuickStay](https://github.com/VoAnhKiet1410/hotel-booking-QuickStay)

---

## 📄 License

Dự án phát triển cho mục đích học tập và portfolio.
