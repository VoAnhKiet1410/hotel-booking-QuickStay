/**
 * nightAuditJob.js — Cron job Night Audit cuối ngày
 *
 * Chạy mỗi ngày lúc 23:55 (Asia/Ho_Chi_Minh).
 *
 * Nghiệp vụ:
 * 1. Auto No-Show: Booking 'confirmed' có checkInDate <= hôm nay
 *    mà khách chưa check-in → cancel + cancellationReason = 'no_show_auto'
 * 2. Auto Checkout: Booking 'checked_in' có checkOutDate <= hôm nay
 *    → chuyển 'completed' + checkedOutAt = now
 * 3. Thu thập thống kê doanh thu + trạng thái phòng
 * 4. Lưu NightAuditLog cho lịch sử
 * 5. Gửi notification cho guest bị ảnh hưởng
 *
 * Pattern: fire-and-forget, Promise.allSettled
 */

import cron from 'node-cron';
import Booking from '../models/Booking.js';
import Room from '../models/Room.js';
import NightAuditLog from '../models/NightAuditLog.js';
import { emitNotification } from '../utils/emitNotification.js';

/**
 * Tính đầu ngày và cuối ngày hôm nay theo giờ VN, convert sang UTC
 * Logic: UTC+7, không phụ thuộc vào timezone của server
 */
const getTodayEndUTC = () => {
    const VN_OFFSET_MS = 7 * 60 * 60 * 1000; // +7 giờ
    const nowMs = Date.now();

    // Tính thời điểm hiện tại theo giờ VN (để xác định "hôm nay VN")
    const nowVN = nowMs + VN_OFFSET_MS;

    // Đầu ngày VN: bỏ phần giờ/phút/giây
    const startOfDayVN = nowVN - (nowVN % (24 * 60 * 60 * 1000));

    // Convert về UTC (trừ offset)
    const startUTC = new Date(startOfDayVN - VN_OFFSET_MS);
    const endUTC = new Date(startOfDayVN - VN_OFFSET_MS + 24 * 60 * 60 * 1000);

    return { startUTC, endUTC };
};

/**
 * Auto No-Show: cancel booking confirmed mà khách không đến
 * Điều kiện: status=confirmed, checkInDate < endOfToday
 */
const processAutoNoShow = async (endUTC, hotelFilter = null) => {
    const query = {
        status: 'confirmed',
        checkInDate: { $lt: endUTC },
    };
    if (hotelFilter) query.hotel = hotelFilter;

    const noShowBookings = await Booking.find(query)
        .populate('room', 'roomType')
        .populate('hotel', 'name');

    if (noShowBookings.length === 0) {
        return { count: 0, succeeded: 0, failed: 0, bookingIds: [] };
    }

    const results = await Promise.allSettled(
        noShowBookings.map(async (booking) => {
            // Cập nhật trạng thái
            booking.status = 'cancelled';
            booking.noShowAt = new Date();
            booking.cancellationReason = 'no_show_auto';

            // Xử lý refund: no-show = KHÔNG hoàn tiền (chuẩn OTA)
            if (booking.isPaid && booking.paymentMethod === 'stripe') {
                booking.refundStatus = 'rejected';
                booking.refundReason = 'Không hoàn tiền do khách không đến nhận phòng (no-show tự động).';
                booking.refundAmount = 0;
            }
            await booking.save();

            // Đánh dấu phòng dirty + sync availability
            if (booking.room?._id) {
                const roomId = booking.room._id;
                const updateFields = { housekeepingStatus: 'dirty' };

                // Kiểm tra còn booking active nào cho phòng này không
                const activeBookings = await Booking.countDocuments({
                    room: roomId,
                    _id: { $ne: booking._id },
                    status: { $in: ['confirmed', 'checked_in'] },
                });

                if (activeBookings === 0) {
                    updateFields.status = 'open';
                }

                await Room.findByIdAndUpdate(roomId, updateFields);
            }

            // Gửi notification cho guest
            const guestId =
                typeof booking.user === 'object'
                    ? booking.user._id.toString()
                    : booking.user.toString();

            const roomType = booking.room?.roomType || 'Phòng';
            const hotelName = booking.hotel?.name || '';

            emitNotification(guestId, {
                type: 'booking_no_show',
                bookingId: booking._id,
                message: `Đặt phòng ${roomType}${hotelName ? ` tại ${hotelName}` : ''} đã bị hủy tự động do không đến nhận phòng.`,
                createdAt: new Date().toISOString(),
            });

            return booking._id;
        }),
    );

    const succeeded = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;
    const bookingIds = results
        .filter((r) => r.status === 'fulfilled')
        .map((r) => r.value);

    return { count: noShowBookings.length, succeeded, failed, bookingIds };
};

