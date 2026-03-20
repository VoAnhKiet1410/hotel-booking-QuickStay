/**
 * Booking Controller — Barrel File
 *
 * Re-export tất cả controllers từ các module con.
 * File này đóng vai trò backward-compatible:
 * - bookingRoutes.js vẫn import từ './bookingController.js'
 * - Logic thực sự đã được tách ra các file riêng để dễ bảo trì
 */

// ── Guest-facing controllers ──
export {
    checkRoomAvailability,
    createBooking,
    getMyBookings,
    getBookingById,
    cancelMyBooking,
} from './guestBookingController.js';

// ── Owner booking management ──
export {
    getOwnerBookings,
    getOwnerBookingSummary,
    getOwnerCalendar,
    updateBookingStatusByOwner,
} from './ownerBookingController.js';

// ── Check-in / Check-out / No-show ──
export {
    checkInBooking,
    checkOutBooking,
    markNoShow,
    getTodayArrivalsAndDepartures,
} from './checkInOutController.js';

// ── Refund management ──
export {
    getRefundRequests,
    processRefundRequest,
} from './refundController.js';
