/**
 * Refund Controller
 *
 * Xử lý các thao tác hoàn tiền phía owner:
 * - getRefundRequests: danh sách yêu cầu hoàn tiền pending
 * - processRefundRequest: duyệt / từ chối yêu cầu hoàn tiền
 */
import Booking from '../models/Booking.js';
import Hotel from '../models/Hotel.js';
import User from '../models/User.js';
import stripe from '../configs/stripe.js';
import { refundApprovedEmail } from '../utils/emailTemplates.js';
import { trySendEmail } from '../utils/emailHelper.js';
import { emitNotification } from '../utils/emitNotification.js';
import { getOwnerHotelIds } from './bookingHelpers.js';

// ═══════════════════════════════════════════
// GET REFUND REQUESTS (Owner Dashboard)
// ═══════════════════════════════════════════
/**
 * GET /api/bookings/owner/refund-requests
 * Lấy danh sách booking có yêu cầu hoàn tiền đang chờ xử lý
 */
export const getRefundRequests = async (req, res) => {
    try {
        const user = req.user;

        const hotelIds = await getOwnerHotelIds(user._id);
        if (hotelIds.length === 0) {
            return res.json({ success: true, data: [] });
        }

        // Lấy tất cả booking có refundRequest đang pending
        const bookings = await Booking.find({
            hotel: { $in: hotelIds },
            'refundRequest.status': 'pending',
        })
            .sort({ 'refundRequest.requestedAt': -1 })
            .populate('room', 'roomType images')
            .populate('hotel', 'name')
            .populate('user', 'username email')
            .lean();

        return res.json({ success: true, data: bookings });
    } catch (error) {
        console.error('getRefundRequests error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ═══════════════════════════════════════════
// PROCESS REFUND REQUEST (Approve / Reject)
// ═══════════════════════════════════════════
/**
 * PATCH /api/bookings/owner/:id/refund-request
 * Owner duyệt hoặc từ chối yêu cầu hoàn tiền của guest
 * Body: { action: 'approve' | 'reject', rejectedReason?: string, refundAmount?: number }
 */
export const processRefundRequest = async (req, res) => {
    try {
        const user = req.user;
        const { id } = req.params;
        const { action, rejectedReason, refundAmount: overrideAmount } = req.body;

        if (!['approve', 'reject'].includes(action)) {
            return res.status(400).json({
                success: false,
                message: 'action phải là "approve" hoặc "reject"',
            });
        }

        // Xác minh booking thuộc về khách sạn của owner
        const ownerHotelIds = await getOwnerHotelIds(user._id);

        const booking = await Booking.findOne({ _id: id, hotel: { $in: ownerHotelIds } })
            .populate('room')
            .populate('hotel')
            .populate('user');

        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        if (!booking.refundRequest || booking.refundRequest.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Yêu cầu hoàn tiền không tồn tại hoặc đã được xử lý',
            });
        }

        // ── TỪ CHỐI ──
        if (action === 'reject') {
            booking.refundRequest.status = 'rejected';
            booking.refundRequest.approvedBy = user._id.toString();
            booking.refundRequest.approvedAt = new Date();
            booking.refundRequest.rejectedReason = rejectedReason || 'Yêu cầu không đủ điều kiện';
            booking.refundStatus = 'rejected';
            await booking.save();

            const guestId =
                typeof booking.user === 'object'
                    ? booking.user._id.toString()
                    : booking.user.toString();

            emitNotification(guestId, {
                type: 'booking_refund_rejected',
                bookingId: booking._id,
                message: `Yêu cầu hoàn tiền đã bị từ chối: ${rejectedReason || 'Yêu cầu không đủ điều kiện'}.`,
                createdAt: new Date().toISOString(),
            });

            return res.json({
                success: true,
                message: 'Đã từ chối yêu cầu hoàn tiền',
                data: booking,
            });
        }

        // ── DUYỆT → Thực hiện Stripe Refund ──
        if (!booking.isPaid || booking.paymentMethod !== 'stripe') {
            return res.status(400).json({
                success: false,
                message: 'Booking chưa thanh toán qua Stripe, không thể hoàn tiền online',
            });
        }

        // Guard chống race condition
        if (booking.refundStatus === 'processing') {
            return res.status(409).json({
                success: false,
                message: 'Hoàn tiền đang được xử lý, vui lòng chờ vài giây rồi thử lại',
            });
        }

        if (booking.isRefunded) {
            return res.status(400).json({ success: false, message: 'Booking đã được hoàn tiền' });
        }

        // Giải quyết stripePaymentIntentId nếu thiếu
        if (booking.stripePaymentIntentId === undefined && booking.stripeSessionId) {
            try {
                const session = await stripe.checkout.sessions.retrieve(booking.stripeSessionId);
                if (session.payment_intent) {
                    booking.stripePaymentIntentId = session.payment_intent;
                }
            } catch (err) {
                return res.status(400).json({
                    success: false,
                    message: 'Không thể lấy thông tin thanh toán từ Stripe',
                });
            }
        }

        if (!booking.stripePaymentIntentId) {
            return res.status(400).json({
                success: false,
                message: 'Không tìm thấy payment intent cho booking này',
            });
        }

        // Tính số tiền hoàn
        let refundAmt;
        let refundType;

        if (overrideAmount && overrideAmount > 0) {
            // Owner override số tiền cụ thể
            refundAmt = Math.min(overrideAmount, booking.totalPrice);
            refundType = refundAmt >= booking.totalPrice ? 'full' : 'partial';
        } else {
            // Áp dụng policy — khi owner đã duyệt thì ưu tiên khách hàng
            const msPerDay = 1000 * 60 * 60 * 24;
            const daysBefore = Math.ceil((new Date(booking.checkInDate) - new Date()) / msPerDay);

            if (daysBefore >= 3) {
                refundAmt = booking.totalPrice; // > 3 ngày: hoàn 100%
                refundType = 'full';
            } else {
                refundAmt = Math.round(booking.totalPrice * 0.5); // < 3 ngày: owner override → 50%
                refundType = 'partial';
            }
        }

        // Đánh dấu đang xử lý
        booking.refundStatus = 'processing';
        await booking.save();

        // Gọi Stripe
        let refund;
        try {
            refund = await stripe.refunds.create({
                payment_intent: booking.stripePaymentIntentId,
                amount: Math.round(refundAmt),
                reason: 'requested_by_customer',
                metadata: {
                    bookingId: booking._id.toString(),
                    approvedByOwner: user._id.toString(),
                },
            });
        } catch (stripeErr) {
            booking.refundStatus = 'failed';
            booking.refundFailReason = stripeErr.message;
            await booking.save();
            return res.status(502).json({
                success: false,
                message: `Stripe refund thất bại: ${stripeErr.message}`,
                data: { refundStatus: 'failed' },
            });
        }

        // Cập nhật booking
        booking.isRefunded = true;
        booking.refundedAt = new Date();
        booking.refundAmount = refundAmt;
        booking.refundReason = 'Owner approved refund request';
        booking.stripeRefundId = refund.id;
        booking.refundStatus = 'completed';
        booking.refundType = refundType;
        booking.status = 'cancelled';
        booking.refundRequest.status = 'approved';
        booking.refundRequest.approvedBy = user._id.toString();
        booking.refundRequest.approvedAt = new Date();
        await booking.save();

        // Thông báo guest
        const guestId =
            typeof booking.user === 'object'
                ? booking.user._id.toString()
                : booking.user.toString();

        emitNotification(guestId, {
            type: 'booking_refunded',
            bookingId: booking._id,
            message: `Yêu cầu hoàn tiền đã được duyệt! ${refundAmt.toLocaleString('vi-VN')}₫ (${refundType === 'full' ? 'toàn bộ' : 'một phần'}) đang được xử lý.`,
            refundAmount: refundAmt,
            refundType,
            createdAt: new Date().toISOString(),
        });

        // Email thông báo
        const guestUser =
            typeof booking.user === 'object' ? booking.user : await User.findById(booking.user);
        await trySendEmail(refundApprovedEmail, booking, guestUser, 'Refund approved by owner');

        return res.json({
            success: true,
            message: `Hoàn tiền ${refundAmt.toLocaleString('vi-VN')}₫ thành công`,
            data: {
                booking,
                refund: { id: refund.id, amount: refund.amount, status: refund.status },
                refundType,
            },
        });
    } catch (error) {
        console.error('processRefundRequest error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};