/**
 * Auto Checkout: hoàn tất booking checked_in mà đã qua ngày checkout
 * Điều kiện: status=checked_in, checkOutDate <= endOfToday
 */
const processAutoCheckout = async (endUTC, hotelFilter = null) => {
    const query = {
        status: 'checked_in',
        checkOutDate: { $lt: endUTC },
    };
    if (hotelFilter) query.hotel = hotelFilter;

    const overdueBookings = await Booking.find(query)
        .populate('room', 'roomType')
        .populate('hotel', 'name');

    if (overdueBookings.length === 0) {
        return { count: 0, succeeded: 0, failed: 0, bookingIds: [] };
    }

    const results = await Promise.allSettled(
        overdueBookings.map(async (booking) => {
            // Cập nhật trạng thái
            booking.status = 'completed';
            booking.checkedOutAt = new Date();
            await booking.save();

            // Đánh dấu phòng dirty + sync availability
            if (booking.room?._id) {
                const roomId = booking.room._id;

                // Set housekeeping dirty
                const updateFields = { housekeepingStatus: 'dirty' };

                // Kiểm tra còn booking active nào cho phòng này không
                const activeBookings = await Booking.countDocuments({
                    room: roomId,
                    _id: { $ne: booking._id },
                    status: { $in: ['confirmed', 'checked_in'] },
                });

                // Nếu không còn → mở lại phòng (tránh phòng stuck ở soldout)
                if (activeBookings === 0) {
                    updateFields.status = 'open';
                }

                await Room.findByIdAndUpdate(roomId, updateFields);
            }

            // Gửi notification cho guest
            const guestId =
                typeof booking.user === 'object'
                    ? booking.user._id.toString()
                    : booking.user.toString();

            const roomType = booking.room?.roomType || 'Phòng';
            const hotelName = booking.hotel?.name || '';

            emitNotification(guestId, {
                type: 'booking_auto_checkout',
                bookingId: booking._id,
                message: `Booking ${roomType}${hotelName ? ` tại ${hotelName}` : ''} đã được trả phòng tự động. Cảm ơn quý khách!`,
                createdAt: new Date().toISOString(),
            });

            return booking._id;
        }),
    );

    const succeeded = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;
    const bookingIds = results
        .filter((r) => r.status === 'fulfilled')
        .map((r) => r.value);

    return { count: overdueBookings.length, succeeded, failed, bookingIds };
};

/**
 * Thu thập thống kê doanh thu trong ngày (Room Night Revenue)
 * Tính doanh thu từ booking đang lưu trú trong đêm audit
 * (checkInDate <= startUTC && checkOutDate > startUTC)
 */
const collectDailyRevenue = async (startUTC, endUTC, hotelFilter = null) => {
    const query = {
        // Booking overlap với ngày hôm nay:
        // check-in trước hoặc trong ngày, check-out sau đầu ngày
        checkInDate: { $lt: endUTC },
        checkOutDate: { $gt: startUTC },
        status: { $in: ['confirmed', 'checked_in', 'completed'] },
    };
    if (hotelFilter) query.hotel = hotelFilter;

    const bookings = await Booking.find(query, 'totalPrice isPaid status room checkInDate checkOutDate');

    // Debug log
    console.log(`[NightAudit] collectDailyRevenue: range [${startUTC.toISOString()} - ${endUTC.toISOString()}]`);
    console.log(`[NightAudit] hotelFilter: ${hotelFilter}, found ${bookings.length} bookings`);
    bookings.forEach(b => console.log(`  - ${b._id} | status: ${b.status} | price: ${b.totalPrice} | paid: ${b.isPaid}`));

    return {
        totalBookings: bookings.length,
        totalRevenue: bookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0),
        paidBookings: bookings.filter((b) => b.isPaid).length,
        unpaidBookings: bookings.filter((b) => !b.isPaid).length,
    };
};

/**
 * Thu thập trạng thái phòng
 */
const collectRoomStatus = async (hotelFilter = null) => {
    const query = {};
    if (hotelFilter) query.hotel = hotelFilter;

    const rooms = await Room.find(query, 'status housekeepingStatus');
    const now = new Date();

    // Đếm phòng đang có khách (checked_in overlapping hiện tại)
    const occupiedQuery = {
        status: 'checked_in',
        checkInDate: { $lte: now },
        checkOutDate: { $gt: now },
    };
    if (hotelFilter) occupiedQuery.hotel = hotelFilter;
    const occupiedCount = await Booking.countDocuments(occupiedQuery);

    return {
        totalRooms: rooms.length,
        occupied: occupiedCount,
        available: rooms.filter(
            (r) => r.status === 'open' && r.housekeepingStatus === 'clean',
        ).length,
        dirty: rooms.filter((r) => r.housekeepingStatus === 'dirty').length,
        outOfOrder: rooms.filter(
            (r) => r.housekeepingStatus === 'out_of_order',
        ).length,
    };
};

