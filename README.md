# 🏨 Hotel Booking Platform

> Nền tảng đặt phòng khách sạn trực tuyến Full-Stack, xây dựng theo kiến trúc **Microservices** với React, Node.js, MongoDB, Stripe và Socket.IO.

![Node.js](https://img.shields.io/badge/Node.js-20-339933?logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?logo=mongodb&logoColor=white)
![Stripe](https://img.shields.io/badge/Stripe-008CDD?logo=stripe&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-010101?logo=socket.io&logoColor=white)

---

## 📋 Mục Lục

- [Tổng Quan](#-tổng-quan)
- [Kiến Trúc](#-kiến-trúc)
- [Tech Stack](#-tech-stack)
- [Tính Năng](#-tính-năng)
- [Cấu Trúc Dự Án](#-cấu-trúc-dự-án)
- [Cài Đặt & Chạy](#-cài-đặt--chạy)
- [Biến Môi Trường](#-biến-môi-trường)
- [Docker](#-docker)
- [Screenshots](#-screenshots)

---

## 🎯 Tổng Quan

Hotel Booking Platform là hệ thống đặt phòng khách sạn hoàn chỉnh, hỗ trợ **3 vai trò người dùng**:

| Vai trò | Mô tả |
|---------|-------|
| 🧑‍💼 **Guest** | Tìm kiếm, đặt phòng, thanh toán online, chat với khách sạn |
| 🏢 **Hotel Owner** | Quản lý phòng, booking, doanh thu, housekeeping, khuyến mãi |
| 🔧 **Admin** | Quản trị toàn hệ thống |

---

## 🏗️ Kiến Trúc

Hệ thống được thiết kế theo kiến trúc **Microservices** với **API Gateway** làm điểm entry duy nhất:

```
┌─────────────────────────────────────────────────────────┐
│                   Client (React + Vite)                  │
│                    http://localhost:5173                  │
└──────────────────────────┬──────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────┐
│                API Gateway (:3000)                        │
│          Express Reverse Proxy + CORS + Auth             │
└──┬────┬────┬────┬────┬────┬────┬────┬────┬──────────────┘
   │    │    │    │    │    │    │    │    │
   ▼    ▼    ▼    ▼    ▼    ▼    ▼    ▼    ▼
┌────┐┌────┐┌────┐┌────┐┌────┐┌────┐┌────┐┌────┐┌─────┐
│Auth││Hotl││Book││Pay ││Noti││Chat││Revw││Prom││ Ops │
│3001││3002││3003││3004││3005││3006││3007││3008││3009 │
└────┘└────┘└────┘└────┘└────┘└────┘└────┘└────┘└─────┘
   │    │    │    │    │    │    │    │    │
   └────┴────┴────┴────┴────┴────┴────┴────┘
                     │
                     ▼
              ┌──────────────┐
              │   MongoDB    │
              │  (Atlas/Local)│
              └──────────────┘
```

---

## 🛠️ Tech Stack

### Frontend
| Công nghệ | Phiên bản | Vai trò |
|------------|-----------|---------|
| React | 19.2 | UI Library |
| Vite | 7.x | Build tool |
| Tailwind CSS | 4.x | Styling |
| React Router | 7.x | Routing |
| Framer Motion | 12.x | Animations |
| GSAP | 3.x | Advanced animations |
| Recharts | 3.x | Dashboard charts |
| Socket.IO Client | 4.x | Real-time communication |
| Stripe React | 5.x | Payment UI |
| Clerk | 5.x | Authentication UI |
| Lucide React | — | Icons |
| Axios | 1.x | HTTP client |

### Backend
| Công nghệ | Vai trò |
|------------|---------|
| Node.js 20 | Runtime |
| Express 5 | HTTP framework |
| Mongoose | MongoDB ODM |
| JWT | Authentication tokens |
| Socket.IO | Real-time events |
| Stripe SDK | Payment processing |
| Nodemailer | Email service |
| Multer | File upload |
| Cloudinary | Image hosting |

### DevOps
| Công nghệ | Vai trò |
|------------|---------|
| Docker | Containerization |
| Docker Compose | Multi-service orchestration |

---

## ✨ Tính Năng

### 👥 Phía Khách Hàng (Guest)

- **🔍 Tìm kiếm & Đặt phòng** — Tìm khách sạn theo địa điểm, ngày, lọc theo giá/tiện nghi
- **💳 Thanh toán Stripe** — Thanh toán online an toàn qua Stripe Checkout
- **💬 Chat Real-time** — Nhắn tin trực tiếp với khách sạn qua Socket.IO
- **🔔 Thông báo tức thời** — Nhận thông báo đặt phòng, xác nhận, hủy real-time
- **⭐ Đánh giá & Xếp hạng** — Review khách sạn sau khi checkout
- **🎁 Khuyến mãi** — Xem và áp dụng mã giảm giá, flash sale
- **💰 Hoàn tiền** — Yêu cầu hoàn tiền với chính sách hủy phân tầng:
  - Hủy trước > 7 ngày: hoàn **100%**
  - Hủy trước 3-7 ngày: hoàn **50%**
  - Hủy trước < 3 ngày: **không hoàn**

### 🏢 Phía Chủ Khách Sạn (Hotel Owner Dashboard)

- **📊 Dashboard** — Tổng quan doanh thu, booking, công suất phòng (Recharts)
- **🛏️ Quản lý phòng** — CRUD phòng, upload ảnh, quản lý amenities
- **📅 Quản lý booking** — Xem, xác nhận, check-in/check-out thủ công
- **📆 Occupancy Calendar** — Lịch chiếm dụng phòng theo tháng
- **🧹 Housekeeping Board** — Quản lý trạng thái dọn phòng
- **🌙 Night Audit** — Báo cáo doanh thu, công suất cuối ngày (chuẩn OTA)
- **📈 Revenue Management** — Phân tích doanh thu chi tiết theo thời gian
- **🎫 Quản lý khuyến mãi** — Tạo mã giảm giá, flash sale
- **💸 Xử lý hoàn tiền** — Phê duyệt/từ chối yêu cầu hoàn tiền
- **📨 Inbox** — Hộp thư chat với khách hàng

### 🔐 Xác Thực & Phân Quyền

- **Clerk Authentication** — Đăng nhập/đăng ký qua Clerk (Google, Email)
- **JWT Tokens** — Access token + Refresh token
- **RBAC** — Phân quyền theo vai trò: Guest, Hotel Owner, Admin

---

## 📁 Cấu Trúc Dự Án

```
hotel-booking/
├── client/                          # 🖥️ React Frontend (Vite)
│   ├── public/                      # Static assets
│   ├── src/
│   │   ├── assets/                  # Images, icons
│   │   ├── components/              # Reusable UI components
│   │   │   ├── hotelOwner/          # Owner-specific components
│   │   │   ├── EmailTemplates/      # Email HTML templates
│   │   │   ├── Navbar.jsx
│   │   │   ├── Hero.jsx
│   │   │   ├── ChatModal.jsx
│   │   │   ├── NotificationDropdown.jsx
│   │   │   └── ...
│   │   ├── context/                 # React Context providers
│   │   │   ├── AppContext.jsx       # Global app state
│   │   │   ├── SocketContext.jsx    # Notification socket
│   │   │   └── ChatSocketContext.jsx # Chat socket
│   │   ├── hooks/                   # Custom React hooks
│   │   ├── pages/                   # Page components
│   │   │   ├── hotelOwner/          # Owner dashboard pages
│   │   │   │   ├── Dashboard.jsx
│   │   │   │   ├── NightAudit.jsx
│   │   │   │   ├── CheckInOut.jsx
│   │   │   │   └── ...
│   │   │   ├── Home.jsx
│   │   │   ├── AllRooms.jsx
│   │   │   ├── RoomDetails.jsx
│   │   │   └── ...
│   │   ├── utils/                   # Helper functions
│   │   ├── App.jsx                  # Root component + routing
│   │   ├── main.jsx                 # Entry point
│   │   └── index.css                # Global styles
│   ├── Dockerfile
│   └── package.json
│
├── gateway/                         # 🚪 API Gateway
│   ├── gateway.js                   # Reverse proxy configuration
│   ├── Dockerfile
│   └── package.json
│
├── services/                        # ⚙️ Backend Microservices
│   ├── auth-service/                # 🔐 Port 3001
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   └── server.js
│   ├── hotel-service/               # 🏨 Port 3002
│   ├── booking-service/             # 📅 Port 3003
│   ├── payment-service/             # 💳 Port 3004
│   ├── notification-service/        # 🔔 Port 3005
│   ├── chat-service/                # 💬 Port 3006
│   ├── review-service/              # ⭐ Port 3007
│   ├── promo-service/               # 🎁 Port 3008
│   └── operations-service/          # 🌙 Port 3009
│
├── shared/                          # 📦 Shared utilities & middleware
├── docker-compose.dev.yml           # 🐳 Docker Compose config
├── start-all.ps1                    # ▶️ Start all services (Windows)
├── push-to-dockerhub.ps1            # 📤 Build & push Docker images
└── .gitignore
```

---

## 🚀 Cài Đặt & Chạy

### Yêu Cầu

- **Node.js** >= 20
- **MongoDB** (Atlas hoặc local)
- **Stripe Account** (test mode)
- **Clerk Account** (authentication)
- **Cloudinary Account** (image upload)

### Cách 1: Chạy Thủ Công

```bash
# 1. Clone repository
git clone https://github.com/dhope14102004/hotel-booking.git
cd hotel-booking

# 2. Cài đặt dependencies cho từng service
cd gateway && npm install && cd ..
cd shared && npm install && cd ..
cd client && npm install && cd ..

# Cài cho tất cả backend services
for dir in services/*/; do cd "$dir" && npm install && cd ../..; done

# 3. Tạo file .env cho từng service (xem mục Biến Môi Trường)

# 4. Khởi động tất cả services (Windows)
.\start-all.ps1
```

### Cách 2: Docker Compose

```bash
# Build và khởi động tất cả containers
docker compose -f docker-compose.dev.yml up --build
```

### Truy Cập

| Service | URL |
|---------|-----|
| **Frontend** | http://localhost:5173 |
| **API Gateway** | http://localhost:3000 |
| Auth Service | http://localhost:3001 |
| Hotel Service | http://localhost:3002 |
| Booking Service | http://localhost:3003 |
| Payment Service | http://localhost:3004 |
| Notification Service | http://localhost:3005 |
| Chat Service | http://localhost:3006 |
| Review Service | http://localhost:3007 |
| Promo Service | http://localhost:3008 |
| Operations Service | http://localhost:3009 |

---

## 🔑 Biến Môi Trường

### Client (`client/.env`)

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
VITE_BACKEND_URL=http://localhost:3000
```

### Gateway (`gateway/.env`)

```env
PORT=3000
AUTH_SERVICE_URL=http://localhost:3001
HOTEL_SERVICE_URL=http://localhost:3002
BOOKING_SERVICE_URL=http://localhost:3003
PAYMENT_SERVICE_URL=http://localhost:3004
NOTIFICATION_SERVICE_URL=http://localhost:3005
CHAT_SERVICE_URL=http://localhost:3006
REVIEW_SERVICE_URL=http://localhost:3007
PROMO_SERVICE_URL=http://localhost:3008
OPERATIONS_SERVICE_URL=http://localhost:3009
```

### Backend Services (ví dụ `services/auth-service/.env`)

```env
PORT=3001
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/hotel-auth
JWT_SECRET=your_jwt_secret
CLERK_SECRET_KEY=sk_test_xxxxx
CLERK_WEBHOOK_SECRET=whsec_xxxxx
```

### Payment Service (`services/payment-service/.env`)

```env
PORT=3004
MONGODB_URI=mongodb+srv://...
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
CLIENT_URL=http://localhost:5173
```

> ⚠️ **Lưu ý**: File `.env` không được commit lên Git. Liên hệ team để nhận biến môi trường.

---

## 🐳 Docker

### Docker Hub

Tất cả images được publish tại:

**[hub.docker.com/u/dhope14102004](https://hub.docker.com/u/dhope14102004)**

| Image | Pull Command |
|-------|--------------|
| Gateway | `docker pull dhope14102004/hotel-booking-gateway` |
| Auth | `docker pull dhope14102004/hotel-booking-auth-service` |
| Hotel | `docker pull dhope14102004/hotel-booking-hotel-service` |
| Booking | `docker pull dhope14102004/hotel-booking-booking-service` |
| Payment | `docker pull dhope14102004/hotel-booking-payment-service` |
| Notification | `docker pull dhope14102004/hotel-booking-notification-service` |
| Chat | `docker pull dhope14102004/hotel-booking-chat-service` |
| Review | `docker pull dhope14102004/hotel-booking-review-service` |
| Promo | `docker pull dhope14102004/hotel-booking-promo-service` |
| Operations | `docker pull dhope14102004/hotel-booking-operations-service` |
| Client | `docker pull dhope14102004/hotel-booking-client` |

### Build & Push

```powershell
# Đăng nhập Docker Hub
docker login -u dhope14102004

# Build và push tất cả images
.\push-to-dockerhub.ps1
```

---

## 📸 Screenshots

> *Sẽ được bổ sung*

---

## 👨‍💻 Tác Giả

**Võ Anh Kiệt** — Full-Stack Developer Intern

- 🐳 Docker Hub: [dhope14102004](https://hub.docker.com/u/dhope14102004)

---

## 📄 License

Dự án này được phát triển cho mục đích học tập.
