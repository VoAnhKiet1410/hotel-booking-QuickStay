/**
 * Guest Booking Controller
 *
 * Xử lý các thao tác booking phía khách hàng:
 * - checkRoomAvailability: kiểm tra phòng trống
 * - createBooking: tạo đặt phòng mới
 * - getMyBookings: xem danh sách booking của mình
 * - getBookingById: xem chi tiết 1 booking
 * - cancelMyBooking: khách tự hủy booking
 */
import Booking from '../models/Booking.js';
import Room from '../models/Room.js';
import Hotel from '../models/Hotel.js';
import Promotion from '../models/Promotion.js';
import Coupon from '../models/Coupon.js';
import stripe from '../configs/stripe.js';
import { bookingConfirmationEmail, bookingCancelledEmail, refundApprovedEmail } from '../utils/emailTemplates.js';
import { calculateNights, validateBookingDates } from '../utils/dateUtils.js';
import { trySendEmail } from '../utils/emailHelper.js';
import { emitNotification } from '../utils/emitNotification.js';
import { getAvailableRoomsCount, syncRoomAvailabilityStatus } from './bookingHelpers.js';

// ═══════════════════════════════════════════
// CHECK ROOM AVAILABILITY
// ═══════════════════════════════════════════
export const checkRoomAvailability = async (req, res) => {
    try {
        const { roomId, checkInDate, checkOutDate } = req.body;

        if (!roomId || !checkInDate || !checkOutDate) {
            return res.status(400).json({
                success: false,
                message: 'roomId, checkInDate, checkOutDate are required',
            })
        }

        const dateValidation = validateBookingDates(checkInDate, checkOutDate);
        if (!dateValidation.valid) {
            return res.status(400).json({
                success: false,
                message: dateValidation.message,
            })
        }

        const nights = calculateNights(checkInDate, checkOutDate);

        if (!nights) {
            return res.status(400).json({
                success: false,
                message: 'Invalid check-in/check-out dates',
            })
        }

        const room = await Room.findById(roomId);

        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Room not found',
            })
        }

        if (room.status !== 'open') {
            return res.json({
                success: true,
                data: {
                    isAvailable: false,
                    availableRooms: 0,
                    reason: 'room_closed',
                },
            })
        }

        const availableRooms = await getAvailableRoomsCount(room._id, checkInDate, checkOutDate);

        if (availableRooms <= 0) {
            return res.json({
                success: true,
                data: {
                    isAvailable: false,
                    availableRooms: 0,
                    reason: 'fully_booked',
                },
            })
        }

        return res.json({
            success: true,
            data: {
                isAvailable: true,
                availableRooms,
                totalRooms: room.totalRooms,
                nights,
            },
        })
    } catch (error) {
        console.error('Check availability error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
}

// ═══════════════════════════════════════════
// CREATE BOOKING
// ═══════════════════════════════════════════
export const createBooking = async (req, res) => {
    try {
        const user = req.user;

        const { roomId, checkInDate, checkOutDate, guests, paymentMethod, couponCode, specialRequests } = req.body;

        console.log('Create booking request:', { roomId, checkInDate, checkOutDate, guests, paymentMethod });

        if (!roomId || !checkInDate || !checkOutDate || !guests) {
            return res.status(400).json({
                success: false,
                message: 'roomId, checkInDate, checkOutDate, guests are required',
            })
        }

        const dateValidation = validateBookingDates(checkInDate, checkOutDate);
        if (!dateValidation.valid) {
            return res.status(400).json({
                success: false,
                message: dateValidation.message,
            })
        }

        const parsedGuests = Number(guests);
        if (Number.isNaN(parsedGuests) || parsedGuests <= 0) {
            return res.status(400).json({ success: false, message: 'guests must be a positive number' });
        }

        const nights = calculateNights(checkInDate, checkOutDate);
        if (!nights) {
            return res.status(400).json({ success: false, message: 'Invalid check-in/check-out dates' });
        }

        const room = await Room.findById(roomId);
        if (!room) {
            return res.status(404).json({ success: false, message: 'Room not found' });
        }

        if (room.status !== 'open') {
            return res.status(400).json({ success: false, message: 'Room is not available for booking' });
        }

        const availableRooms = await getAvailableRoomsCount(room._id, checkInDate, checkOutDate);

        if (availableRooms <= 0) {
            return res.status(400).json({
                success: false,
                message: 'No rooms available for selected dates',
            })
        }

        if (parsedGuests > room.capacity) {
            return res.status(400).json({ success: false, message: 'Guests exceed room capacity' });
        }

        const finalPaymentMethod = paymentMethod === 'stripe' ? 'stripe' : 'payAtHotel';

        const totalPrice = room.pricePerNight * nights;

        // === Áp dụng coupon nếu có ===
        let discountAmount = 0;
        let appliedPromotion = null;

        if (couponCode) {
            const promotion = await Promotion.findOne({
                couponCode: couponCode.toUpperCase().trim(),
                isActive: true,
            });

            if (promotion && promotion.isValid) {
                // Check if user has already used this promotion
                const usedCoupon = await Coupon.findOne({
                    promotion: promotion._id,
                    user: user._id,
                    status: 'used'
                });

                if (usedCoupon) {
                    return res.status(400).json({ success: false, message: 'Bạn đã sử dụng mã ưu đãi này rồi' });
                }

                // Check min nights
                if (nights >= promotion.minNights) {
                    // Check applicable room types
                    const roomTypeOk = !promotion.applicableRoomTypes?.length ||
                        promotion.applicableRoomTypes.includes(room.roomType);

                    if (roomTypeOk) {
                        if (promotion.discountType === 'percent') {
                            discountAmount = Math.round(totalPrice * promotion.discountValue / 100);
                        } else {
                            discountAmount = Math.min(promotion.discountValue, totalPrice);
                        }
                        appliedPromotion = promotion;
                    }
                }
            }
        }

        const finalPrice = Math.max(0, totalPrice - discountAmount);

        const booking = await Booking.create({
            user: user._id,
            room: room._id,
            hotel: room.hotel,
            checkInDate,
            checkOutDate,
            guests: parsedGuests,
            totalPrice: finalPrice,
            originalPrice: totalPrice,
            discountAmount,
            couponCode: appliedPromotion ? appliedPromotion.couponCode : undefined,
            paymentMethod: finalPaymentMethod,
            // Lưu yêu cầu đặc biệt (trim + giới hạn 500 ký tự)
            specialRequests: typeof specialRequests === 'string'
                ? specialRequests.trim().slice(0, 500)
                : '',
        });

        // Cập nhật usage nếu có coupon
        if (appliedPromotion) {
            await Promotion.findByIdAndUpdate(
                appliedPromotion._id,
                { $inc: { usedCount: 1 } }
            );

            await Coupon.findOneAndUpdate(
                { promotion: appliedPromotion._id, user: user._id },
                {
                    $set: {
                        booking: booking._id,
                        discountAmount,
                        status: 'used',
                        usedAt: new Date(),
                    },
                },
                { upsert: true },
            );
        }

        const populatedBooking = await Booking.findById(booking._id)
            .populate('room')
            .populate('hotel');

        // Gửi email xác nhận booking
        await trySendEmail(bookingConfirmationEmail, populatedBooking, user, 'Booking confirmation');

        // Gửi notification real-time cho owner — CHỈ với payAtHotel
        // Booking Stripe: owner sẽ nhận notification khi thanh toán xong
        // (từ payment-service/verifyPayment hoặc webhook)
        const hotel = await Hotel.findById(room.hotel);
        if (hotel?.owner && finalPaymentMethod !== 'stripe') {
            emitNotification(hotel.owner, {
                type: 'new_booking',
                bookingId: booking._id,
                message: `Đặt phòng mới: ${room.roomType} (${nights} đêm)`,
                guestName: user.username || 'Khách hàng',
                totalPrice: finalPrice,
                createdAt: new Date().toISOString(),
            });
        }

        // Gửi notification real-time cho chính khách hàng
        emitNotification(user._id.toString(), {
            type: finalPaymentMethod === 'stripe' ? 'booking_awaiting_payment' : 'booking_pending',
            bookingId: booking._id,
            message: finalPaymentMethod === 'stripe'
                ? `Đặt phòng ${room.roomType}${hotel?.name ? ` tại ${hotel.name}` : ''} đã tạo. Vui lòng hoàn tất thanh toán.`
                : `Đặt phòng ${room.roomType}${hotel?.name ? ` tại ${hotel.name}` : ''} thành công! Đang chờ khách sạn xác nhận.`,
            createdAt: new Date().toISOString(),
        });

        // === Đồng bộ trạng thái phòng sau khi tạo booking ===
        const syncResult = await syncRoomAvailabilityStatus(room._id);
        if (syncResult.statusChanged && syncResult.newStatus === 'soldout') {
            const hotelName = hotel?.name || syncResult.room?.hotel?.name || '';
            // Thông báo cho owner biết phòng đã hết
            if (hotel?.owner) {
                emitNotification(hotel.owner.toString(), {
                    type: 'room_soldout',
                    message: `⚠️ Phòng ${room.roomType}${hotelName ? ` tại ${hotelName}` : ''} đã hết phòng trống. Trạng thái đã tự động chuyển sang "Hết phòng".`,
                    createdAt: new Date().toISOString(),
                });
            }
        }

        return res.status(201).json({
            success: true,
            data: populatedBooking || booking,
        })
    } catch (error) {
        console.error('Create booking error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
}

// ═══════════════════════════════════════════
// GET MY BOOKINGS
// ═══════════════════════════════════════════
export const getMyBookings = async (req, res) => {
    try {
        const user = req.user;

        const bookings = await Booking.find({ user: user._id })
            .sort({ createdAt: -1 })
            .populate('room')
            .populate('hotel')
            .lean();

        return res.json({ success: true, data: bookings });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Server error' });
    }
}

// ═══════════════════════════════════════════
// GET BOOKING BY ID
// ═══════════════════════════════════════════
export const getBookingById = async (req, res) => {
    try {
        const user = req.user;

        const { id } = req.params;

        const booking = await Booking.findById(id)
            .populate('room')
            .populate('hotel')
            .lean();

        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        // Check if user owns this booking or is the hotel owner (multi-hotel)
        if (booking.user.toString() !== user._id.toString()) {
            const ownerHotels = await Hotel.find({ owner: user._id }).select('_id').lean();
            const ownerHotelIds = ownerHotels.map(h => h._id.toString());
            if (!ownerHotelIds.includes(booking.hotel._id.toString())) {
                return res.status(403).json({ success: false, message: 'Not authorized to view this booking' });
            }
        }

        return res.json({ success: true, data: booking });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Server error' });
    }
}

// ═══════════════════════════════════════════
// CANCEL MY BOOKING (Guest tự hủy)
// ═══════════════════════════════════════════
export const cancelMyBooking = async (req, res) => {
    try {
        const user = req.user;

        const { id } = req.params;

        const booking = await Booking.findOne({ _id: id, user: user._id })
            .populate('room')
            .populate('hotel');

        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        if (['cancelled', 'completed', 'checked_in'].includes(booking.status)) {
            return res.status(400).json({
                success: false,
                message: booking.status === 'checked_in'
                    ? 'Không thể hủy booking đang trong phòng'
                    : `Booking đã ở trạng thái ${booking.status}`,
            });
        }

        // === AUTO REFUND theo chính sách OTA 3-tier khi guest hủy booking Stripe ===
        const isStripeRefundable = booking.isPaid && booking.paymentMethod === 'stripe' && !booking.isRefunded;
        let refundResult = null; // { success, amount, type, refundId } hoặc null

        if (isStripeRefundable) {
            // Tính số tiền hoàn theo chính sách OTA 3-tier (100/50/0)
            const msPerDay = 1000 * 60 * 60 * 24;
            const daysBefore = Math.ceil(
                (new Date(booking.checkInDate) - new Date()) / msPerDay
            );
            let refundPercent;
            if (daysBefore <= 0) refundPercent = 0;          // Đã qua ngày check-in
            else if (daysBefore > 7) refundPercent = 1.0;    // > 7 ngày: 100%
            else if (daysBefore >= 3) refundPercent = 0.5;   // 3-7 ngày: 50%
            else refundPercent = 0;                          // < 3 ngày: 0%
            const refundAmt = Math.round(booking.totalPrice * refundPercent);
            const refundType = refundPercent === 1.0 ? 'full' : refundPercent > 0 ? 'partial' : 'none';

            // Giải quyết stripePaymentIntentId nếu thiếu
            let resolvedIntentId = booking.stripePaymentIntentId;
            if (!resolvedIntentId && booking.stripeSessionId) {
                try {
                    const session = await stripe.checkout.sessions.retrieve(booking.stripeSessionId);
                    resolvedIntentId = session.payment_intent;
                    if (resolvedIntentId) {
                        booking.stripePaymentIntentId = resolvedIntentId;
                    }
                } catch (stripeErr) {
                    console.error('Cannot retrieve Stripe session for auto refund:', stripeErr.message);
                }
            }

            if (resolvedIntentId && refundAmt > 0) {
                // Đánh dấu đang xử lý (guard race condition)
                booking.refundStatus = 'processing';
                await booking.save();

                try {
                    const refund = await stripe.refunds.create({
                        payment_intent: resolvedIntentId,
                        amount: refundAmt,
                        reason: 'requested_by_customer',
                        metadata: {
                            bookingId: booking._id.toString(),
                            autoRefund: 'true',
                            policy: `${Math.round(refundPercent * 100)}%`,
                            daysBefore: String(daysBefore),
                        },
                    });

                    // Cập nhật booking — hoàn tiền thành công
                    booking.isRefunded = true;
                    booking.refundedAt = new Date();
                    booking.refundAmount = refundAmt;
                    booking.refundReason = `Tự động hoàn ${Math.round(refundPercent * 100)}% — hủy trước ${daysBefore} ngày`;
                    booking.stripeRefundId = refund.id;
                    booking.refundStatus = 'completed';
                    booking.refundType = refundType;

                    // Audit trail: lưu refundRequest với status approved bởi hệ thống
                    booking.refundRequest = {
                        requestedAt: new Date(),
                        requestedBy: user._id.toString(),
                        reason: 'Khách hàng hủy — tự động hoàn tiền theo chính sách',
                        status: 'approved',
                        approvedBy: 'system',
                        approvedAt: new Date(),
                    };

                    refundResult = {
                        success: true,
                        amount: refundAmt,
                        type: refundType,
                        percent: Math.round(refundPercent * 100),
                        refundId: refund.id,
                        daysBefore,
                    };
                    console.log(`Auto refund ${refundType} (${Math.round(refundPercent * 100)}%) success for booking ${booking._id}: ${refundAmt}₫`);
                } catch (refundErr) {
                    // Stripe fail → lưu trạng thái failed, vẫn hủy booking
                    booking.refundStatus = 'failed';
                    booking.refundFailReason = refundErr.message;
                    booking.refundRequest = {
                        requestedAt: new Date(),
                        requestedBy: user._id.toString(),
                        reason: 'Khách hàng hủy — hoàn tiền tự động thất bại',
                        status: 'pending', // Để owner xử lý thủ công
                    };
                    refundResult = { success: false, error: refundErr.message };
                    console.error(`Auto refund failed for booking ${booking._id}:`, refundErr.message);
                }
            } else if (refundAmt === 0) {
                // Policy = 0% (< 3 ngày hoặc đã qua ngày check-in) → không hoàn tiền
                booking.refundStatus = 'rejected';
                booking.refundReason = `Không hoàn tiền theo chính sách — hủy trước ${daysBefore} ngày`;
                booking.refundRequest = {
                    requestedAt: new Date(),
                    requestedBy: user._id.toString(),
                    reason: 'Khách hàng hủy — không đủ điều kiện hoàn tiền theo chính sách',
                    status: 'rejected',
                    approvedBy: 'system',
                    approvedAt: new Date(),
                    rejectedReason: `Hủy trong vòng 3 ngày trước check-in (${daysBefore} ngày)`,
                };
                refundResult = {
                    success: true,
                    amount: 0,
                    type: 'none',
                    percent: 0,
                    daysBefore,
                };
                console.log(`No refund for booking ${booking._id}: policy 0% (${daysBefore} days before check-in)`);
            } else {
                console.warn(`Cannot auto refund booking ${booking._id}: no stripePaymentIntentId`);
                // Không có paymentIntentId → tạo request pending để owner xử lý
                booking.refundRequest = {
                    requestedAt: new Date(),
                    requestedBy: user._id.toString(),
                    reason: 'Khách hàng hủy — không tìm thấy payment intent',
                    status: 'pending',
                };
                booking.refundStatus = 'pending';
                refundResult = { success: false, error: 'Missing payment intent' };
            }
        }

        booking.status = 'cancelled';
        await booking.save();

        // === Đồng bộ trạng thái phòng — khôi phục nếu có slot trống ===
        if (booking.room?._id) {
            const syncResult = await syncRoomAvailabilityStatus(
                booking.room._id,
                { excludeBookingId: booking._id, checkAllDates: true }
            );
            if (syncResult.statusChanged && syncResult.newStatus === 'open') {
                console.info(`[Cancel] Room ${booking.room.roomType} restored to OPEN after booking ${booking._id} cancelled`);
            }
        }

        const roomType = booking.room?.roomType || 'Phòng';
        const hotelName = booking.hotel?.name || '';
        const guestName = user.username || user.email || 'Khách hàng';

        // ── Gửi email ──
        if (refundResult?.success) {
            // Hoàn tiền thành công → gửi email refund approved
            await trySendEmail(refundApprovedEmail, booking, user, 'Auto refund on cancellation');
        } else {
            // Không refund hoặc refund fail → gửi email hủy thường
            await trySendEmail(bookingCancelledEmail, booking, user, 'Booking cancellation');
        }

        // ── Thông báo cho GUEST ──
        let guestMessage;
        if (refundResult?.success) {
            guestMessage = `Đặt phòng ${roomType}${hotelName ? ` tại ${hotelName}` : ''} đã được hủy. Hoàn tiền ${refundResult.amount.toLocaleString('vi-VN')}₫ (${refundResult.percent}%) đang được xử lý.`;
        } else if (refundResult && !refundResult.success) {
            guestMessage = `Đặt phòng ${roomType}${hotelName ? ` tại ${hotelName}` : ''} đã được hủy. Hoàn tiền tự động thất bại — khách sạn sẽ xử lý sớm.`;
        } else {
            guestMessage = `Đặt phòng ${roomType}${hotelName ? ` tại ${hotelName}` : ''} đã được hủy thành công.`;
        }

        emitNotification(user._id.toString(), {
            type: refundResult?.success ? 'booking_refunded' : 'booking_cancelled',
            bookingId: booking._id,
            message: guestMessage,
            ...(refundResult?.success && {
                refundAmount: refundResult.amount,
                refundType: refundResult.type,
            }),
            createdAt: new Date().toISOString(),
        });

        // ── Thông báo cho OWNER ──
        if (booking.hotel?.owner) {
            const ownerId = booking.hotel.owner.toString();

            if (refundResult?.success) {
                // Hoàn tiền tự động thành công → thông báo để owner biết
                emitNotification(ownerId, {
                    type: 'booking_auto_refunded',
                    bookingId: booking._id,
                    message: `${guestName} đã hủy đặt phòng ${roomType}${hotelName ? ` tại ${hotelName}` : ''}. Tự động hoàn ${refundResult.amount.toLocaleString('vi-VN')}₫ (${refundResult.percent}%).`,
                    guestName,
                    refundAmount: refundResult.amount,
                    refundType: refundResult.type,
                    createdAt: new Date().toISOString(),
                });
            } else if (refundResult && !refundResult.success) {
                // Hoàn tiền thất bại → owner cần xử lý thủ công
                emitNotification(ownerId, {
                    type: 'booking_refund_requested',
                    bookingId: booking._id,
                    message: `⚠️ ${guestName} đã hủy đặt phòng ${roomType}${hotelName ? ` tại ${hotelName}` : ''}. Hoàn tiền tự động thất bại — cần xử lý thủ công.`,
                    guestName,
                    totalPrice: booking.totalPrice,
                    createdAt: new Date().toISOString(),
                });
            } else {
                // Booking chưa trả tiền hoặc payAtHotel → chỉ thông báo hủy
                emitNotification(ownerId, {
                    type: 'booking_cancelled',
                    bookingId: booking._id,
                    message: `${guestName} đã hủy đặt phòng ${roomType}${hotelName ? ` tại ${hotelName}` : ''}.`,
                    guestName,
                    createdAt: new Date().toISOString(),
                });
            }
        }

        return res.json({
            success: true,
            data: booking,
            refund: refundResult,
        });
    } catch (error) {
        console.error('Cancel booking error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
}
