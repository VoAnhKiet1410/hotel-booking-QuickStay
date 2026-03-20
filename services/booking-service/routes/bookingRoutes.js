import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { requireOwnerWithHotel } from '../middleware/ownerMiddleware.js';
import {
    cancelMyBooking,
    checkRoomAvailability,
    createBooking,
    getBookingById,
    getMyBookings,
    getOwnerBookings,
    getOwnerBookingSummary,
    getOwnerCalendar,
    updateBookingStatusByOwner,
    checkInBooking,
    checkOutBooking,
    getRefundRequests,
    processRefundRequest,
    markNoShow,
    getTodayArrivalsAndDepartures,
} from '../controllers/bookingController.js';

import { getGuestFolio } from '../controllers/guestFolioController.js';

const router = express.Router();

// Route công khai
router.post('/check-availability', checkRoomAvailability);

// Routes cho khách hàng (user) - chỉ cần đăng nhập
router.post('/', protect, createBooking);
router.get('/my', protect, getMyBookings);
router.patch('/my/:id/cancel', protect, cancelMyBooking);

// Routes chỉ cho owner — requireOwnerWithHotel tự check role + set req.hotel
router.get('/owner', protect, requireOwnerWithHotel, getOwnerBookings);
router.get('/owner/summary', protect, requireOwnerWithHotel, getOwnerBookingSummary);
router.get('/owner/calendar', protect, requireOwnerWithHotel, getOwnerCalendar);
router.patch('/owner/:id', protect, requireOwnerWithHotel, updateBookingStatusByOwner);
router.patch('/owner/:id/check-in', protect, requireOwnerWithHotel, checkInBooking);
router.patch('/owner/:id/check-out', protect, requireOwnerWithHotel, checkOutBooking);
router.get('/owner/refund-requests', protect, requireOwnerWithHotel, getRefundRequests);
router.patch('/owner/:id/refund-request', protect, requireOwnerWithHotel, processRefundRequest);
router.patch('/owner/:id/no-show', protect, requireOwnerWithHotel, markNoShow);
router.get('/owner/today', protect, requireOwnerWithHotel, getTodayArrivalsAndDepartures);

// Guest Folio — cần đăng nhập (guest xem booking mình, owner xem hotel mình)
router.get('/:id/folio', protect, getGuestFolio);

// Dynamic param route — PHẢI đặt sau các static routes
router.get('/:id', protect, getBookingById);

export default router;