/**
 * Hàm chính Night Audit — gọi tất cả quy trình + lưu log
 *
 * @param {Object} options - Tùy chọn
 * @param {string} options.hotelId - Lọc theo hotel (null = all)
 * @param {string} options.triggeredBy - 'cron' | 'manual'
 * @param {string} options.userId - User ID nếu manual
 */
export const runNightAudit = async (options = {}) => {
    const {
        hotelId = null,
        triggeredBy = 'cron',
        userId = null,
    } = options;

    const startTime = Date.now();
    const startedAt = new Date();
    const auditDate = new Date();
    auditDate.setHours(0, 0, 0, 0);

    console.log(
        `[NightAudit] ${startedAt.toISOString()}: Bắt đầu night audit (${triggeredBy})...`,
    );

    // Tạo log record trước (status=running)
    const auditLog = new NightAuditLog({
        hotel: hotelId || null,
        triggeredBy,
        triggeredByUser: userId,
        auditDate,
        startedAt,
        status: 'running',
    });
    await auditLog.save();

    try {
        const { startUTC, endUTC } = getTodayEndUTC();

        const [noShowResult, checkoutResult, revenueData, roomData] =
            await Promise.all([
                processAutoNoShow(endUTC, hotelId),
                processAutoCheckout(endUTC, hotelId),
                collectDailyRevenue(startUTC, endUTC, hotelId),
                collectRoomStatus(hotelId),
            ]);

        const duration = Date.now() - startTime;

        // Cập nhật audit log
        auditLog.status = 'completed';
        auditLog.completedAt = new Date();
        auditLog.durationMs = duration;
        auditLog.noShow = {
            total: noShowResult.count,
            succeeded: noShowResult.succeeded,
            failed: noShowResult.failed,
            bookingIds: noShowResult.bookingIds,
        };
        auditLog.autoCheckout = {
            total: checkoutResult.count,
            succeeded: checkoutResult.succeeded,
            failed: checkoutResult.failed,
            bookingIds: checkoutResult.bookingIds,
        };
        auditLog.dailyRevenue = revenueData;
        auditLog.roomStatus = roomData;
        await auditLog.save();

        console.log(
            `[NightAudit] Hoàn tất trong ${duration}ms:`,
            `No-show: ${noShowResult.count} (OK: ${noShowResult.succeeded}, Fail: ${noShowResult.failed})`,
            `| Auto-checkout: ${checkoutResult.count} (OK: ${checkoutResult.succeeded}, Fail: ${checkoutResult.failed})`,
        );

        return auditLog;
    } catch (err) {
        // Cập nhật log khi lỗi
        auditLog.status = 'failed';
        auditLog.completedAt = new Date();
        auditLog.durationMs = Date.now() - startTime;
        auditLog.error = err.message;
        await auditLog.save();

        console.error('[NightAudit] Lỗi cron job:', err.message);
        return auditLog;
    }
};

/**
 * Khởi động cron schedule
 * Chạy lúc 23:55 mỗi ngày (timezone Asia/Ho_Chi_Minh)
 * Loop qua từng hotel để tạo audit log riêng biệt
 */
export const startNightAuditJob = () => {
    cron.schedule('55 23 * * *', async () => {
        try {
            const Hotel = (await import('../models/Hotel.js')).default;
            const hotels = await Hotel.find({}, '_id name');

            console.log(`[NightAudit] Bắt đầu cron cho ${hotels.length} khách sạn...`);

            for (const hotel of hotels) {
                try {
                    await runNightAudit({
                        hotelId: hotel._id,
                        triggeredBy: 'cron',
                    });
                    console.log(`[NightAudit] ✅ ${hotel.name} — hoàn tất`);
                } catch (err) {
                    console.error(`[NightAudit] ❌ ${hotel.name} — lỗi:`, err.message);
                }
            }
        } catch (err) {
            console.error('[NightAudit] ❌ Lỗi cron tổng:', err.message);
        }
    }, {
        timezone: 'Asia/Ho_Chi_Minh',
    });

    console.log(
        '[NightAudit] ✅ Cron job Night Audit đã khởi động (23:55 mỗi ngày).',
    );
};
