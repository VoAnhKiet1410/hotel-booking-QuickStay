import fs from 'fs/promises';
import Room from '../models/Room.js';
import Hotel from '../models/Hotel.js';
import { uploadImagesToCloudinary } from '../utils/cloudinaryUtils.js';
import { createServiceClient } from '../../../shared/utils/serviceClient.js';

// Service client cho Booking Service (kiểm tra booking trước khi xóa room)
const bookingClient = createServiceClient(
    process.env.BOOKING_SERVICE_URL || 'http://localhost:3003'
);

const normalizeRoom = (room) => {
    if (!room) return room;
    const data = typeof room.toObject === 'function' ? room.toObject() : room;
    return {
        ...data,
        status: data.status || 'open',
        isAvailable: (data.status || 'open') === 'open',
    };
};

/**
 * Parse amenities từ nhiều định dạng input (array, JSON string, CSV).
 */
const parseAmenities = (amenities) => {
    if (Array.isArray(amenities)) return amenities;
    if (typeof amenities === 'string' && amenities.trim()) {
        try {
            const parsed = JSON.parse(amenities);
            if (Array.isArray(parsed)) return parsed;
            return [amenities];
        } catch {
            return amenities
                .split(',')
                .map((item) => item.trim())
                .filter(Boolean);
        }
    }
    return [];
};

export const createRoomForOwner = async (req, res) => {
    try {
        const hotel = req.hotel;

        let {
            roomType,
            pricePerNight,
            capacity,
            totalRooms,
            amenities,
            images,
            status,
            isAvailable,
            bed,
            area,
            description,
            wing,
        } = req.body;

        const parsedPrice = Number(pricePerNight);
        const parsedCapacity = Number(capacity);
        const parsedTotalRooms = Number(totalRooms) || 1;

        if (
            !roomType ||
            Number.isNaN(parsedPrice) ||
            parsedPrice <= 0 ||
            Number.isNaN(parsedCapacity) ||
            parsedCapacity <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: 'roomType, pricePerNight and capacity must be valid',
            });
        }

        if (parsedTotalRooms < 1) {
            return res.status(400).json({
                success: false,
                message: 'totalRooms must be at least 1',
            });
        }

        const amenitiesArray = parseAmenities(amenities);

        const uploadedImageUrls = await uploadImagesToCloudinary(
            req.files,
            'quickstay/rooms'
        );

        if (!uploadedImageUrls.length) {
            if (Array.isArray(images)) {
                uploadedImageUrls.push(...images.filter(Boolean));
            } else if (typeof images === 'string' && images.trim()) {
                try {
                    const parsed = JSON.parse(images);
                    if (Array.isArray(parsed)) {
                        uploadedImageUrls.push(...parsed);
                    } else {
                        uploadedImageUrls.push(images);
                    }
                } catch {
                    uploadedImageUrls.push(images);
                }
            }
        }

        if (!uploadedImageUrls.length) {
            return res.status(400).json({
                success: false,
                message: 'At least one image is required',
            });
        }

        const allowedStatuses = new Set(['open', 'paused', 'soldout']);
        const finalStatus =
            typeof status === 'string' && allowedStatuses.has(status)
                ? status
                : 'open';

        const roomData = {
            hotel: hotel._id,
            roomType,
            pricePerNight: parsedPrice,
            capacity: parsedCapacity,
            totalRooms: parsedTotalRooms,
            amenities: amenitiesArray,
            images: uploadedImageUrls,
            status: finalStatus,
        };
        if (bed) roomData.bed = bed.trim();
        if (area) roomData.area = area.trim();
        if (description) roomData.description = description.trim();
        if (wing) roomData.wing = wing.trim();

        const room = await Room.create(roomData);

        await room.populate('hotel');

        return res.status(201).json({
            success: true,
            data: normalizeRoom(room),
        });
    } catch (error) {
        console.error('createRoomForOwner error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};

export const getAllRooms = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(
            50,
            Math.max(1, parseInt(req.query.limit) || 12)
        );
        const skip = (page - 1) * limit;

        const filter = { status: 'open' };

        // Filter by city — cần query Hotel trước vì city nằm trên Hotel model
        if (req.query.city) {
            const matchingHotels = await Hotel.find(
                { city: { $regex: req.query.city, $options: 'i' } },
                '_id'
            ).lean();
            const hotelIds = matchingHotels.map((h) => h._id);
            if (hotelIds.length === 0) {
                return res.json({
                    success: true,
                    data: [],
                    pagination: {
                        page,
                        limit,
                        total: 0,
                        totalPages: 0,
                        hasMore: false,
                    },
                });
            }
            filter.hotel = { $in: hotelIds };
        }

        // Filter by price range
        if (req.query.minPrice) {
            filter.pricePerNight = {
                ...filter.pricePerNight,
                $gte: parseInt(req.query.minPrice),
            };
        }
        if (req.query.maxPrice) {
            filter.pricePerNight = {
                ...filter.pricePerNight,
                $lte: parseInt(req.query.maxPrice),
            };
        }

        // Sort options
        let sortOption = { createdAt: -1 };
        if (req.query.sort === 'priceAsc') sortOption = { pricePerNight: 1 };
        if (req.query.sort === 'priceDesc') sortOption = { pricePerNight: -1 };

        const [rooms, total] = await Promise.all([
            Room.find(filter)
                .populate('hotel')
                .sort(sortOption)
                .skip(skip)
                .limit(limit)
                .lean(),
            Room.countDocuments(filter),
        ]);

        return res.json({
            success: true,
            data: rooms.map(normalizeRoom),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasMore: page * limit < total,
            },
        });
    } catch (error) {
        console.error('getAllRooms error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error',
            error:
                process.env.NODE_ENV === 'development'
                    ? error.message
                    : undefined,
        });
    }
};

