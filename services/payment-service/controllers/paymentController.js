import stripe from '../configs/stripe.js'
import Booking from '../models/Booking.js'
import Room from '../models/Room.js'
import User from '../models/User.js'
import Hotel from '../models/Hotel.js'
import { paymentSuccessEmail, bookingCancelledEmail } from '../utils/emailTemplates.js'
import { calculateNights } from '../utils/dateUtils.js'
import { trySendEmail } from '../utils/emailHelper.js'
import { emitNotification } from '../utils/emitNotification.js'

/**
 * Đồng bộ trạng thái phòng sau khi thanh toán thành công.
 * Nếu phòng đã hết slot → chuyển soldout + thông báo owner.
 *
 * @param {object} booking - Booking document (đã populate room, hotel)
 */
const syncRoomAfterPayment = async (booking) => {
    try {
        if (!booking?.room) return;

        const roomId = typeof booking.room === 'object' ? booking.room._id : booking.room;
        const room = await Room.findById(roomId).populate('hotel');
        if (!room || room.status !== 'open') return;

        const now = new Date();
        now.setHours(0, 0, 0, 0);

        const activeBookingsCount = await Booking.countDocuments({
            room: roomId,
            status: { $nin: ['cancelled', 'completed'] },
            checkOutDate: { $gt: now },
        });

        if (activeBookingsCount >= room.totalRooms) {
            room.status = 'soldout';
            await room.save();

            console.info(`[Payment Sync] Room ${roomId} (${room.roomType}) → SOLDOUT after payment`);

            // Thông báo owner
            const hotelDoc = room.hotel || await Hotel.findById(room.hotel);
            if (hotelDoc?.owner) {
                emitNotification(hotelDoc.owner.toString(), {
                    type: 'room_soldout',
                    message: `⚠️ Phòng ${room.roomType}${hotelDoc.name ? ` tại ${hotelDoc.name}` : ''} đã hết phòng sau khi khách thanh toán. Trạng thái đã tự động chuyển sang "Hết phòng".`,
                    createdAt: new Date().toISOString(),
                });
            }
        }
    } catch (err) {
        console.error('[Payment Sync] Error:', err.message);
    }
};

// Create Stripe Checkout Session
export const createCheckoutSession = async (req, res) => {
    try {
        const user = req.user

        const { bookingId } = req.body

        if (!bookingId) {
            return res.status(400).json({
                success: false,
                message: 'Booking ID is required',
            })
        }

        // Find booking
        const booking = await Booking.findById(bookingId)
            .populate('room')
            .populate('hotel')

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found',
            })
        }

        // Check if user owns this booking
        if (booking.user.toString() !== user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to pay for this booking',
            })
        }

        // Check if already paid
        if (booking.isPaid) {
            return res.status(400).json({
                success: false,
                message: 'Booking is already paid',
            })
        }

        // Calculate nights
        const nights = calculateNights(booking.checkInDate, booking.checkOutDate) || 1

        // Stripe limits VND checkout sessions to ₫99,999,999
        const STRIPE_VND_MAX = 99_999_999
        if (Math.round(booking.totalPrice) > STRIPE_VND_MAX) {
            return res.status(400).json({
                success: false,
                message: `Số tiền thanh toán (${booking.totalPrice.toLocaleString('vi-VN')}₫) vượt giới hạn thanh toán trực tuyến (${STRIPE_VND_MAX.toLocaleString('vi-VN')}₫). Vui lòng chọn thanh toán tại khách sạn.`,
            })
        }

        // Create Stripe checkout session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            customer_email: user.email,
            client_reference_id: bookingId,
            line_items: [
                {
                    price_data: {
                        currency: 'vnd',
                        product_data: {
                            name: `${booking.hotel?.name || 'Hotel'} - ${booking.room?.roomType || 'Room'}`,
                            description: `${nights} đêm`,
                            images: booking.room?.images?.slice(0, 1) || [],
                        },
                        unit_amount: Math.round(booking.totalPrice), // Stripe expects amount in smallest currency unit
                    },
                    quantity: 1,
                },
            ],
            success_url: `${process.env.CLIENT_URL}/booking-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.CLIENT_URL}/booking/${bookingId}?payment=cancelled`,
            metadata: {
                bookingId: bookingId,
                userId: user._id.toString(),
            },
        })

        return res.json({
            success: true,
            data: {
                sessionId: session.id,
                url: session.url,
            },
        })
    } catch (error) {
        console.error('Create checkout session error:', error)
        return res.status(500).json({
            success: false,
            message: 'Failed to create checkout session',
        })
    }
}

