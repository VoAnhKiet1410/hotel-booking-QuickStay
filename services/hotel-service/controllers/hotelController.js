import Hotel from '../models/Hotel.js';
import Room from '../models/Room.js';
import User from '../models/User.js';
import { uploadImagesToCloudinary } from '../utils/cloudinaryUtils.js';

// ══════════════════════════════════════════
// OWNER ENDPOINTS (protected)
// ══════════════════════════════════════════

export const registerHotel = async (req, res) => {
    try {
        const { name, city, address, contact, description, hostDescription, images, starRating, amenities, checkInTime, checkOutTime, theme, wing, regionDescription } = req.body;
        const owner = req.user._id;

        const hotelData = { name, address, contact, city, owner };
        if (description) hotelData.description = description.trim();
        if (hostDescription) hotelData.hostDescription = hostDescription.trim();

        const uploadedImageUrls = await uploadImagesToCloudinary(req.files, 'quickstay/hotels');

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

        hotelData.images = uploadedImageUrls.slice(0, 5);
        if (starRating) {
            const parsed = Number(starRating);
            if (parsed >= 1 && parsed <= 5) hotelData.starRating = parsed;
        }
        if (Array.isArray(amenities)) hotelData.amenities = amenities;
        if (checkInTime) hotelData.checkInTime = checkInTime;
        if (checkOutTime) hotelData.checkOutTime = checkOutTime;
        if (theme) hotelData.theme = theme;
        if (wing) hotelData.wing = wing;
        if (regionDescription) hotelData.regionDescription = regionDescription.trim();

        const hotel = await Hotel.create(hotelData);

        // Ensure user has hotelOwner role
        if (req.user.role !== 'hotelOwner') {
            await User.findByIdAndUpdate(owner, { role: 'hotelOwner' });
        }

        return res.status(201).json({
            success: true,
            message: 'Hotel registered successfully',
            data: hotel,
        });
    } catch (error) {
        console.error('registerHotel error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};

export const getMyHotels = async (req, res) => {
    try {
        const user = req.user;
        const hotels = await Hotel.find({ owner: user._id }).sort({ createdAt: -1 }).lean();

        return res.json({ success: true, data: hotels });
    } catch (error) {
        console.error('getMyHotels error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const updateMyHotelById = async (req, res) => {
    try {
        const user = req.user;
        const { id } = req.params;

        if (user.role !== 'hotelOwner') {
            return res.status(403).json({ success: false, message: 'Only hotel owners can update hotel' });
        }

        const hotel = await Hotel.findOne({ _id: id, owner: user._id });
        if (!hotel) {
            return res.status(404).json({ success: false, message: 'Hotel not found' });
        }

        const { name, address, city, contact, description, hostDescription, images, starRating, amenities, checkInTime, checkOutTime, theme, wing, regionDescription, existingImages } = req.body;

        if (name) hotel.name = name.trim();
        if (address) hotel.address = address.trim();
        if (city) hotel.city = city.trim();
        if (contact) hotel.contact = contact.trim();
        if (typeof description === 'string') hotel.description = description.trim();
        if (typeof hostDescription === 'string') hotel.hostDescription = hostDescription.trim();

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
                if (typeof existingImages === 'string' && existingImages.trim()) {
                    finalImages.push(existingImages);
                }
            }
        } else if (images && !(req.files && req.files.length)) {
            // fallback for backward UI compatibility
            if (Array.isArray(images)) finalImages.push(...images.filter(Boolean));
            else if (typeof images === 'string') {
                try {
                    const parsed = JSON.parse(images);
                    if (Array.isArray(parsed)) finalImages.push(...parsed);
                    else finalImages.push(images);
                } catch {
                    finalImages.push(images);
                }
            }
        }

        // Upload new images
        const newImageUrls = await uploadImagesToCloudinary(req.files, 'quickstay/hotels');
        finalImages.push(...newImageUrls);

        hotel.images = finalImages.slice(0, 5); // Max 5

        if (starRating) {
            const parsed = Number(starRating);
            if (parsed >= 1 && parsed <= 5) hotel.starRating = parsed;
        }
        if (Array.isArray(amenities)) hotel.amenities = amenities;
        if (checkInTime) hotel.checkInTime = checkInTime;
        if (checkOutTime) hotel.checkOutTime = checkOutTime;
        if (theme) hotel.theme = theme;
        if (wing) hotel.wing = wing;
        if (typeof regionDescription === 'string') hotel.regionDescription = regionDescription.trim();

        await hotel.save();

        return res.json({ success: true, data: hotel });
    } catch (error) {
        console.error('updateMyHotelById error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const deleteMyHotelById = async (req, res) => {
    try {
        const user = req.user;
        const { id } = req.params;

        const hotel = await Hotel.findOne({ _id: id, owner: user._id });
        if (!hotel) {
            return res.status(404).json({ success: false, message: 'Hotel not found' });
        }

        // Check if hotel has rooms
        const roomCount = await Room.countDocuments({ hotel: hotel._id });
        if (roomCount > 0) {
            return res.status(400).json({
                success: false,
                message: `Không thể xóa khách sạn đang có ${roomCount} phòng. Hãy xóa hết phòng trước.`,
            });
        }

        await hotel.deleteOne();

        return res.json({ success: true, message: 'Hotel deleted' });
    } catch (error) {
        console.error('deleteMyHotelById error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ══════════════════════════════════════════
// PUBLIC ENDPOINTS
// ══════════════════════════════════════════

export const getAllHotels = async (req, res) => {
    try {
        const filter = {};
        if (req.query.city) {
            filter.city = { $regex: req.query.city, $options: 'i' };
        }
        if (req.query.theme) {
            filter.theme = req.query.theme;
        }

        const hotels = await Hotel.find(filter).sort({ createdAt: 1 }).lean();

        // Aggregate minPrice for each hotel from Room collection
        const hotelIds = hotels.map(h => h._id);
        const priceAgg = await Room.aggregate([
            { $match: { hotel: { $in: hotelIds }, status: 'open' } },
            { $group: { _id: '$hotel', minPrice: { $min: '$pricePerNight' } } },
        ]);
        const priceMap = Object.fromEntries(priceAgg.map(p => [String(p._id), p.minPrice]));

        const data = hotels.map(h => ({
            ...h,
            minPrice: priceMap[String(h._id)] || 0,
        }));

        return res.json({ success: true, data });
    } catch (error) {
        console.error('getAllHotels error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const getHotelById = async (req, res) => {
    try {
        const { id } = req.params;
        const hotel = await Hotel.findById(id).populate({
            path: 'owner',
            model: 'User',
            select: 'username imageUrl',
        }).lean();

        if (!hotel) {
            return res.status(404).json({ success: false, message: 'Hotel not found' });
        }

        // Also fetch rooms for this hotel
        const rooms = await Room.find({ hotel: hotel._id, status: 'open' })
            .populate('hotel')
            .sort({ pricePerNight: 1 })
            .lean();

        return res.json({
            success: true,
            data: {
                ...hotel,
                rooms: rooms.map(r => ({
                    ...r,
                    isAvailable: (r.status || 'open') === 'open',
                })),
            },
        });
    } catch (error) {
        console.error('getHotelById error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Backward compat: getMyHotel returns first hotel (used by some existing code)
export const getMyHotel = async (req, res) => {
    try {
        const user = req.user;
        const hotel = await Hotel.findOne({ owner: user._id });
        if (!hotel) {
            return res.status(404).json({ success: false, message: 'Hotel not found' });
        }
        return res.json({ success: true, data: hotel });
    } catch (error) {
        console.error('getMyHotel error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Backward compat
export const updateMyHotel = async (req, res) => {
    try {
        const user = req.user;
        if (user.role !== 'hotelOwner') {
            return res.status(403).json({ success: false, message: 'Only hotel owners can update hotel' });
        }
        const hotel = await Hotel.findOne({ owner: user._id });
        if (!hotel) {
            return res.status(404).json({ success: false, message: 'Hotel not found' });
        }

        const { name, address, city, contact, description, hostDescription, images, starRating, amenities, checkInTime, checkOutTime, theme, wing, regionDescription, existingImages } = req.body;

        if (name) hotel.name = name.trim();
        if (address) hotel.address = address.trim();
        if (city) hotel.city = city.trim();
        if (contact) hotel.contact = contact.trim();
        if (typeof description === 'string') hotel.description = description.trim();
        if (typeof hostDescription === 'string') hotel.hostDescription = hostDescription.trim();

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
                if (typeof existingImages === 'string' && existingImages.trim()) {
                    finalImages.push(existingImages);
                }
            }
        } else if (images && !(req.files && req.files.length)) {
            // fallback for backward UI compatibility
            if (Array.isArray(images)) finalImages.push(...images.filter(Boolean));
            else if (typeof images === 'string') {
                try {
                    const parsed = JSON.parse(images);
                    if (Array.isArray(parsed)) finalImages.push(...parsed);
                    else finalImages.push(images);
                } catch {
                    finalImages.push(images);
                }
            }
        }

        // Upload new images
        const newImageUrls = await uploadImagesToCloudinary(req.files, 'quickstay/hotels');
        finalImages.push(...newImageUrls);

        hotel.images = finalImages.slice(0, 5); // Max 5
        if (starRating) {
            const parsed = Number(starRating);
            if (parsed >= 1 && parsed <= 5) hotel.starRating = parsed;
        }
        if (Array.isArray(amenities)) hotel.amenities = amenities;
        if (checkInTime) hotel.checkInTime = checkInTime;
        if (checkOutTime) hotel.checkOutTime = checkOutTime;
        if (theme) hotel.theme = theme;
        if (wing) hotel.wing = wing;
        if (typeof regionDescription === 'string') hotel.regionDescription = regionDescription.trim();

        await hotel.save();
        return res.json({ success: true, data: hotel });
    } catch (error) {
        console.error('updateMyHotel error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};
