import mongoose from 'mongoose';
import Review from '../models/Review.js';
import Booking from '../models/Booking.js';
import Room from '../models/Room.js';
import Hotel from '../models/Hotel.js';

// Clamp value to valid rating range
const clampRating = (val, fallback) => {
    const num = Number(val) || fallback;
    return Math.max(1, Math.min(5, num));
};

export const createReview = async (req, res) => {
    try {
        const user = req.user;

        const { bookingId, rating, comment, cleanliness, service, location, valueForMoney } = req.body;

        if (!bookingId || !rating || !comment) {
            return res.status(400).json({
                success: false,
                message: 'bookingId, rating, and comment are required',
            });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: 'Rating must be between 1 and 5',
            });
        }

        const booking = await Booking.findById(bookingId).populate('room');

        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        if (booking.user.toString() !== user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You can only review your own bookings',
            });
        }

        const eligibleStatuses = ['completed', 'confirmed', 'checked_in'];
        const checkOutDate = new Date(booking.checkOutDate);
        const now = new Date();

        if (!eligibleStatuses.includes(booking.status) || checkOutDate > now) {
            return res.status(400).json({
                success: false,
                message: 'Bạn chỉ có thể đánh giá sau khi đã trả phòng',
            });
        }

        const existingReview = await Review.findOne({ booking: bookingId });

        if (existingReview) {
            return res.status(400).json({
                success: false,
                message: 'You have already reviewed this booking',
            });
        }

        const review = await Review.create({
            user: user._id,
            booking: bookingId,
            room: booking.room._id,
            hotel: booking.hotel,
            rating,
            comment: comment.trim(),
            cleanliness: clampRating(cleanliness, rating),
            service: clampRating(service, rating),
            location: clampRating(location, rating),
            valueForMoney: clampRating(valueForMoney, rating),
        });

        await review.populate(['user', 'room', 'hotel']);

        return res.status(201).json({
            success: true,
            data: review,
        });
    } catch (error) {
        console.error('Create review error:', error);
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'You have already reviewed this booking',
            });
        }
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const getReviewsByRoom = async (req, res) => {
    try {
        const { roomId } = req.params;
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
        const skip = (page - 1) * limit;

        const [reviews, total] = await Promise.all([
            Review.find({ room: roomId })
                .populate('user')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Review.countDocuments({ room: roomId }),
        ]);

        const avgRating = await Review.aggregate([
            { $match: { room: new mongoose.Types.ObjectId(roomId) } },
            {
                $group: {
                    _id: null,
                    avgRating: { $avg: '$rating' },
                    avgCleanliness: { $avg: '$cleanliness' },
                    avgService: { $avg: '$service' },
                    avgLocation: { $avg: '$location' },
                    avgValueForMoney: { $avg: '$valueForMoney' },
                },
            },
        ]);

        return res.json({
            success: true,
            data: {
                reviews,
                total,
                page,
                totalPages: Math.ceil(total / limit),
                averages: avgRating[0] || null,
            },
        });
    } catch (error) {
        console.error('Get reviews error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const getReviewsByHotel = async (req, res) => {
    try {
        const { hotelId } = req.params;
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
        const skip = (page - 1) * limit;

        const [reviews, total] = await Promise.all([
            Review.find({ hotel: hotelId })
                .populate('user')
                .populate('room')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Review.countDocuments({ hotel: hotelId }),
        ]);

        const avgRating = await Review.aggregate([
            { $match: { hotel: new mongoose.Types.ObjectId(hotelId) } },
            {
                $group: {
                    _id: null,
                    avgRating: { $avg: '$rating' },
                    avgCleanliness: { $avg: '$cleanliness' },
                    avgService: { $avg: '$service' },
                    avgLocation: { $avg: '$location' },
                    avgValueForMoney: { $avg: '$valueForMoney' },
                    totalReviews: { $sum: 1 },
                },
            },
        ]);

        const ratingDistribution = await Review.aggregate([
            { $match: { hotel: new mongoose.Types.ObjectId(hotelId) } },
            { $group: { _id: '$rating', count: { $sum: 1 } } },
            { $sort: { _id: -1 } },
        ]);

        return res.json({
            success: true,
            data: {
                reviews,
                total,
                page,
                totalPages: Math.ceil(total / limit),
                averages: avgRating[0] || null,
                ratingDistribution,
            },
        });
    } catch (error) {
        console.error('Get hotel reviews error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const getMyReviews = async (req, res) => {
    try {
        const user = req.user;

        const reviews = await Review.find({ user: user._id })
            .populate('room')
            .populate('hotel')
            .populate('booking')
            .sort({ createdAt: -1 })
            .lean();

        return res.json({
            success: true,
            data: reviews,
        });
    } catch (error) {
        console.error('Get my reviews error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const updateReview = async (req, res) => {
    try {
        const user = req.user;

        const { id } = req.params;
        const { rating, comment, cleanliness, service, location, valueForMoney } = req.body;

        const review = await Review.findOne({ _id: id, user: user._id });

        if (!review) {
            return res.status(404).json({ success: false, message: 'Review not found' });
        }

        if (rating !== undefined) {
            if (rating < 1 || rating > 5) {
                return res.status(400).json({
                    success: false,
                    message: 'Rating must be between 1 and 5',
                });
            }
            review.rating = rating;
        }

        if (comment !== undefined) {
            review.comment = comment.trim();
        }

        if (cleanliness !== undefined) review.cleanliness = clampRating(cleanliness, review.cleanliness);
        if (service !== undefined) review.service = clampRating(service, review.service);
        if (location !== undefined) review.location = clampRating(location, review.location);
        if (valueForMoney !== undefined) review.valueForMoney = clampRating(valueForMoney, review.valueForMoney);

        await review.save();
        await review.populate(['user', 'room', 'hotel']);

        return res.json({
            success: true,
            data: review,
        });
    } catch (error) {
        console.error('Update review error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const deleteReview = async (req, res) => {
    try {
        const user = req.user;

        const { id } = req.params;

        const review = await Review.findOne({ _id: id, user: user._id });

        if (!review) {
            return res.status(404).json({ success: false, message: 'Review not found' });
        }

        await review.deleteOne();

        return res.json({
            success: true,
            message: 'Review deleted successfully',
        });
    } catch (error) {
        console.error('Delete review error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const respondToReview = async (req, res) => {
    try {
        const user = req.user;

        if (user.role !== 'hotelOwner') {
            return res.status(403).json({
                success: false,
                message: 'Only hotel owners can respond to reviews',
            });
        }

        const { id } = req.params;
        const { comment } = req.body;

        if (!comment || !comment.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Response comment is required',
            });
        }

        const review = await Review.findById(id).populate('hotel');

        if (!review) {
            return res.status(404).json({ success: false, message: 'Review not found' });
        }

        const hotel = await Hotel.findOne({ _id: review.hotel._id, owner: user._id });

        if (!hotel) {
            return res.status(403).json({
                success: false,
                message: 'You can only respond to reviews of your hotel',
            });
        }

        review.response = {
            comment: comment.trim(),
            respondedBy: user._id,
            respondedAt: new Date(),
        };

        await review.save();
        await review.populate(['user', 'room', 'hotel']);

        return res.json({
            success: true,
            data: review,
        });
    } catch (error) {
        console.error('Respond to review error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const markReviewHelpful = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?._id;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập để đánh giá hữu ích' });
        }

        const review = await Review.findById(id);

        if (!review) {
            return res.status(404).json({ success: false, message: 'Review not found' });
        }

        const alreadyVoted = review.helpfulVotes?.includes(userId);

        if (alreadyVoted) {
            // Toggle: un-vote nếu đã vote trước đó
            review.helpfulVotes = review.helpfulVotes.filter((v) => v !== userId);
        } else {
            review.helpfulVotes = [...(review.helpfulVotes || []), userId];
        }

        review.helpfulCount = review.helpfulVotes.length;
        await review.save();

        return res.json({
            success: true,
            data: {
                helpfulCount: review.helpfulCount,
                voted: !alreadyVoted,
            },
        });
    } catch (error) {
        console.error('Mark helpful error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const getReviewByBooking = async (req, res) => {
    try {
        const user = req.user;

        const { bookingId } = req.params;

        // Verify user owns this booking or is hotel owner
        const booking = await Booking.findById(bookingId).lean();
        if (booking) {
            const isOwner = booking.user?.toString() === user._id?.toString();
            const hotel = !isOwner ? await Hotel.findOne({ _id: booking.hotel, owner: user._id }).lean() : null;
            if (!isOwner && !hotel) {
                return res.status(403).json({ success: false, message: 'Not authorized to view this review' });
            }
        }

        const review = await Review.findOne({ booking: bookingId })
            .populate('user')
            .populate('room')
            .populate('hotel')
            .lean();

        if (!review) {
            return res.status(404).json({ success: false, message: 'No review found for this booking' });
        }

        return res.json({
            success: true,
            data: review,
        });
    } catch (error) {
        console.error('Get review by booking error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};
