/**
 * Check-in / Check-out Controller
 *
 * Xử lý các thao tác nhận/trả phòng:
 * - checkInBooking: nhận phòng
 * - checkOutBooking: trả phòng
 * - markNoShow: đánh dấu khách không đến
 * - getTodayArrivalsAndDepartures: danh sách khách đến/đi hôm nay
 */
import Booking from '../models/Booking.js';
import Room from '../models/Room.js';
import Hotel from '../models/Hotel.js';
import { checkOutThankYouEmail } from '../utils/emailTemplates.js';
import { trySendEmail } from '../utils/emailHelper.js';
import { emitNotification } from '../utils/emitNotification.js';
import { syncRoomAvailabilityStatus, getOwnerHotelIds } from './bookingHelpers.js';

// ═══════════════════════════════════════════
// CHECK-IN BOOKING
// ═══════════════════════════════════════════
export const checkInBooking = async (req, res) => {
    try {
        const user = req.user;

        const { id } = req.params;

        // Lấy TẤT CẢ hotels của owner (multi-hotel)
        const ownerHotelIds = await getOwnerHotelIds(user._id);

        const booking = await Booking.findOne({ _id: id, hotel: { $in: ownerHotelIds } });

        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        // Guard: chỉ cho phép check-in booking đã confirmed
        // pending → chưa được xác nhận, cancelled/completed → đã kết thúc
        if (booking.status !== 'confirmed') {
            const statusMessages = {
                pending: 'Booking chưa được xác nhận. Vui lòng xác nhận trước khi nhận phòng.',
                cancelled: 'Không thể nhận phòng cho booking đã hủy',
                completed: 'Booking đã hoàn tất trước đó',
                checked_in: 'Khách đã nhận phòng rồi',
            };
            return res.status(400).json({
                success: false,
                message: statusMessages[booking.status] || `Không thể nhận phòng ở trạng thái "${booking.status}"`,
            });
        }

        // Validate ngày check-in — chỉ cho phép ±1 ngày so với checkInDate
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const checkInDay = new Date(booking.checkInDate);
        checkInDay.setHours(0, 0, 0, 0);
        const diffDays = Math.round((today - checkInDay) / (1000 * 60 * 60 * 24));

        if (diffDays < -1 || diffDays > 1) {
            return res.status(400).json({
                success: false,
                message: 'Chỉ có thể nhận phòng trong khoảng ±1 ngày so với ngày check-in dự kiến',
            });
        }

        booking.status = 'checked_in';
        booking.checkedInAt = new Date();
        booking.checkedInBy = user._id; // Audit trail
        await booking.save();

        const populatedBooking = await Booking.findById(booking._id)
            .populate('room')
            .populate('user')
            .populate('hotel');

        // Thông báo user: nhận phòng thành công
        if (populatedBooking?.user?._id) {
            const roomType = populatedBooking.room?.roomType || 'Phòng';
            const hotelName = populatedBooking.hotel?.name || '';
            emitNotification(populatedBooking.user._id.toString(), {
                type: 'booking_checked_in',
                bookingId: booking._id,
                message: `Bạn đã nhận phòng ${roomType}${hotelName ? ` tại ${hotelName}` : ''} thành công. Chúc bạn nghỉ dưỡng vui vẻ!`,
                createdAt: new Date().toISOString(),
            });
        }

        return res.json({ success: true, data: populatedBooking || booking });
    } catch (error) {
        console.error('Check-in error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
}

// ═══════════════════════════════════════════
// CHECK-OUT BOOKING (Trả phòng)
// ═══════════════════════════════════════════
export const checkOutBooking = async (req, res) => {
    try {
        const user = req.user;

        const { id } = req.params;

        // Lấy TẤT CẢ hotels của owner (multi-hotel)
        const ownerHotelIds = await getOwnerHotelIds(user._id);

        const booking = await Booking.findOne({ _id: id, hotel: { $in: ownerHotelIds } });

        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        if (booking.status === 'cancelled') {
            return res.status(400).json({ success: false, message: 'Cannot check-out a cancelled booking' });
        }

        if (booking.status === 'completed') {
            return res.status(400).json({ success: false, message: 'Booking already completed' });
        }

        // Bắt buộc phải qua check-in trước khi check-out
        if (booking.status !== 'checked_in') {
            return res.status(400).json({ success: false, message: 'Khách phải nhận phòng (check-in) trước khi trả phòng' });
        }

        // Mark as completed
        booking.status = 'completed';
        booking.checkedOutAt = new Date();
        booking.checkedOutBy = user._id; // Audit trail

        // payAtHotel cần owner xác nhận đã thu tiền
        if (booking.paymentMethod === 'payAtHotel' && !booking.isPaid) {
            const { confirmPayment } = req.body;
            if (confirmPayment) {
                booking.isPaid = true;
                booking.paidAt = new Date();
            }
            // Nếu owner không confirm payment → booking vẫn completed nhưng isPaid=false
            // Owner có thể cập nhật sau qua dashboard
        }

        await booking.save();

        // Auto-set housekeeping dirty khi checkout
        const roomId = typeof booking.room === 'object' ? booking.room._id : booking.room;
        await Room.findByIdAndUpdate(roomId, {
            housekeepingStatus: 'dirty',
        });

        // Đồng bộ trạng thái phòng — khôi phục open nếu có slot trống
        // checkAllDates: true → đếm tất cả booking active, không chỉ hôm nay
        const syncResult = await syncRoomAvailabilityStatus(roomId, { checkAllDates: true });
        if (syncResult.statusChanged && syncResult.newStatus === 'open') {
            console.info(`[Check-out] Room ${roomId} → OPEN after booking ${booking._id} completed`);
        }

        const populatedBooking = await Booking.findById(booking._id)
            .populate('room')
            .populate('user')
            .populate('hotel');

        // Thông báo user: trả phòng hoàn tất
        if (populatedBooking?.user?._id) {
            const hotelName = populatedBooking.hotel?.name || populatedBooking.room?.roomType || 'khách sạn';
            emitNotification(populatedBooking.user._id.toString(), {
                type: 'booking_completed',
                bookingId: booking._id,
                message: `Cảm ơn bạn đã lưu trú tại ${hotelName}. Hẹn gặp lại!`,
                createdAt: new Date().toISOString(),
            });
        }

        // Gửi email cảm ơn sau checkout
        if (populatedBooking?.user) {
            trySendEmail(
                checkOutThankYouEmail,
                populatedBooking,
                populatedBooking.user,
                'Check-out thank you',
            ).catch(() => { }); // fire-and-forget
        }

        return res.json({ success: true, data: populatedBooking || booking });
    } catch (error) {
        console.error('Check-out error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
}

// ═══════════════════════════════════════════
// MARK NO-SHOW
// ═══════════════════════════════════════════
/**
 * PATCH /api/bookings/owner/:id/no-show
 * Owner đánh dấu khách không đến (no-show).
 * Nghiệp vụ chuẩn: cancel booking nhưng KHÔNG hoàn tiền.
 */
export const markNoShow = async (req, res) => {
    try {
        const user = req.user;
        const { id } = req.params;

        // Xác minh booking thuộc khách sạn của owner
        const ownerHotelIds = await getOwnerHotelIds(user._id);

        const booking = await Booking.findOne({ _id: id, hotel: { $in: ownerHotelIds } })
            .populate('room')
            .populate('hotel')
            .populate('user');

        if (!booking) {
            return res.status(404).json({ success: false, message: 'Đặt phòng không tồn tại' });
        }

        // Chỉ áp dụng no-show cho booking đang ở trạng thái confirmed
        if (booking.status !== 'confirmed') {
            return res.status(400).json({
                success: false,
                message: `Không thể đánh dấu no-show cho booking ở trạng thái "${booking.status}"`,
            });
        }

        // Phải qua ngày check-in
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const checkInDay = new Date(booking.checkInDate);
        checkInDay.setHours(0, 0, 0, 0);

        if (checkInDay > today) {
            return res.status(400).json({
                success: false,
                message: 'Chỉ có thể đánh dấu no-show vào hoặc sau ngày check-in',
            });
        }

        // Cập nhật: cancel + ghi thời điểm no-show, KHÔNG tạo refundRequest
        booking.status = 'cancelled';
        booking.noShowAt = new Date();
        booking.cancellationReason = 'no_show';
        booking.noShowBy = user._id; // Audit trail

        // Ghi nhận rõ ràng no-show = không hoàn tiền
        if (booking.isPaid) {
            booking.refundStatus = 'rejected';
            booking.refundReason = 'Không hoàn tiền do khách không đến (no-show)';
        }

        await booking.save();

        // No-show: phòng chưa có khách ở → set 'clean' (không phải 'dirty')
        if (booking.room?._id) {
            await Room.findByIdAndUpdate(booking.room._id, {
                housekeepingStatus: 'clean',
            });

            // Đồng bộ trạng thái phòng — khôi phục open nếu có slot trống
            // checkAllDates: true → đếm tất cả booking active, không chỉ hôm nay
            const syncResult = await syncRoomAvailabilityStatus(
                booking.room._id,
                { excludeBookingId: booking._id, checkAllDates: true }
            );
            if (syncResult.statusChanged && syncResult.newStatus === 'open') {
                console.info(`[No-show] Room ${booking.room._id} → OPEN after booking ${booking._id} no-show`);
            }
        }

        const roomType = booking.room?.roomType || 'Phòng';
        const hotelName = booking.hotel?.name || '';
        const guestId = typeof booking.user === 'object'
            ? booking.user._id.toString()
            : booking.user.toString();
        const guestName = booking.user?.username || booking.user?.email || 'Khách';

        // Thông báo cho khách
        emitNotification(guestId, {
            type: 'booking_no_show',
            bookingId: booking._id,
            message: `Đặt phòng ${roomType}${hotelName ? ` tại ${hotelName}` : ''} đã bị hủy do không đến nhận phòng.`,
            createdAt: new Date().toISOString(),
        });

        // Thông báo xác nhận cho owner
        emitNotification(user._id.toString(), {
            type: 'booking_no_show',
            bookingId: booking._id,
            message: `Đã đánh dấu no-show: ${guestName}  ${roomType}.`,
            createdAt: new Date().toISOString(),
        });

        console.info(`[No-show] booking ${booking._id} marked by owner ${user._id}`);

        return res.json({
            success: true,
            message: `Đã đánh dấu no-show cho ${guestName}`,
            data: booking,
        });
    } catch (error) {
        console.error('markNoShow error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ═══════════════════════════════════════════
// GET TODAY ARRIVALS & DEPARTURES
// ═══════════════════════════════════════════
/**
 * GET /api/bookings/owner/today
 * Lấy danh sách khách đến (arrivals) và đi (departures) trong ngày hôm nay
 */
export const getTodayArrivalsAndDepartures = async (req, res) => {
    try {
        const user = req.user;
        const ownerHotelIds = await getOwnerHotelIds(user._id);

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const todayEnd = new Date(todayStart);
        todayEnd.setDate(todayEnd.getDate() + 1);

        // Arrivals chỉ lấy confirmed (pending chưa sẵn sàng check-in)
        const arrivals = await Booking.find({
            hotel: { $in: ownerHotelIds },
            checkInDate: { $gte: todayStart, $lt: todayEnd },
            status: 'confirmed',
        })
            .populate('room', 'roomType name')
            .populate('user', 'username email phone')
            .populate('hotel', 'name')
            .sort({ createdAt: -1 })
            .lean();

        // Departures: Khách trả phòng hôm nay (chỉ checked_in — phải qua check-in trước)
        const departures = await Booking.find({
            hotel: { $in: ownerHotelIds },
            checkOutDate: { $gte: todayStart, $lt: todayEnd },
            status: 'checked_in',
        })
            .populate('room', 'roomType name')
            .populate('user', 'username email phone')
            .populate('hotel', 'name')
            .sort({ createdAt: -1 })
            .lean();

        // Overdue — khách ở quá hạn (checkOutDate < hôm nay, vẫn checked_in)
        const overdue = await Booking.find({
            hotel: { $in: ownerHotelIds },
            checkOutDate: { $lt: todayStart },
            status: 'checked_in',
        })
            .populate('room', 'roomType name')
            .populate('user', 'username email phone')
            .populate('hotel', 'name')
            .sort({ checkOutDate: 1 })
            .lean();

        return res.json({
            success: true,
            data: {
                arrivals,
                departures,
                overdue,
            }
        });
    } catch (error) {
        console.error('getTodayArrivalsAndDepartures error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};
