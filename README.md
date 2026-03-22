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
│
├── 📂 client/                                    # 🖥️ React Frontend (Vite + Tailwind)
│   ├── index.html                                # Entry HTML
│   ├── vite.config.js                            # Vite configuration
│   ├── eslint.config.js                          # ESLint config
│   ├── vercel.json                               # Vercel deploy settings
│   ├── Dockerfile                                # Docker build cho frontend
│   ├── package.json
│   │
│   ├── 📂 public/                                # Static assets (favicon, robots.txt)
│   │
│   └── 📂 src/                                   # Source code chính
│       ├── main.jsx                              # Entry point — render App + providers
│       ├── App.jsx                               # Root component + React Router routing
│       ├── index.css                             # Global CSS + Tailwind directives
│       │
│       ├── 📂 assets/                            # Tài nguyên tĩnh
│       │   ├── assets.js                         # Export tập trung tất cả assets
│       │   ├── logo.svg                          # Logo QuickStay
│       │   ├── favicon.svg                       # Favicon
│       │   ├── heroImage.png                     # Hero banner trang chủ
│       │   ├── regImage.png                      # Ảnh đăng ký khách sạn
│       │   ├── roomImg[1-7].(png|jpg)            # Ảnh mẫu phòng
│       │   ├── exclusiveOfferCardImg[1-3].png    # Ảnh ưu đãi đặc biệt
│       │   ├── about_*.png                       # Ảnh trang About Us
│       │   ├── exp_*.png                         # Ảnh trang Experiences
│       │   ├── *Icon.svg                         # Bộ icon SVG (30+)
│       │   └── (social icons).svg                # Facebook, Instagram, LinkedIn, Twitter
│       │
│       ├── 📂 components/                        # UI Components tái sử dụng
│       │   │
│       │   │── ── 🧩 Layout & Navigation ── ──
│       │   ├── Navbar.jsx                        # Header — nav links, auth, mobile drawer
│       │   ├── Footer.jsx                        # Footer — links, social, newsletter
│       │   ├── SmoothScroll.jsx                  # Lenis smooth scroll wrapper
│       │   ├── ErrorBoundary.jsx                 # React Error Boundary fallback
│       │   │
│       │   │── ── 🏠 Homepage Sections ── ──
│       │   ├── Hero.jsx                          # Hero banner + search form (city, date, guests)
│       │   ├── FeaturedDestination.jsx           # Điểm đến nổi bật (HCM, Đà Nẵng, Hà Nội, Đà Lạt)
│       │   ├── ExclusiveOffers.jsx               # Ưu đãi đặc biệt + GSAP animations
│       │   ├── Testimonial.jsx                   # Đánh giá khách hàng
│       │   ├── WhyChooseUs.jsx                   # Lý do chọn QuickStay
│       │   ├── NewsLetter.jsx                    # Đăng ký nhận tin khuyến mãi
│       │   ├── Title.jsx                         # Section title component
│       │   │
│       │   │── ── 🏨 Hotel & Room ── ──
│       │   ├── HotelCard.jsx                     # Card hiển thị thông tin khách sạn
│       │   ├── RoomCard.jsx                      # Card hiển thị thông tin phòng
│       │   ├── HotelReg.jsx                      # Form đăng ký làm chủ khách sạn
│       │   ├── ReviewSection.jsx                 # Phần đánh giá & review chi tiết
│       │   │
│       │   │── ── 💬 Real-time Features ── ──
│       │   ├── ChatModal.jsx                     # Modal chat real-time (Socket.IO)
│       │   ├── NotificationDropdown.jsx          # Dropdown thông báo tức thời
│       │   ├── MessageDropdown.jsx               # Dropdown tin nhắn mới
│       │   │
│       │   │── ── 🔧 Utility Components ── ──
│       │   ├── ConfirmModal.jsx                  # Modal xác nhận hành động
│       │   ├── RefundModal.jsx                   # Modal yêu cầu hoàn tiền
│       │   ├── Skeleton.jsx                      # Loading skeleton placeholders
│       │   │
│       │   │── ── 📧 Email Templates ── ──
│       │   └── 📂 EmailTemplates/                # React email templates (preview)
│       │       ├── index.js                      # Export tập trung
│       │       ├── BookingConfirmationEmail.jsx  # Template email xác nhận booking
│       │       ├── PaymentSuccessEmail.jsx       # Template email thanh toán thành công
│       │       └── BookingCancelledEmail.jsx     # Template email hủy booking
│       │   │
│       │   └── 📂 hotelOwner/                    # Components dành riêng cho Owner
│       │       ├── Navbar.jsx                    # Owner dashboard navbar
│       │       └── Sidebar.jsx                   # Owner dashboard sidebar navigation
│       │
│       ├── 📂 context/                           # React Context — State Management
│       │   ├── AppContext.jsx                    # Global context (user, hotels, axios instance)
│       │   ├── appContextCore.js                 # Core logic tách biệt cho AppContext
│       │   ├── SocketContext.jsx                 # Socket.IO cho notifications
│       │   ├── socketCore.js                     # Core logic cho SocketContext
│       │   ├── ChatSocketContext.jsx             # Socket.IO cho chat real-time
│       │   └── chatSocketCore.js                 # Core logic cho ChatSocketContext
│       │
│       ├── 📂 hooks/                             # Custom React Hooks
│       │   └── useScrollReveal.js                # Hook GSAP scroll reveal animations
│       │
│       ├── 📂 pages/                             # Route Pages — Trang chính
│       │   │
│       │   │── ── 👤 Guest Pages ── ──
│       │   ├── Home.jsx                          # Trang chủ (Hero + sections)
│       │   ├── AllRooms.jsx                      # Tìm kiếm & danh sách phòng + filters
│       │   ├── RoomDetails.jsx                   # Chi tiết phòng + đặt phòng + đánh giá
│       │   ├── HotelDetails.jsx                  # Chi tiết khách sạn + danh sách phòng
│       │   ├── MyBookings.jsx                    # Danh sách booking của khách
│       │   ├── BookingDetail.jsx                 # Chi tiết 1 booking + Guest Folio
│       │   ├── BookingSuccess.jsx                # Trang xác nhận đặt phòng thành công
│       │   ├── AllPromotions.jsx                 # Danh sách khuyến mãi
│       │   ├── PromotionDetails.jsx              # Chi tiết khuyến mãi
│       │   ├── AboutUs.jsx                       # Trang giới thiệu QuickStay
│       │   ├── Experiences.jsx                   # Trang trải nghiệm du lịch
│       │   │
│       │   │── ── 📧 Dev Tools ── ──
│       │   ├── 📂 EmailPreview/                  # Preview email templates (dev only)
│       │   │   └── EmailPreview.jsx              # Render preview email templates
│       │   │
│       │   │── ── 🏢 Hotel Owner Pages ── ──
│       │   └── 📂 hotelOwner/                    # Owner Dashboard (15 pages)
│       │       ├── Layout.jsx                    # Dashboard layout wrapper (Sidebar + Navbar)
│       │       ├── Dashboard.jsx                 # 📊 Tổng quan — KPIs, biểu đồ, thống kê
│       │       ├── HotelInfo.jsx                 # 🏨 Thông tin khách sạn — xem/chỉnh sửa
│       │       ├── ListRoom.jsx                  # 🛏️ Danh sách phòng — bảng + filters
│       │       ├── AddRoom.jsx                   # ➕ Thêm phòng mới — form + upload ảnh
│       │       ├── EditRoom.jsx                  # ✏️ Chỉnh sửa phòng
│       │       ├── Bookings.jsx                  # 📅 Quản lý booking — table + actions
│       │       ├── CheckInOut.jsx                # 🔑 Check-in/Check-out thủ công
│       │       ├── OccupancyCalendar.jsx         # 📆 Lịch chiếm dụng phòng theo tháng
│       │       ├── HousekeepingBoard.jsx         # 🧹 Bảng theo dõi dọn phòng
│       │       ├── NightAudit.jsx                # 🌙 Báo cáo Night Audit chuẩn OTA
│       │       ├── RevenueManagement.jsx         # 📈 Biểu đồ & báo cáo doanh thu
│       │       ├── ManagePromotions.jsx          # 🎫 CRUD mã khuyến mãi
│       │       ├── RefundRequests.jsx            # 💸 Xử lý yêu cầu hoàn tiền
│       │       └── OwnerInbox.jsx                # 📨 Hộp thư chat với khách hàng
│       │
│       └── 📂 utils/                            # Utility functions
│           ├── constants.js                      # Hằng số (cities, amenities, room types)
│           ├── formatters.js                     # Format tiền tệ, ngày tháng, text
│           ├── formatters.test.js                # Unit tests cho formatters
│           ├── roomFilters.js                    # Logic lọc & sắp xếp phòng
│           └── roomFilters.test.js               # Unit tests cho roomFilters
│
├── 📂 gateway/                                   # 🚪 API Gateway (Local Development)
│   ├── gateway.js                                # Express reverse proxy — route → services
│   ├── Dockerfile                                # Docker build
│   └── package.json
│
├── 📂 monolith/                                  # 🧩 Monolith Server (Production Deploy)
│   ├── server.js                                 # Entry point — gộp tất cả 9 services vào 1 process
│   ├── Dockerfile                                # Multi-stage Docker build cho Railway/Render
│   └── package.json
│
├── 📂 services/                                  # ⚙️ Backend Microservices (9 services)
│   │
│   ├── 📂 auth-service/                          # 🔐 Authentication & User Management [:3001]
│   │   ├── server.js                             # Entry point + MongoDB connection
│   │   ├── 📂 controllers/
│   │   │   ├── clerkWebhooks.js                  # Xử lý Clerk webhook (user.created, user.updated)
│   │   │   └── userController.js                 # CRUD user, get user profile
│   │   ├── 📂 middleware/
│   │   │   └── authMiddleware.js                 # Clerk auth + JWT verification
│   │   ├── 📂 models/
│   │   │   └── User.js                           # User schema (clerkId, email, role, imageUrl)
│   │   ├── 📂 routes/
│   │   │   ├── userRoutes.js                     # /api/user — profile, update
│   │   │   └── adminRoutes.js                    # /api/admin — admin-only operations
│   │   └── package.json
│   │
│   ├── 📂 hotel-service/                         # 🏨 Hotel & Room Management [:3002]
│   │   ├── server.js                             # Entry point + MongoDB connection
│   │   ├── 📂 configs/
│   │   │   └── cloudinary.js                     # Cloudinary SDK configuration
│   │   ├── 📂 controllers/
│   │   │   ├── hotelController.js                # CRUD hotel, search, get by owner
│   │   │   ├── roomController.js                 # CRUD room, upload images, availability
│   │   │   └── housekeepingController.js         # Quản lý trạng thái dọn phòng
│   │   ├── 📂 middleware/
│   │   │   ├── authMiddleware.js                 # Clerk auth verification
│   │   │   └── ownerMiddleware.js                # Verify hotel ownership
│   │   ├── 📂 models/
│   │   │   ├── Hotel.js                          # Hotel schema (name, city, amenities, owner)
│   │   │   ├── Room.js                           # Room schema (type, price, images, capacity)
│   │   │   ├── Booking.js                        # Booking reference (for availability check)
│   │   │   └── User.js                           # User reference
│   │   ├── 📂 routes/
│   │   │   ├── hotelRoutes.js                    # /api/hotels — public + owner CRUD
│   │   │   ├── roomRoutes.js                     # /api/rooms — public + owner CRUD
│   │   │   ├── housekeepingRoutes.js             # /api/housekeeping — status updates
│   │   │   └── internalRoutes.js                 # Inter-service communication
│   │   ├── 📂 utils/
│   │   │   └── cloudinaryUtils.js                # Upload/delete helpers cho Cloudinary
│   │   └── package.json
│   │
│   ├── 📂 booking-service/                       # 📅 Booking & Check-in/out [:3003]
│   │   ├── server.js                             # Entry point + MongoDB connection
│   │   ├── 📂 configs/
│   │   │   └── stripe.js                         # Stripe SDK initialization
│   │   ├── 📂 controllers/
│   │   │   ├── bookingController.js              # Core booking logic (create, update, cancel)
│   │   │   ├── bookingHelpers.js                 # Helper functions cho booking operations
│   │   │   ├── guestBookingController.js         # Guest-facing booking actions
│   │   │   ├── guestFolioController.js           # Guest Folio — chi tiết hóa đơn lưu trú
│   │   │   ├── ownerBookingController.js         # Owner-facing booking management
│   │   │   ├── checkInOutController.js           # Check-in/Check-out operations
│   │   │   └── refundController.js               # Xử lý hoàn tiền (tiered refund policy)
│   │   ├── 📂 middleware/
│   │   │   ├── authMiddleware.js                 # Clerk auth verification
│   │   │   └── ownerMiddleware.js                # Verify hotel ownership
│   │   ├── 📂 models/
│   │   │   ├── Booking.js                        # Booking schema (guest, room, dates, status, payment)
│   │   │   ├── Room.js                           # Room reference
│   │   │   ├── Hotel.js                          # Hotel reference
│   │   │   ├── User.js                           # User reference
│   │   │   ├── Coupon.js                         # Coupon reference (để validate)
│   │   │   ├── Promotion.js                      # Promotion reference
│   │   │   └── Notification.js                   # Notification reference
│   │   ├── 📂 routes/
│   │   │   ├── bookingRoutes.js                  # /api/bookings — CRUD + check-in/out + refund
│   │   │   └── internalRoutes.js                 # Inter-service: availability queries
│   │   ├── 📂 utils/
│   │   │   ├── dateUtils.js                      # Date calculation helpers
│   │   │   ├── emailHelper.js                    # Gửi email (Resend API / SMTP fallback)
│   │   │   ├── emailTemplates.js                 # HTML email templates
│   │   │   ├── emitNotification.js               # Emit socket notification + save to DB
│   │   │   └── revenueUtils.js                   # Tính doanh thu, thống kê
│   │   └── package.json
│   │
│   ├── 📂 payment-service/                       # 💳 Payment & Stripe Integration [:3004]
│   │   ├── server.js                             # Entry point + MongoDB connection
│   │   ├── 📂 configs/
│   │   │   └── stripe.js                         # Stripe SDK configuration
│   │   ├── 📂 controllers/
│   │   │   └── paymentController.js              # Stripe Checkout, webhook handler, refund
│   │   ├── 📂 middleware/
│   │   │   └── authMiddleware.js                 # Clerk auth verification
│   │   ├── 📂 models/
│   │   │   ├── Booking.js                        # Booking reference (update payment status)
│   │   │   ├── Room.js                           # Room reference (get price)
│   │   │   ├── Hotel.js                          # Hotel reference
│   │   │   ├── User.js                           # User reference
│   │   │   └── Notification.js                   # Notification reference
│   │   ├── 📂 routes/
│   │   │   └── paymentRoutes.js                  # /api/payments — checkout, webhook, refund
│   │   ├── 📂 utils/
│   │   │   ├── dateUtils.js                      # Date helpers
│   │   │   ├── emailHelper.js                    # Gửi email (Resend / SMTP)
│   │   │   ├── emailTemplates.js                 # HTML email templates
│   │   │   └── emitNotification.js               # Emit socket notification
│   │   └── package.json
│   │
│   ├── 📂 notification-service/                  # 🔔 Notifications & Email [:3005]
│   │   ├── server.js                             # Entry point + Socket.IO server
│   │   ├── 📂 configs/
│   │   │   ├── socket.js                         # Socket.IO initialization + event handlers
│   │   │   └── email.js                          # Email transporter (Resend / Nodemailer)
│   │   ├── 📂 controllers/
│   │   │   └── notificationController.js         # CRUD notifications, mark read, delete
│   │   ├── 📂 middleware/
│   │   │   └── authMiddleware.js                 # Clerk auth verification
│   │   ├── 📂 models/
│   │   │   ├── Notification.js                   # Notification schema (type, message, isRead)
│   │   │   └── User.js                           # User reference
│   │   ├── 📂 routes/
│   │   │   ├── notificationRoutes.js             # /api/notifications — get, read, delete
│   │   │   └── internalRoutes.js                 # Inter-service: emit notification
│   │   ├── 📂 utils/
│   │   │   ├── emailTemplates.js                 # HTML email templates
│   │   │   └── emitNotification.js               # Core emit logic + socket broadcast
│   │   └── package.json
│   │
│   ├── 📂 chat-service/                          # 💬 Real-time Chat [:3006]
│   │   ├── server.js                             # Entry point + Socket.IO server
│   │   ├── 📂 configs/
│   │   │   └── chatSocket.js                     # Chat Socket.IO events (join, send, typing)
│   │   ├── 📂 controllers/
│   │   │   └── chatController.js                 # Conversations & messages CRUD
│   │   ├── 📂 middleware/
│   │   │   └── authMiddleware.js                 # Clerk auth verification
│   │   ├── 📂 models/
│   │   │   ├── Conversation.js                   # Conversation schema (participants, hotel)
│   │   │   ├── Message.js                        # Message schema (sender, content, timestamp)
│   │   │   └── User.js                           # User reference
│   │   ├── 📂 routes/
│   │   │   └── chatRoutes.js                     # /api/chat — conversations, messages
│   │   └── package.json
│   │
│   ├── 📂 review-service/                        # ⭐ Reviews & Ratings [:3007]
│   │   ├── server.js                             # Entry point + MongoDB connection
│   │   ├── 📂 controllers/
│   │   │   └── reviewController.js               # CRUD reviews, tính trung bình rating
│   │   ├── 📂 middleware/
│   │   │   └── authMiddleware.js                 # Clerk auth verification
│   │   ├── 📂 models/
│   │   │   ├── Review.js                         # Review schema (rating, comment, guest, room)
│   │   │   ├── Booking.js                        # Booking reference (verify checkout status)
│   │   │   ├── Hotel.js                          # Hotel reference (update avg rating)
│   │   │   ├── Room.js                           # Room reference
│   │   │   └── User.js                           # User reference
│   │   ├── 📂 routes/
│   │   │   └── reviewRoutes.js                   # /api/reviews — CRUD + get by room/hotel
│   │   └── package.json
│   │
│   ├── 📂 promo-service/                         # 🎁 Promotions & Coupons [:3008]
│   │   ├── server.js                             # Entry point + MongoDB connection
│   │   ├── 📂 configs/
│   │   │   └── email.js                          # Email transporter configuration
│   │   ├── 📂 controllers/
│   │   │   ├── promotionController.js            # CRUD promotions, generate coupons
│   │   │   └── subscriberController.js           # Newsletter subscriber management
│   │   ├── 📂 middleware/
│   │   │   ├── authMiddleware.js                 # Clerk auth verification
│   │   │   └── ownerMiddleware.js                # Verify hotel ownership
│   │   ├── 📂 models/
│   │   │   ├── Promotion.js                      # Promotion schema (title, discount, dates)
│   │   │   ├── Coupon.js                         # Coupon schema (code, value, usage limit)
│   │   │   ├── Subscriber.js                     # Email subscriber schema
│   │   │   ├── Hotel.js                          # Hotel reference
│   │   │   ├── Room.js                           # Room reference
│   │   │   └── User.js                           # User reference
│   │   ├── 📂 routes/
│   │   │   ├── promotionRoutes.js                # /api/promotions — CRUD + public listing
│   │   │   ├── subscriberRoutes.js               # /api/subscribers — subscribe/unsubscribe
│   │   │   └── internalRoutes.js                 # Inter-service: validate coupon
│   │   └── package.json
│   │
│   └── 📂 operations-service/                    # 🌙 Operations & Night Audit [:3009]
│       ├── server.js                             # Entry point + MongoDB connection + cron init
│       ├── 📂 configs/
│       │   └── email.js                          # Email transporter configuration
│       ├── 📂 controllers/
│       │   ├── nightAuditController.js           # Night Audit: chạy audit, xem log, báo cáo
│       │   └── revenueController.js              # Revenue reports: daily, monthly, yearly
│       ├── 📂 jobs/                              # ⏰ Scheduled Jobs (Node-cron)
│       │   ├── nightAuditJob.js                  # Cron: tự động chạy Night Audit lúc 2:00 AM
│       │   └── reminderJob.js                    # Cron: nhắc nhở check-in/out sắp tới
│       ├── 📂 middleware/
│       │   ├── authMiddleware.js                 # Clerk auth verification
│       │   └── ownerMiddleware.js                # Verify hotel ownership
│       ├── 📂 models/
│       │   ├── NightAuditLog.js                  # Night Audit log schema (date, metrics, rooms)
│       │   ├── Booking.js                        # Booking reference
│       │   ├── Hotel.js                          # Hotel reference
│       │   ├── Room.js                           # Room reference
│       │   ├── Notification.js                   # Notification reference
│       │   └── User.js                           # User reference
│       ├── 📂 routes/
│       │   ├── nightAuditRoutes.js               # /api/night-audit — run, get logs, report
│       │   └── revenueRoutes.js                  # /api/revenue — daily, monthly charts
│       ├── 📂 utils/
│       │   ├── emailHelper.js                    # Gửi email
│       │   ├── emailTemplates.js                 # HTML email templates
│       │   ├── emitNotification.js               # Emit socket notification
│       │   └── revenueUtils.js                   # Revenue calculation logic
│       └── package.json
│
├── 📂 shared/                                    # 📦 Shared Utilities (dùng chung cho services)
│   ├── index.js                                  # Entry point — re-export tất cả modules
│   ├── package.json
│   ├── 📂 middleware/
│   │   └── authMiddleware.js                     # Clerk + JWT auth middleware dùng chung
│   └── 📂 utils/
│       ├── serviceClient.js                      # Axios client factory (inter-service calls)
│       ├── constants.js                          # Shared constants (booking statuses, roles)
│       ├── dateUtils.js                          # Date utility functions dùng chung
│       └── emailHelper.js                        # Email helper (Resend / SMTP) dùng chung
│
├── docker-compose.dev.yml                        # 🐳 Docker Compose — chạy toàn bộ services
├── start-all.ps1                                 # ▶️ PowerShell script — khởi động tất cả services
├── .gitignore                                    # Git ignore rules
└── README.md                                     # 📖 Tài liệu dự án (file này)
```

### 📊 Tổng Quan Kiến Trúc Service

| Service | Port | Chức năng chính | Models | Routes |
|---------|------|-----------------|--------|--------|
| **auth-service** | 3001 | Xác thực Clerk, quản lý user, webhooks | `User` | `/api/user`, `/api/admin` |
| **hotel-service** | 3002 | CRUD hotel/room, upload ảnh, housekeeping | `Hotel`, `Room`, `Booking`, `User` | `/api/hotels`, `/api/rooms`, `/api/housekeeping` |
| **booking-service** | 3003 | Đặt phòng, check-in/out, hoàn tiền, Guest Folio | `Booking`, `Room`, `Hotel`, `User`, `Coupon`, `Promotion`, `Notification` | `/api/bookings` |
| **payment-service** | 3004 | Stripe Checkout, webhook, xử lý thanh toán | `Booking`, `Room`, `Hotel`, `User`, `Notification` | `/api/payments` |
| **notification-service** | 3005 | Socket.IO real-time, email, CRUD notifications | `Notification`, `User` | `/api/notifications` |
| **chat-service** | 3006 | Chat real-time giữa guest & owner | `Conversation`, `Message`, `User` | `/api/chat` |
| **review-service** | 3007 | Đánh giá, xếp hạng, tính trung bình rating | `Review`, `Booking`, `Hotel`, `Room`, `User` | `/api/reviews` |
| **promo-service** | 3008 | Khuyến mãi, coupon, newsletter subscribers | `Promotion`, `Coupon`, `Subscriber`, `Hotel`, `Room`, `User` | `/api/promotions`, `/api/subscribers` |
| **operations-service** | 3009 | Night Audit (2AM cron), revenue reports, reminders | `NightAuditLog`, `Booking`, `Hotel`, `Room`, `Notification`, `User` | `/api/night-audit`, `/api/revenue` |

### 🗂️ Quy Ước Thiết Kế

Mỗi microservice đều tuân theo cấu trúc thống nhất:

```
service-name/
├── server.js              # Entry point, MongoDB connect, Express init
├── configs/               # Cấu hình bên thứ 3 (Stripe, Cloudinary, Socket.IO, Email)
├── controllers/           # Business logic — xử lý request
├── middleware/             # Auth, ownership verification
├── models/                # Mongoose schemas & models
├── routes/                # Express route definitions
│   ├── *Routes.js         # Public/authenticated routes
│   └── internalRoutes.js  # Inter-service communication (không qua gateway)
├── utils/                 # Helpers (email, date, notifications)
├── jobs/                  # Scheduled tasks (chỉ operations-service)
├── Dockerfile             # Container build
└── package.json
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