// Verify payment after redirect from Stripe
export const verifyPayment = async (req, res) => {
    try {
        const { sessionId } = req.query

        if (!sessionId) {
            return res.status(400).json({
                success: false,
                message: 'Session ID is required',
            })
        }

        const session = await stripe.checkout.sessions.retrieve(sessionId)

        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'Session not found',
            })
        }

        const bookingId = session.metadata.bookingId

        if (session.payment_status === 'paid') {
            // === Atomic update — chống race condition với Stripe Webhook ===
            // Chỉ update nếu booking chưa được xử lý (isPaid: false)
            // Nếu trả về null → đã được xử lý bởi webhook → không gửi email lần 2
            const updatedBooking = await Booking.findOneAndUpdate(
                { _id: bookingId, isPaid: false },
                {
                    $set: {
                        isPaid: true,
                        paidAt: new Date(),
                        status: 'confirmed',
                        paymentMethod: 'stripe',
                        stripeSessionId: sessionId,
                        stripePaymentIntentId: session.payment_intent,
                    }
                },
                { new: true }
            ).populate(['room', 'hotel'])

            if (updatedBooking) {
                // Chỉ gửi email + notification khi thực sự là người đầu tiên xử lý
                const user = await User.findById(updatedBooking.user)
                await trySendEmail(paymentSuccessEmail, updatedBooking, user, 'Payment success')

                // Gửi notification cho owner (new_booking)
                const hotel = await Hotel.findById(updatedBooking.hotel)
                if (hotel?.owner) {
                    emitNotification(hotel.owner.toString(), {
                        type: 'new_booking',
                        bookingId: updatedBooking._id,
                        message: `Đặt phòng mới (Stripe): ${updatedBooking.room?.roomType || 'Phòng'} - ${updatedBooking.totalPrice?.toLocaleString('vi-VN')}₫`,
                        guestName: user?.username || 'Khách hàng',
                        totalPrice: updatedBooking.totalPrice,
                        createdAt: new Date().toISOString(),
                    });
                }

                // Gửi notification cho user (payment_success)
                emitNotification(updatedBooking.user.toString(), {
                    type: 'payment_success',
                    bookingId: updatedBooking._id,
                    message: `Thanh toán ${updatedBooking.totalPrice?.toLocaleString('vi-VN')}₫ thành công. Đặt phòng của bạn đã được xác nhận!`,
                    totalPrice: updatedBooking.totalPrice,
                    createdAt: new Date().toISOString(),
                });

                // === Đồng bộ trạng thái phòng sau khi thanh toán ===
                await syncRoomAfterPayment(updatedBooking);
            }

            // Lấy booking mới nhất để trả về (dù đã xử lý hay chưa)
            const finalBooking = updatedBooking || await Booking.findById(bookingId).populate(['room', 'hotel'])

            return res.json({
                success: true,
                data: finalBooking,
            })
        }

        return res.json({
            success: false,
            message: 'Payment not completed',
        })
    } catch (error) {
        console.error('Verify payment error:', error.message)
        return res.status(500).json({
            success: false,
            message: 'Failed to verify payment',
        })
    }
}

