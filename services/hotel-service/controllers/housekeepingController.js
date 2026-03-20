import Room from '../models/Room.js';
import Hotel from '../models/Hotel.js';
import Booking from '../models/Booking.js';

/**
 * GET /api/housekeeping/owner/board
 * Lấy bảng housekeeping: tất cả phòng + trạng thái vệ sinh + occupancy.
 */
export const getHousekeepingBoard = async (req, res) => {
    try {
        const user = req.user;

        // Lấy tất cả hotel của owner
        const ownerHotels = await Hotel.find({ owner: user._id })
            .select('_id name')
            .lean();

        if (!ownerHotels.length) {
            return res.json({
                success: true,
                data: { rooms: [], summary: { clean: 0, dirty: 0, inspecting: 0, out_of_order: 0 } },
            });
        }

        const hotelIds = ownerHotels.map((h) => h._id);

        // Lấy tất cả rooms
        const rooms = await Room.find({ hotel: { $in: hotelIds } })
            .populate('hotel', 'name')
            .sort({ hotel: 1, roomType: 1 })
            .lean();

        // Lấy bookings đang active (checked_in) để xác định phòng nào đang OCC
        const now = new Date();
        const activeBookings = await Booking.find({
            hotel: { $in: hotelIds },
            status: 'checked_in',
        })
            .select('room')
            .lean();

        const occupiedRoomIds = new Set(
            activeBookings.map((b) => b.room.toString()),
        );

        // Map rooms + occupancy
        const enrichedRooms = rooms.map((room) => ({
            ...room,
            isOccupied: occupiedRoomIds.has(room._id.toString()),
        }));

        // Summary counts
        const summary = { clean: 0, dirty: 0, inspecting: 0, out_of_order: 0 };
        for (const room of enrichedRooms) {
            const key = room.housekeepingStatus || 'clean';
            if (summary[key] !== undefined) {
                summary[key] += 1;
            }
        }

        return res.json({
            success: true,
            data: { rooms: enrichedRooms, summary },
        });
    } catch (error) {
        console.error('getHousekeepingBoard error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * PATCH /api/housekeeping/owner/:roomId
 * Cập nhật trạng thái housekeeping cho 1 phòng.
 */
export const updateHousekeepingStatus = async (req, res) => {
    try {
        const user = req.user;
        const { roomId } = req.params;
        const { housekeepingStatus, housekeepingNote } = req.body;

        // Validate enum
        const allowedStatuses = new Set([
            'clean',
            'dirty',
            'inspecting',
            'out_of_order',
        ]);
        if (!housekeepingStatus || !allowedStatuses.has(housekeepingStatus)) {
            return res.status(400).json({
                success: false,
                message:
                    'housekeepingStatus phải là: clean, dirty, inspecting, out_of_order',
            });
        }

        // Verify ownership: room thuộc hotel của owner
        const ownerHotels = await Hotel.find({ owner: user._id })
            .select('_id')
            .lean();
        const hotelIds = ownerHotels.map((h) => h._id);

        const room = await Room.findOne({
            _id: roomId,
            hotel: { $in: hotelIds },
        });

        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Room not found',
            });
        }

        // Update
        room.housekeepingStatus = housekeepingStatus;
        if (typeof housekeepingNote === 'string') {
            room.housekeepingNote = housekeepingNote.trim().slice(0, 500);
        }

        await room.save();

        return res.json({
            success: true,
            data: room,
        });
    } catch (error) {
        console.error('updateHousekeepingStatus error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * PATCH /api/housekeeping/owner/batch
 * Cập nhật trạng thái housekeeping cho nhiều phòng cùng lúc.
 * Body: { roomIds: [id1, id2, ...], housekeepingStatus: 'clean' }
 */
export const batchUpdateHousekeepingStatus = async (req, res) => {
    try {
        const user = req.user;
        const { roomIds, housekeepingStatus } = req.body;

        // Validate
        if (!Array.isArray(roomIds) || roomIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'roomIds phải là mảng không rỗng',
            });
        }

        const allowedStatuses = new Set([
            'clean',
            'dirty',
            'inspecting',
            'out_of_order',
        ]);
        if (!housekeepingStatus || !allowedStatuses.has(housekeepingStatus)) {
            return res.status(400).json({
                success: false,
                message:
                    'housekeepingStatus phải là: clean, dirty, inspecting, out_of_order',
            });
        }

        // Verify ownership
        const ownerHotels = await Hotel.find({ owner: user._id })
            .select('_id')
            .lean();
        const hotelIds = ownerHotels.map((h) => h._id);

        const result = await Room.updateMany(
            { _id: { $in: roomIds }, hotel: { $in: hotelIds } },
            { $set: { housekeepingStatus } },
        );

        return res.json({
            success: true,
            data: { modifiedCount: result.modifiedCount },
        });
    } catch (error) {
        console.error('batchUpdateHousekeepingStatus error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};
