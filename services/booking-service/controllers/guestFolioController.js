import Booking from '../models/Booking.js';
import Hotel from '../models/Hotel.js';

/**
 * GET /api/bookings/:id/folio
 * Trả về structured folio (invoice) data cho một booking.
 *
 * Quyền truy cập:
 * - Guest: chỉ xem folio booking của mình
 * - Owner: xem folio booking thuộc khách sạn mình
 *
 * Chỉ trả folio cho booking đã checked_in hoặc completed.
 */
export const getGuestFolio = async (req, res) => {
    try {
        const user = req.user;
        const { id } = req.params;

        // Lấy booking với đầy đủ populated data
        const booking = await Booking.findById(id)
            .populate('room', 'roomType pricePerNight bed area')
            .populate('hotel', 'name address city contact checkInTime checkOutTime')
            .populate('user', 'username email phone');

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Đặt phòng không tồn tại',
            });
        }

        // Kiểm tra quyền: guest xem booking mình, owner xem booking hotel mình
        const isGuest = booking.user?._id?.toString() === user._id.toString();
        let isOwner = false;

        if (!isGuest) {
            // Kiểm tra xem user có phải owner của hotel này không
            const hotel = await Hotel.findOne({
                _id: booking.hotel._id,
                owner: user._id,
            }).lean();

            isOwner = !!hotel;
        }

        if (!isGuest && !isOwner) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền xem folio này',
            });
        }

        // Chỉ trả folio cho trạng thái hợp lệ
        const allowedStatuses = ['checked_in', 'completed'];
        if (!allowedStatuses.includes(booking.status)) {
            return res.status(400).json({
                success: false,
                message: `Folio chỉ khả dụng cho booking đã check-in hoặc hoàn tất. Trạng thái hiện tại: "${booking.status}"`,
            });
        }

        // Tính số đêm
        const checkIn = new Date(booking.checkInDate);
        const checkOut = new Date(booking.checkOutDate);
        const nights = Math.max(
            1,
            Math.round((checkOut - checkIn) / (1000 * 60 * 60 * 24))
        );

        // Tạo folio number: F-{hotelId 4 ký tự cuối}-{bookingId 6 ký tự cuối}
        const hotelIdShort = booking.hotel._id
            .toString()
            .slice(-4)
            .toUpperCase();
        const bookingIdShort = booking._id
            .toString()
            .slice(-6)
            .toUpperCase();
        const folioNumber = `F-${hotelIdShort}-${bookingIdShort}`;

        // Structured folio data
        const folio = {
            folioNumber,
            issuedAt: new Date().toISOString(),

            // Hotel info
            hotel: {
                name: booking.hotel?.name || '',
                address: booking.hotel?.address || '',
                city: booking.hotel?.city || '',
                contact: booking.hotel?.contact || '',
                checkInTime: booking.hotel?.checkInTime || '14:00',
                checkOutTime: booking.hotel?.checkOutTime || '12:00',
            },

            // Guest info
            guest: {
                name: booking.user?.username || 'Khách',
                email: booking.user?.email || '',
                phone: booking.user?.phone || '',
            },

            // Stay details
            stay: {
                checkInDate: booking.checkInDate,
                checkOutDate: booking.checkOutDate,
                checkedInAt: booking.checkedInAt || null,
                checkedOutAt: booking.checkedOutAt || null,
                nights,
                guests: booking.guests,
            },

            // Room details
            room: {
                type: booking.room?.roomType || '',
                pricePerNight: booking.room?.pricePerNight || 0,
                bed: booking.room?.bed || '',
                area: booking.room?.area || '',
            },

            // Charges breakdown
            charges: {
                roomCharge: booking.room?.pricePerNight
                    ? booking.room.pricePerNight * nights
                    : booking.originalPrice || booking.totalPrice,
                originalPrice: booking.originalPrice || booking.totalPrice,
                discountAmount: booking.discountAmount || 0,
                couponCode: booking.couponCode || null,
                totalPrice: booking.totalPrice,
            },

            // Payment info
            payment: {
                method: booking.paymentMethod,
                isPaid: booking.isPaid,
                paidAt: booking.paidAt || null,
            },

            // Refund info (nếu có)
            refund: booking.isRefunded
                ? {
                      isRefunded: true,
                      amount: booking.refundAmount || 0,
                      reason: booking.refundReason || '',
                      status: booking.refundStatus || 'not_requested',
                      type: booking.refundType || null,
                      refundedAt: booking.refundedAt || null,
                  }
                : null,

            // Extras
            specialRequests: booking.specialRequests || '',
            bookingStatus: booking.status,
            bookingId: booking._id,
            createdAt: booking.createdAt,
        };

        return res.json({
            success: true,
            data: folio,
        });
    } catch (error) {
        console.error('getGuestFolio error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};