export const getRoomById = async (req, res) => {
    try {
        const { id } = req.params;
        const room = await Room.findById(id)
            .populate('hotel')
            .lean();

        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Room not found',
            });
        }

        return res.json({
            success: true,
            data: normalizeRoom(room),
        });
    } catch (error) {
        console.error('getRoomById error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};

export const getOwnerRooms = async (req, res) => {
    try {
        const user = req.user;

        // Support filtering by hotelId query param for multi-hotel
        const hotelId = req.query.hotelId;
        let filter;

        if (hotelId) {
            // Verify ownership
            const hotel = await Hotel.findOne({
                _id: hotelId,
                owner: user._id,
            });
            if (!hotel) {
                return res
                    .status(404)
                    .json({ success: false, message: 'Hotel not found' });
            }
            filter = { hotel: hotel._id };
        } else {
            // Get all rooms across all owner's hotels
            const ownerHotels = await Hotel.find(
                { owner: user._id },
                '_id'
            ).lean();
            const hotelIds = ownerHotels.map((h) => h._id);
            filter = { hotel: { $in: hotelIds } };
        }

        const rooms = await Room.find(filter)
            .sort({ createdAt: -1 })
            .populate('hotel')
            .lean();

        return res.json({
            success: true,
            data: rooms.map(normalizeRoom),
        });
    } catch (error) {
        console.error('getOwnerRooms error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};

export const toggleRoomAvailability = async (req, res) => {
    try {
        const hotel = req.hotel;

        const { id } = req.params;
        const room = await Room.findOne({ _id: id, hotel: hotel._id });

        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Room not found',
            });
        }

        room.status = room.status === 'open' ? 'paused' : 'open';

        await room.save();
        await room.populate('hotel');

        return res.json({
            success: true,
            data: normalizeRoom(room),
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};

export const updateRoomStatusForOwner = async (req, res) => {
    try {
        const hotel = req.hotel;

        const { id } = req.params;
        const { status } = req.body;

        if (
            status !== 'open' &&
            status !== 'paused' &&
            status !== 'soldout'
        ) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status',
            });
        }

        const room = await Room.findOne({
            _id: id,
            hotel: hotel._id,
        }).populate('hotel');

        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Room not found',
            });
        }

        room.status = status;

        await room.save();

        return res.json({
            success: true,
            data: normalizeRoom(room),
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};

export const updateRoomForOwner = async (req, res) => {
    try {
        const hotel = req.hotel;

        const { id } = req.params;
        const room = await Room.findOne({ _id: id, hotel: hotel._id });

        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Room not found',
            });
        }

        let {
            roomType,
            pricePerNight,
            capacity,
            totalRooms,
            amenities,
            status,
            existingImages,
            bed,
            area,
            description,
            wing,
        } = req.body;

        // Update basic fields
        if (roomType) room.roomType = roomType;

        if (pricePerNight) {
            const parsedPrice = Number(pricePerNight);
            if (!Number.isNaN(parsedPrice) && parsedPrice > 0) {
                room.pricePerNight = parsedPrice;
            }
        }

        if (capacity) {
            const parsedCapacity = Number(capacity);
            if (!Number.isNaN(parsedCapacity) && parsedCapacity > 0) {
                room.capacity = parsedCapacity;
            }
        }

        if (totalRooms) {
            const parsedTotalRooms = Number(totalRooms);
            if (!Number.isNaN(parsedTotalRooms) && parsedTotalRooms >= 1) {
                room.totalRooms = parsedTotalRooms;
            }
        }

        // Update amenities
        if (amenities) {
            room.amenities = parseAmenities(amenities);
        }

        // Update status
        const allowedStatuses = new Set(['open', 'paused', 'soldout']);
        if (status && allowedStatuses.has(status)) {
            room.status = status;
        }

        // Update new fields
        if (typeof bed === 'string') room.bed = bed.trim();
        if (typeof area === 'string') room.area = area.trim();
        if (typeof description === 'string')
            room.description = description.trim();
        if (typeof wing === 'string') {
            room.wing = wing.trim();
        }

        // Handle images
        let finalImages = [];

        // Parse existing images to keep
        if (existingImages) {
            try {
                const parsed = JSON.parse(existingImages);
                if (Array.isArray(parsed)) {
                    finalImages = parsed.filter(Boolean);
                }
            } catch {
                // ignore parse error
            }
        }

        // Upload new images
        const newImageUrls = await uploadImagesToCloudinary(
            req.files,
            'quickstay/rooms'
        );
        finalImages.push(...newImageUrls);

        // Ensure at least one image
        if (finalImages.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'At least one image is required',
            });
        }

        room.images = finalImages.slice(0, 5); // Max 5 images

        await room.save();
        await room.populate('hotel');

        return res.json({
            success: true,
            data: normalizeRoom(room),
        });
    } catch (error) {
        console.error('updateRoomForOwner error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};

export const deleteRoomForOwner = async (req, res) => {
    try {
        const hotel = req.hotel;

        const { id } = req.params;

        const room = await Room.findOne({ _id: id, hotel: hotel._id });

        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Room not found',
            });
        }

        // Gọi Booking Service kiểm tra phòng có booking không
        try {
            const result = await bookingClient.get(
                `/internal/rooms/${room._id}/has-bookings`
            );
            if (result.data?.hasBookings) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot delete a room with existing bookings',
                });
            }
        } catch (error) {
            // Nếu booking service down, block xóa phòng (safety first)
            console.error('Cannot verify bookings:', error.message);
            return res.status(503).json({
                success: false,
                message:
                    'Cannot verify bookings. Please try again later.',
            });
        }

        await room.deleteOne();

        return res.json({
            success: true,
            message: 'Room deleted',
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};
