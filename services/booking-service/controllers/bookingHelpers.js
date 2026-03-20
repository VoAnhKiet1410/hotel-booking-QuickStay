/**
 * Booking Helpers — các hàm tiện ích dùng chung
 * giữa các controller booking.
 *
 * - getAvailableRoomsCount: đếm phòng trống theo date range
 * - syncRoomAvailabilityStatus: đồng bộ status phòng (open/soldout)
 */
import Booking from '../models/Booking.js';
import Room from '../models/Room.js';
import Hotel from '../models/Hotel.js';

/**
 * Lấy danh sách hotel IDs của owner.
 * Pattern DRY — thay vì copy-paste Hotel.find({ owner })
 * ở mỗi controller function.
 *
 * @param {string} userId - Owner user ID
 * @returns {Promise<string[]>} Mảng hotel IDs
 */
export const getOwnerHotelIds = async (userId) => {
    const hotels = await Hotel.find({ owner: userId }).select('_id').lean();
    return hotels.map(h => h._id);
};

/**
 * Đếm số phòng còn trống cho 1 room type trong khoảng ngày.
 * Chỉ đếm booking có status active (không cancelled/completed).
 *
 * @param {string} roomId - ID của room
 * @param {string|Date} checkInDate
 * @param {string|Date} checkOutDate
 * @returns {Promise<number>} Số phòng còn trống
 */
export const getAvailableRoomsCount = async (roomId, checkInDate, checkOutDate) => {
    const start = new Date(checkInDate);
    const end = new Date(checkOutDate);

    const room = await Room.findById(roomId);
    if (!room) return 0;

    const bookedCount = await Booking.countDocuments({
        room: roomId,
        status: { $nin: ['cancelled', 'completed'] },
        checkInDate: { $lt: end },
        checkOutDate: { $gt: start },
    });

    return room.totalRooms - bookedCount;
};

/**
 * Đồng bộ trạng thái phòng dựa trên bookings thực tế.
 * - Nếu tất cả phòng đã được đặt (confirmed/pending/checked_in) → chuyển status thành 'soldout'
 * - Nếu có phòng trống trở lại (do hủy booking) → khôi phục status thành 'open'
 *
 * @param {string} roomId - ID phòng cần kiểm tra
 * @param {object} [options] - Tùy chọn
 * @param {string} [options.excludeBookingId] - Booking ID bỏ qua khi đếm (dùng khi hủy)
 * @returns {Promise<{statusChanged: boolean, newStatus: string}>}
 */
export const syncRoomAvailabilityStatus = async (roomId, options = {}) => {
    try {
        const room = await Room.findById(roomId).populate('hotel');
        if (!room) return { statusChanged: false, newStatus: null };

        // Nếu owner đã tạm dừng phòng (paused), không tự động thay đổi
        if (room.status === 'paused') {
            return { statusChanged: false, newStatus: 'paused' };
        }

        // Đếm số booking đang active
        // checkAllDates=true: đếm TẤT CẢ booking active (dùng khi checkout/cancel)
        // checkAllDates=false: chỉ đếm booking overlap ngày cụ thể (dùng khi createBooking)
        let query;

        if (options.checkAllDates) {
            // Đếm tất cả booking active (chưa hủy, chưa hoàn tất)
            query = {
                room: roomId,
                status: { $nin: ['cancelled', 'completed'] },
            };
        } else {
            // Đếm booking overlap với ngày tham chiếu
            const refDate = options.forDate ? new Date(options.forDate) : new Date();
            refDate.setHours(0, 0, 0, 0);
            const refDateEnd = new Date(refDate);
            refDateEnd.setDate(refDateEnd.getDate() + 1);

            query = {
                room: roomId,
                status: { $nin: ['cancelled', 'completed'] },
                checkInDate: { $lt: refDateEnd },
                checkOutDate: { $gt: refDate },
            };
        }

        // Loại trừ booking vừa hủy (dùng trong cancelMyBooking)
        if (options.excludeBookingId) {
            query._id = { $ne: options.excludeBookingId };
        }

        const activeBookingsCount = await Booking.countDocuments(query);

        const previousStatus = room.status;
        let newStatus = previousStatus;

        if (activeBookingsCount >= room.totalRooms && previousStatus === 'open') {
            // Phòng đã hết → chuyển sang soldout
            newStatus = 'soldout';
            room.status = 'soldout';
            await room.save();

            console.info(`[Room Sync] Room ${roomId} (${room.roomType}) → SOLDOUT (${activeBookingsCount}/${room.totalRooms} booked)`);

            return { statusChanged: true, newStatus: 'soldout', room };
        }

        if (activeBookingsCount < room.totalRooms && previousStatus === 'soldout') {
            // Có phòng trống trở lại → khôi phục open
            newStatus = 'open';
            room.status = 'open';
            await room.save();

            console.info(`[Room Sync] Room ${roomId} (${room.roomType}) → OPEN (${activeBookingsCount}/${room.totalRooms} booked)`);

            return { statusChanged: true, newStatus: 'open', room };
        }

        return { statusChanged: false, newStatus: previousStatus };
    } catch (err) {
        console.error('[Room Sync] Error:', err.message);
        return { statusChanged: false, newStatus: null };
    }
};

/**
 * Booking Lifecycle Transition Map (OTA Standard)
 *
 * Quy định chuyển status hợp lệ:
 * - pending    → confirmed, cancelled
 * - confirmed  → checked_in, cancelled
 * - checked_in → completed
 * - completed  → (terminal)
 * - cancelled  → (terminal)
 */
export const ALLOWED_TRANSITIONS = {
    pending:    ['confirmed', 'cancelled'],
    confirmed:  ['checked_in', 'cancelled'],
    checked_in: ['completed'],
    completed:  [],
    cancelled:  [],
};

/**
 * Validate xem có thể chuyển từ status hiện tại sang status mới không.
 *
 * @param {string} currentStatus - Trạng thái hiện tại
 * @param {string} newStatus - Trạng thái muốn chuyển sang
 * @returns {{ valid: boolean, message?: string }}
 */
export const validateTransition = (currentStatus, newStatus) => {
    const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];
    if (!allowed.includes(newStatus)) {
        return {
            valid: false,
            message: `Không thể chuyển từ "${currentStatus}" sang "${newStatus}"`,
        };
    }
    return { valid: true };
};