// Stripe Webhook Handler
export const handleStripeWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature']
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

    let event

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret)
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message)
        return res.status(400).send(`Webhook Error: ${err.message}`)
    }

    // Handle the event
    switch (event.type) {
        case 'checkout.session.completed': {
            const session = event.data.object
            const bookingId = session.metadata.bookingId

            try {
                // === Atomic update — chống race condition với verifyPayment ===
                // Chỉ update nếu booking chưa được xử lý (isPaid: false)
                // Nếu trả về null → đã được xử lý bởi verifyPayment → KHÔNG gửi lại
                const updatedBooking = await Booking.findOneAndUpdate(
                    { _id: bookingId, isPaid: false },
                    {
                        $set: {
                            isPaid: true,
                            paidAt: new Date(),
                            status: 'confirmed',
                            paymentMethod: 'stripe',
                            stripeSessionId: session.id,
                            stripePaymentIntentId: session.payment_intent,
                        }
                    },
                    { new: true }
                ).populate(['room', 'hotel'])

                if (updatedBooking) {
                    // Chỉ gửi email + notification khi thực sự là handler đầu tiên
                    const user = await User.findById(updatedBooking.user)
                    await trySendEmail(paymentSuccessEmail, updatedBooking, user, 'Payment success (webhook)')

                    // Gửi notification real-time cho owner (new_booking)
                    const hotel = await Hotel.findById(updatedBooking.hotel)
                    if (hotel?.owner) {
                        emitNotification(hotel.owner.toString(), {
                            type: 'new_booking',
                            bookingId: updatedBooking._id,
                            message: `Đặt phòng mới (Stripe): ${updatedBooking.room?.roomType || 'Phòng'} - ${updatedBooking.totalPrice?.toLocaleString('vi-VN')}₫`,
                            guestName: user?.username || 'Khách hàng',
                            totalPrice: updatedBooking.totalPrice,
                            createdAt: new Date().toISOString(),
                        });
                    }

                    // Gửi notification real-time cho khach hang
                    emitNotification(updatedBooking.user.toString(), {
                        type: 'payment_success',
                        bookingId: updatedBooking._id,
                        message: `Thanh toán ${updatedBooking.totalPrice?.toLocaleString('vi-VN')}₫ thành công. Đặt phòng đã được xác nhận!`,
                        totalPrice: updatedBooking.totalPrice,
                        createdAt: new Date().toISOString(),
                    });

                    // === Đồng bộ trạng thái phòng sau khi thanh toán (webhook) ===
                    await syncRoomAfterPayment(updatedBooking);
                } else {
                    console.log(`[Webhook] Booking ${bookingId} already processed by verifyPayment — skipped`)
                }
            } catch (error) {
                console.error('Webhook booking update error:', error.message)
            }
            break
        }

        case 'payment_intent.succeeded':
            break

        case 'payment_intent.payment_failed': {
            const paymentIntent = event.data.object
            console.error('PaymentIntent failed:', paymentIntent.id)
            break
        }

        default:
            console.log(`Unhandled event type: ${event.type}`)
    }

    res.json({ received: true })
}

// Get payment config (publishable key for frontend)
export const getPaymentConfig = async (req, res) => {
    try {
        return res.json({
            success: true,
            data: {
                publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
            },
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to get payment config',
        })
    }
}

/**
 * Tính số tiền hoàn trả theo chính sách hủy phòng chuẩn OTA
 * @param {Date} checkInDate - Ngày nhận phòng
 * @param {number} totalPrice - Tổng tiền đặt phòng
 * @returns {{ refundAmount: number, refundPercent: number, daysBeforeCheckIn: number, policyLabel: string }}
 */
const calculateRefundByPolicy = (checkInDate, totalPrice) => {
    const now = new Date();
    const checkIn = new Date(checkInDate);
    const msPerDay = 1000 * 60 * 60 * 24;
    const daysBeforeCheckIn = Math.ceil((checkIn - now) / msPerDay);

    let refundPercent = 0;
    let policyLabel = '';

    if (daysBeforeCheckIn <= 0) {
        // Ngày check-in đã qua → không hoàn tiền
        refundPercent = 0;
        policyLabel = 'Không hoàn tiền (đã qua ngày nhận phòng)';
    } else if (daysBeforeCheckIn > 7) {
        refundPercent = 100;
        policyLabel = 'Hoàn tiền 100% (hủy trước 7+ ngày)';
    } else if (daysBeforeCheckIn >= 3) {
        refundPercent = 50;
        policyLabel = 'Hoàn tiền 50% (hủy trước 3-7 ngày)';
    } else {
        refundPercent = 0;
        policyLabel = 'Không hoàn tiền (hủy trong vòng 3 ngày)';
    }

    const refundAmount = Math.round(totalPrice * refundPercent / 100);
    return { refundAmount, refundPercent, daysBeforeCheckIn, policyLabel };
};

