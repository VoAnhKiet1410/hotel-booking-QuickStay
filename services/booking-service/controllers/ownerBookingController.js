/**
 * Owner Booking Controller
 *
 * Xử lý các thao tác booking phía chủ khách sạn:
 * - getOwnerBookings: danh sách tất cả bookings
 * - getOwnerBookingSummary: thống kê tổng hợp (dashboard)
 * - getOwnerCalendar: dữ liệu lịch phòng
 * - updateBookingStatusByOwner: cập nhật trạng thái booking
 */
import Booking from '../models/Booking.js';
import Room from '../models/Room.js';
import Hotel from '../models/Hotel.js';
import stripe from '../configs/stripe.js';
import { bookingCancelledEmail } from '../utils/emailTemplates.js';
import { trySendEmail } from '../utils/emailHelper.js';
import { emitNotification } from '../utils/emitNotification.js';
import { calculateADR, calculateRevPAR, calculateOccupancyRate, calculateCancellationRate } from '../utils/revenueUtils.js';
import { syncRoomAvailabilityStatus, getOwnerHotelIds, validateTransition } from './bookingHelpers.js';

// ═══════════════════════════════════════════
// GET OWNER CALENDAR
// ═══════════════════════════════════════════
export const getOwnerCalendar = async (req, res) => {
    try {
        const user = req.user;
        const { start, end } = req.query;

        if (!start || !end) {
            return res.status(400).json({ success: false, message: 'start và end là bắt buộc (YYYY-MM-DD)' });
        }

        const startDate = new Date(start);
        const endDate = new Date(end);
        endDate.setHours(23, 59, 59, 999); // đến cuối ngày end

        if (isNaN(startDate) || isNaN(endDate) || startDate > endDate) {
            return res.status(400).json({ success: false, message: 'Ngày không hợp lệ' });
        }

        // Lấy tất cả khách sạn của owner
        const hotelIds = await getOwnerHotelIds(user._id);

        if (hotelIds.length === 0) {
            return res.json({ success: true, data: { events: [], roomsMeta: [] } });
        }

        // Tìm bookings overlap với date range — status không bị hủy
        const bookings = await Booking.find({
            hotel: { $in: hotelIds },
            status: { $in: ['pending', 'confirmed', 'checked_in', 'completed'] },
            checkInDate: { $lt: endDate },
            checkOutDate: { $gt: startDate },
        })
            .populate('room', 'roomType images pricePerNight floor')
            .populate('hotel', 'name')
            .populate('user', 'username email')
            .lean();

        // Map sang format events cho calendar
        const STATUS_COLOR = {
            pending: '#f59e0b',      // amber
            confirmed: '#3b82f6',    // blue
            checked_in: '#10b981',   // emerald
            completed: '#8b5cf6',    // violet
        };

        const events = bookings.map((b) => ({
            id: b._id,
            roomId: b.room?._id,
            roomType: b.room?.roomType || 'Phòng',
            hotelName: b.hotel?.name || '',
            guestName: b.user?.username || b.user?.email || 'Khách',
            guests: b.guests,
            checkIn: b.checkInDate,
            checkOut: b.checkOutDate,
            status: b.status,
            color: STATUS_COLOR[b.status] || '#94a3b8',
            totalPrice: b.totalPrice,
            isPaid: b.isPaid,
            paymentMethod: b.paymentMethod,
            specialRequests: b.specialRequests || '',
        }));

        // Metadata các phòng (để hiển thị cả phòng trống)
        const rooms = await Room.find({ hotel: { $in: hotelIds } })
            .select('_id roomType floor pricePerNight hotel status')
            .populate('hotel', 'name')
            .lean();

        const roomsMeta = rooms.map((r) => ({
            id: r._id,
            roomType: r.roomType,
            floor: r.floor,
            pricePerNight: r.pricePerNight,
            hotelName: r.hotel?.name || '',
            status: r.status,
        }));

        return res.json({ success: true, data: { events, roomsMeta } });
    } catch (error) {
        console.error('getOwnerCalendar error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
}

// ═══════════════════════════════════════════
// GET OWNER BOOKINGS
// ═══════════════════════════════════════════
export const getOwnerBookings = async (req, res) => {
    try {
        const user = req.user;

        // Lấy TẤT CẢ khách sạn của owner
        const hotelIds = await getOwnerHotelIds(user._id);

        if (hotelIds.length === 0) {
            return res.json({ success: true, data: [] });
        }

        const bookings = await Booking.find({ hotel: { $in: hotelIds } })
            .sort({ createdAt: -1 })
            .populate('room')
            .populate('hotel', 'name city')
            .populate('user', 'username email imageUrl')  // chỉ lấy fields cần thiết
            .lean();

        return res.json({ success: true, data: bookings });
    } catch (error) {
        console.error('getOwnerBookings error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
}

// ═══════════════════════════════════════════
// GET OWNER BOOKING SUMMARY (Dashboard)
// ═══════════════════════════════════════════
export const getOwnerBookingSummary = async (req, res) => {
    try {
        const user = req.user;
        const currentYear = new Date().getFullYear();
        const startOfYear = new Date(currentYear, 0, 1);
        const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59);

        // Lấy TẤT CẢ khách sạn của owner
        const hotelIds = await getOwnerHotelIds(user._id);

        const aggregated = await Booking.aggregate([
            { $match: { hotel: { $in: hotelIds } } },
            {
                $facet: {
                    totals: [
                        {
                            $group: {
                                _id: null,
                                totalBookings: { $sum: 1 },
                                minBookingDate: { $min: '$createdAt' },
                                customers: { $addToSet: '$user' },
                                totalRevenue: {
                                    $sum: {
                                        $cond: [
                                            {
                                                $and: [
                                                    { $eq: ['$isPaid', true] },
                                                    { $ne: ['$status', 'cancelled'] },
                                                ],
                                            },
                                            '$totalPrice',
                                            0,
                                        ],
                                    },
                                },
                                totalNightsSold: {
                                    $sum: {
                                        $cond: [
                                            {
                                                $and: [
                                                    { $eq: ['$isPaid', true] },
                                                    { $in: ['$status', ['completed', 'checked_in']] },
                                                ],
                                            },
                                            { $divide: [{ $subtract: ["$checkOutDate", "$checkInDate"] }, 1000 * 60 * 60 * 24] },
                                            0,
                                        ],
                                    }
                                }
                            },
                        },
                        {
                            $project: {
                                _id: 0,
                                totalBookings: 1,
                                totalRevenue: 1,
                                totalNightsSold: 1,
                                minBookingDate: 1,
                                totalCustomers: { $size: '$customers' },
                            },
                        },
                    ],
                    byStatus: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
                    byPayment: [{ $group: { _id: '$isPaid', count: { $sum: 1 } } }],
                    byPaymentMethod: [
                        {
                            $group: {
                                _id: '$paymentMethod',
                                count: { $sum: 1 },
                                revenue: {
                                    $sum: {
                                        $cond: [{ $and: [{ $eq: ['$isPaid', true] }, { $ne: ['$status', 'cancelled'] }] }, '$totalPrice', 0]
                                    }
                                }
                            }
                        }
                    ],
                    refundStats: [
                        {
                            $match: { isRefunded: true }
                        },
                        {
                            $group: {
                                _id: null,
                                totalRefunded: { $sum: 1 },
                                totalRefundAmount: { $sum: '$refundAmount' }
                            }
                        }
                    ],
                    monthlyRevenue: [
                        {
                            $match: {
                                createdAt: { $gte: startOfYear, $lte: endOfYear },
                                isPaid: true,
                                status: { $ne: 'cancelled' }
                            }
                        },
                        {
                            $group: {
                                _id: { $month: "$createdAt" },
                                revenue: { $sum: "$totalPrice" }
                            }
                        }
                    ]
                },
            },
        ]);

        const totals = aggregated?.[0]?.totals?.[0] || {
            totalBookings: 0,
            totalRevenue: 0,
            totalNightsSold: 0,
            minBookingDate: new Date(),
            totalCustomers: 0,
        };

        const statusCounts = (aggregated?.[0]?.byStatus || []).reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
        }, {});

        const paymentCounts = (aggregated?.[0]?.byPayment || []).reduce(
            (acc, item) => {
                const key = item._id ? 'paid' : 'unpaid';
                acc[key] = item.count;
                return acc;
            },
            { paid: 0, unpaid: 0 },
        );

        const paymentMethodCounts = (aggregated?.[0]?.byPaymentMethod || []).reduce(
            (acc, item) => {
                const key = item._id || 'unknown';
                acc[key] = { count: item.count, revenue: item.revenue };
                return acc;
            },
            {}
        );

        const refundStatsRaw = aggregated?.[0]?.refundStats?.[0] || { totalRefunded: 0, totalRefundAmount: 0 };

        // Initialize revenue trend for all 12 months
        const monthNames = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
        const monthlyRevenueData = aggregated?.[0]?.monthlyRevenue || [];

        const revenueTrend = monthNames.map((monthName, index) => {
            const monthData = monthlyRevenueData.find(m => m._id === index + 1);
            return {
                month: monthName,
                revenue: monthData ? monthData.revenue : 0
            };
        });

        const recentBookings = await Booking.find({ hotel: { $in: hotelIds } })
            .sort({ createdAt: -1 })
            .limit(8)
            .populate('room')
            .populate('hotel', 'name city')
            .populate('user')
            .lean();

        // Tính ADR & RevPAR
        const roomsTotal = await Room.aggregate([
            { $match: { hotel: { $in: hotelIds } } },
            { $group: { _id: null, capacity: { $sum: '$totalRooms' } } }
        ]);
        const totalRoomsCapacity = roomsTotal[0]?.capacity || 0;

        const minBookingDate = totals.minBookingDate || new Date();
        const daysOpen = Math.max(1, Math.ceil((new Date() - new Date(minBookingDate)) / (1000 * 60 * 60 * 24)));
        const totalAvailableNights = totalRoomsCapacity * daysOpen;

        const adr = calculateADR(totals.totalRevenue, totals.totalNightsSold);
        const revpar = calculateRevPAR(totals.totalRevenue, totalAvailableNights);
        const occupancyRate = calculateOccupancyRate(totals.totalNightsSold, totalAvailableNights);
        const cancellationRate = calculateCancellationRate(
            statusCounts.cancelled || 0,
            totals.totalBookings
        );

        return res.json({
            success: true,
            data: {
                totals,
                adr,
                revpar,
                occupancyRate,
                cancellationRate,
                statusCounts: {
                    pending: statusCounts.pending || 0,
                    confirmed: statusCounts.confirmed || 0,
                    checked_in: statusCounts.checked_in || 0,
                    completed: statusCounts.completed || 0,
                    cancelled: statusCounts.cancelled || 0,
                },
                paymentCounts,
                paymentMethodCounts,
                refundStats: refundStatsRaw,
                recentBookings,
                revenueTrend
            },
        });
    } catch (error) {
        console.error('getOwnerBookingSummary error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
}

// ═══════════════════════════════════════════
// UPDATE BOOKING STATUS BY OWNER
// ═══════════════════════════════════════════
export const updateBookingStatusByOwner = async (req, res) => {
    try {
        const user = req.user;

        const { id } = req.params;
        const { status, isPaid, cancelReason } = req.body;

        // Lấy TẤT CẢ hotels của owner (multi-hotel)
        const ownerHotelIds = await getOwnerHotelIds(user._id);

        const booking = await Booking.findOne({ _id: id, hotel: { $in: ownerHotelIds } });

        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        const validStatuses = ['pending', 'confirmed', 'checked_in', 'completed', 'cancelled'];
        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        // Check-in và Check-out PHẢI dùng endpoint riêng (/check-in, /check-out)
        // để đảm bảo đầy đủ business logic (validate ngày, audit trail, housekeeping, room sync)
        // và tránh duplicate notifications
        if (status === 'checked_in') {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng sử dụng chức năng "Nhận phòng" (check-in) thay vì cập nhật trạng thái trực tiếp',
            });
        }
        if (status === 'completed') {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng sử dụng chức năng "Trả phòng" (check-out) thay vì cập nhật trạng thái trực tiếp',
            });
        }

        // === Transition Guards — dùng shared lifecycle map ===
        if (status) {
            const transition = validateTransition(booking.status, status);
            if (!transition.valid) {
                return res.status(400).json({
                    success: false,
                    message: transition.message,
                });
            }
            booking.status = status;

            // Set timestamps based on status
            if (status === 'checked_in' && !booking.checkedInAt) {
                booking.checkedInAt = new Date();
            }
            if (status === 'completed' && !booking.checkedOutAt) {
                booking.checkedOutAt = new Date();
            }
            // Lưu lý do hủy nếu owner cung cấp
            if (status === 'cancelled' && cancelReason) {
                booking.cancellationReason = cancelReason;
            }
        }

        if (typeof isPaid === 'boolean') {
            booking.isPaid = isPaid;
            if (isPaid && !booking.paidAt) {
                booking.paidAt = new Date();
            }
        }

        // === AUTO REFUND khi owner huỷ booking đã thanh toán Stripe ===
        if (status === 'cancelled' && booking.isPaid && booking.paymentMethod === 'stripe' && !booking.isRefunded) {
            const paymentIntentId = booking.stripePaymentIntentId;

            // Nếu chưa có paymentIntentId, thử lấy từ session
            let resolvedIntentId = paymentIntentId;
            if (!resolvedIntentId && booking.stripeSessionId) {
                try {
                    const session = await stripe.checkout.sessions.retrieve(booking.stripeSessionId);
                    resolvedIntentId = session.payment_intent;
                    if (resolvedIntentId) {
                        booking.stripePaymentIntentId = resolvedIntentId;
                    }
                } catch (stripeErr) {
                    console.error('Cannot retrieve Stripe session for refund:', stripeErr.message);
                }
            }

            if (resolvedIntentId) {
                try {
                    await stripe.refunds.create({
                        payment_intent: resolvedIntentId,
                        reason: 'requested_by_customer',
                        metadata: { bookingId: booking._id.toString(), cancelledByOwner: 'true' },
                    });

                    booking.isRefunded = true;
                    booking.refundedAt = new Date();
                    booking.refundAmount = booking.totalPrice;
                    booking.refundReason = cancelReason || 'Hủy bởi chủ khách sạn';
                    booking.refundStatus = 'completed';
                    booking.refundType = 'full';

                    // Đồng bộ refundRequest nếu guest đã tạo trước đó
                    // Tránh double refund: request vẫn pending → owner approve lần 2
                    if (booking.refundRequest?.status === 'pending') {
                        booking.refundRequest.status = 'approved';
                        booking.refundRequest.approvedBy = user._id.toString();
                        booking.refundRequest.approvedAt = new Date();
                    }
                    console.log(`Auto refund success for booking ${booking._id}`);
                } catch (refundErr) {
                    // Lưu trạng thái failed để admin/owner biết cần xử lý thủ công
                    booking.refundStatus = 'failed';
                    booking.refundFailReason = refundErr.message;
                    console.error('Auto Stripe refund failed:', refundErr.message);
                    // Không throw — vẫn tiếp tục hủy booking, owner cần xử lý refund thủ công
                }
            } else {
                console.warn(`Cannot auto refund booking ${booking._id}: no stripePaymentIntentId`);
            }
        }

        await booking.save();

        // === Đồng bộ trạng thái phòng khi owner cập nhật status ===
        if (booking.room) {
            const roomId = typeof booking.room === 'object' ? booking.room._id : booking.room;
            if (status === 'cancelled') {
                // Hủy booking → có thể khôi phục phòng về open
                const syncResult = await syncRoomAvailabilityStatus(
                    roomId,
                    { excludeBookingId: booking._id }
                );
                if (syncResult.statusChanged && syncResult.newStatus === 'open') {
                    console.info(`[Owner Cancel] Room restored to OPEN after booking ${booking._id} cancelled by owner`);
                }
            } else if (status === 'confirmed') {
                // Xác nhận → kiểm tra nếu phòng đã hết slot
                const syncResult = await syncRoomAvailabilityStatus(roomId);
                if (syncResult.statusChanged && syncResult.newStatus === 'soldout') {
                    console.info(`[Owner Confirm] Room ${roomId} → SOLDOUT after owner confirmed booking ${booking._id}`);
                }
            }
        }

        const populatedBooking = await Booking.findById(booking._id)
            .populate('room')
            .populate('hotel', 'name')
            .populate('user');

        // Gửi notification rõ ràng theo từng trạng thái cho user
        if (status && populatedBooking?.user?._id) {
            const userId = populatedBooking.user._id.toString();
            const roomType = populatedBooking.room?.roomType || 'Phòng';
            const hotelName = populatedBooking.hotel?.name || '';
            const loc = hotelName ? ` tại ${hotelName}` : '';

            // Chỉ confirmed và cancelled — checked_in/completed xử lý bởi endpoint riêng
            const notifMap = {
                confirmed: {
                    type: 'booking_confirmed',
                    message: `Đặt phòng ${roomType}${loc} đã được xác nhận thành công.`,
                },
                cancelled: {
                    type: 'booking_cancelled_by_owner',
                    message: `Đặt phòng ${roomType}${loc} đã bị hủy bởi khách sạn.`,
                },
            };

            const notif = notifMap[status];
            if (notif) {
                emitNotification(userId, {
                    ...notif,
                    bookingId: booking._id,
                    status,
                    createdAt: new Date().toISOString(),
                });
            }

            // Gửi email hủy booking ngay khi status = cancelled
            if (status === 'cancelled' && populatedBooking?.user) {
                trySendEmail(
                    bookingCancelledEmail,
                    populatedBooking,
                    populatedBooking.user,
                    'Booking cancelled by owner',
                ).catch(() => { });
            }

            // Gửi thêm notification hoàn tiền nếu đã refund thành công
            if (status === 'cancelled' && booking.isRefunded) {
                emitNotification(userId, {
                    type: 'booking_refunded',
                    bookingId: booking._id,
                    message: `Hoàn tiền ${booking.refundAmount?.toLocaleString('vi-VN')}₫ cho đặt phòng ${roomType}${loc} đang được xử lý.`,
                    refundAmount: booking.refundAmount,
                    createdAt: new Date().toISOString(),
                });
            }
        }

        return res.json({ success: true, data: populatedBooking || booking });
    } catch (error) {
        console.error('Update booking error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
}
