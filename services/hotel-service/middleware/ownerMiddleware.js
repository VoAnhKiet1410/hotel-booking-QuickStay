import Hotel from '../models/Hotel.js';
import Room from '../models/Room.js';

/**
 * Middleware: Xác thực user là hotelOwner VÀ đã có ít nhất 1 hotel.
 * Multi-hotel: Nếu có hotelId trong params/query/body, set req.hotel = hotel đó.
 * Fallback: tìm hotel đầu tiên của owner (backward compatible).
 */
export const requireOwnerWithHotel = async (req, res, next) => {
    try {
        const user = req.user;

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized',
            });
        }

        if (user.role !== 'hotelOwner') {
            return res.status(403).json({
                success: false,
                message: 'Chỉ chủ khách sạn mới được phép truy cập',
            });
        }

        // Try to get specific hotelId from params, query, or body
        const hotelId =
            req.params?.hotelId || req.query?.hotelId || req.body?.hotelId;

        let hotel;
        if (hotelId) {
            hotel = await Hotel.findOne({ _id: hotelId, owner: user._id });
            if (!hotel) {
                return res.status(404).json({
                    success: false,
                    message:
                        'Khách sạn không tồn tại hoặc bạn không có quyền',
                });
            }
        } else if (req.params?.id) {
            // Route has :id param (room ID) — look up room to find correct hotel
            const room = await Room.findById(req.params.id)
                .select('hotel')
                .lean();
            if (room?.hotel) {
                hotel = await Hotel.findOne({
                    _id: room.hotel,
                    owner: user._id,
                });
            }
            if (!hotel) {
                hotel = await Hotel.findOne({ owner: user._id });
            }
        } else {
            hotel = await Hotel.findOne({ owner: user._id });
        }

        if (!hotel) {
            return res.status(400).json({
                success: false,
                message: 'Bạn chưa đăng ký khách sạn nào',
            });
        }

        req.hotel = hotel;
        next();
    } catch (error) {
        console.error('ownerMiddleware error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};

// Middleware kiểm tra role admin (hotelOwner)
export const requireHotelOwner = (req, res, next) => {
    try {
        const user = req.user;

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Chưa đăng nhập',
            });
        }

        if (user.role !== 'hotelOwner') {
            return res.status(403).json({
                success: false,
                message:
                    'Bạn không có quyền truy cập. Chỉ admin mới được phép.',
            });
        }

        next();
    } catch (error) {
        console.error('Role check error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi kiểm tra quyền',
        });
    }
};