// Refund payment
export const refundPayment = async (req, res) => {
    try {
        const user = req.user
        const { bookingId, reason, amount } = req.body

        if (!bookingId) {
            return res.status(400).json({
                success: false,
                message: 'Booking ID is required',
            })
        }

        // Find booking
        const booking = await Booking.findById(bookingId)
            .populate('room')
            .populate('hotel')

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found',
            })
        }

        // Check if user owns this booking or is admin
        if (booking.user.toString() !== user._id.toString() && user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to refund this booking',
            })
        }

        // Check if booking is paid
        if (!booking.isPaid) {
            return res.status(400).json({
                success: false,
                message: 'Booking is not paid yet',
            })
        }

        // === Kiểm tra trạng thái — không hoàn tiền sau check-in ===
        // Đã nhận phòng: dịch vụ đã bắt đầu → không hoàn qua flow tự động
        if (booking.status === 'checked_in') {
            return res.status(400).json({
                success: false,
                message: 'Không thể hoàn tiền tự động sau khi đã nhận phòng. Vui lòng liên hệ khách sạn để được hỗ trợ.',
            })
        }

        // Đã trả phòng: dịch vụ đã hoàn tất
        if (booking.status === 'completed') {
            return res.status(400).json({
                success: false,
                message: 'Không thể hoàn tiền cho đặt phòng đã hoàn tất. Dịch vụ đã được sử dụng đầy đủ.',
            })
        }

        // Check if already refunded
        if (booking.isRefunded) {
            return res.status(400).json({
                success: false,
                message: 'Booking is already refunded',
            })
        }

        // Check if has payment intent
        if (!booking.stripePaymentIntentId) {
            // Try to get payment intent from session
            if (booking.stripeSessionId) {
                try {
                    const session = await stripe.checkout.sessions.retrieve(booking.stripeSessionId)
                    if (session.payment_intent) {
                        booking.stripePaymentIntentId = session.payment_intent
                        await booking.save()
                    } else {
                        return res.status(400).json({
                            success: false,
                            message: 'No payment intent found for this booking',
                        })
                    }
                } catch (error) {
                    return res.status(400).json({
                        success: false,
                        message: 'Cannot retrieve payment information from Stripe',
                    })
                }
            } else {
                return res.status(400).json({
                    success: false,
                    message: 'This booking was not paid through Stripe and cannot be refunded online',
                })
            }
        }

        // === Tính hoàn tiền theo chính sách hủy phòng (OTA standard) ===
        let refundAmount;
        let policyInfo = null;

        if (amount) {
            // Admin/owner override: hoàn tiền theo số tiền cụ thể
            refundAmount = amount;
        } else {
            // User tự hủy: áp dụng policy theo số ngày trước check-in
            const policy = calculateRefundByPolicy(booking.checkInDate, booking.totalPrice);
            policyInfo = policy;
            refundAmount = policy.refundAmount;

            // Không hoàn tiền nếu policy = 0%
            if (refundAmount === 0) {
                return res.status(400).json({
                    success: false,
                    message: `Không thể hoàn tiền: ${policy.policyLabel}. Chính sách hủy phòng trong vòng 3 ngày trước check-in không áp dụng hoàn tiền.`,
                    data: { policy },
                })
            }
        }

        if (refundAmount > booking.totalPrice) {
            return res.status(400).json({
                success: false,
                message: 'Refund amount cannot exceed total price',
            })
        }

        // === Xác định loại hoàn tiền (full/partial) ===
        const resolvedRefundType = refundAmount >= booking.totalPrice ? 'full' : 'partial';
        const resolvedReason = reason || policyInfo?.policyLabel || 'Customer requested refund';

        // Đánh dấu đang xử lý trước khi gọi Stripe (để tránh duplicate call)
        booking.refundStatus = 'processing';
        await booking.save();

        // === Gọi Stripe Refund API ===
        let refund;
        try {
            refund = await stripe.refunds.create({
                payment_intent: booking.stripePaymentIntentId,
                amount: Math.round(refundAmount),
                reason: 'requested_by_customer',
                metadata: {
                    bookingId: bookingId,
                    userId: user._id.toString(),
                    customReason: resolvedReason,
                },
            });
        } catch (stripeError) {
            // Lưu trạng thái thất bại để owner/admin biết và xử lý thủ công
            booking.refundStatus = 'failed';
            booking.refundFailReason = stripeError.message;
            await booking.save();

            console.error('Stripe refund API error:', stripeError.message);
            return res.status(502).json({
                success: false,
                message: `Hoàn tiền qua Stripe thất bại: ${stripeError.message}. Vui lòng liên hệ khách sạn để được hỗ trợ.`,
                data: { refundStatus: 'failed' },
            });
        }

        // === Cập nhật booking sau khi Stripe thành công ===
        booking.isRefunded = true;
        booking.refundedAt = new Date();
        booking.refundAmount = refundAmount;
        booking.refundReason = resolvedReason;
        booking.stripeRefundId = refund.id;
        booking.refundStatus = 'completed';
        booking.refundType = resolvedRefundType;
        booking.status = 'cancelled';

        // Cập nhật trạng thái yêu cầu hoàn tiền nếu có
        if (booking.refundRequest?.status === 'pending') {
            booking.refundRequest.status = 'approved';
            booking.refundRequest.approvedBy = user._id.toString();
            booking.refundRequest.approvedAt = new Date();
        }

        await booking.save();

        // === Gửi thông báo cho user ===
        const refundUser = await User.findById(booking.user);
        await trySendEmail(bookingCancelledEmail, booking, refundUser, 'Refund notification');

        // Socket notification: hoàn tiền thành công
        emitNotification(booking.user.toString(), {
            type: 'booking_refunded',
            bookingId: booking._id,
            message: `Hoàn tiền ${refundAmount.toLocaleString('vi-VN')}₫ (${resolvedRefundType === 'full' ? 'toàn bộ' : 'một phần'}) đã được xử lý thành công qua Stripe.`,
            refundAmount,
            refundType: resolvedRefundType,
            createdAt: new Date().toISOString(),
        });

        return res.json({
            success: true,
            message: 'Refund processed successfully',
            data: {
                booking,
                refund: {
                    id: refund.id,
                    amount: refund.amount,
                    status: refund.status,
                },
                policy: policyInfo,
                refundType: resolvedRefundType,
            },
        })
    } catch (error) {
        console.error('Refund payment error:', error)
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to process refund',
        })
    }
}

// Get refund status
export const getRefundStatus = async (req, res) => {
    try {
        const user = req.user
        const { bookingId } = req.params

        const booking = await Booking.findById(bookingId)

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found',
            })
        }

        // Check if user owns this booking or is admin
        if (booking.user.toString() !== user._id.toString() && user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view this booking',
            })
        }

        if (!booking.isRefunded) {
            return res.json({
                success: true,
                data: {
                    isRefunded: false,
                    message: 'No refund found for this booking',
                },
            })
        }

        // Get refund details from Stripe
        let refundDetails = null
        if (booking.stripeRefundId) {
            try {
                refundDetails = await stripe.refunds.retrieve(booking.stripeRefundId)
            } catch (error) {
                console.error('Error retrieving refund:', error)
            }
        }

        return res.json({
            success: true,
            data: {
                isRefunded: booking.isRefunded,
                refundedAt: booking.refundedAt,
                refundAmount: booking.refundAmount,
                refundReason: booking.refundReason,
                stripeRefund: refundDetails,
            },
        })
    } catch (error) {
        console.error('Get refund status error:', error)
        return res.status(500).json({
            success: false,
            message: 'Failed to get refund status',
        })
    }
}
