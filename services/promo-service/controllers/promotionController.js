import fs from 'fs/promises';
import { v2 as cloudinary } from 'cloudinary';
import Promotion from '../models/Promotion.js';
import Coupon from '../models/Coupon.js';

const cleanupTempFile = async (file) => {
    if (!file) return;
    await fs.unlink(file.path).catch(() => { });
};

// ===== PUBLIC =====

// Lấy danh sách ưu đãi đang active (cho trang chủ)
export const getActivePromotions = async (req, res) => {
    try {
        const now = new Date();
        const promotions = await Promotion.find({
            isActive: true,
            validFrom: { $lte: now },
            validTo: { $gte: now },
        })
            .populate('hotel', 'name city')
            .sort({ createdAt: -1 })
            .lean();

        return res.json({ success: true, data: promotions });
    } catch (error) {
        console.error('Get active promotions error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Lấy chi tiết 1 promotion
export const getPromotionById = async (req, res) => {
    try {
        const promotion = await Promotion.findById(req.params.id)
            .populate('hotel', 'name city address')
            .lean();

        if (!promotion) {
            return res.status(404).json({ success: false, message: 'Promotion not found' });
        }

        return res.json({ success: true, data: promotion });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

// User claim coupon từ promotion
export const claimCoupon = async (req, res) => {
    try {
        const user = req.user;
        const { promotionId } = req.body;

        const promotion = await Promotion.findById(promotionId);
        if (!promotion) {
            return res.status(404).json({ success: false, message: 'Promotion not found' });
        }

        if (!promotion.isValid) {
            return res.status(400).json({ success: false, message: 'Ưu đãi đã hết hạn hoặc hết lượt' });
        }

        // Kiểm tra đã claim chưa
        const existing = await Coupon.findOne({ promotion: promotionId, user: user._id });
        if (existing) {
            return res.json({
                success: true,
                data: existing,
                message: 'Bạn đã lấy mã này rồi',
            });
        }

        const coupon = await Coupon.create({
            promotion: promotionId,
            code: promotion.couponCode,
            user: user._id,
        });

        return res.status(201).json({ success: true, data: coupon });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'Bạn đã lấy mã này rồi' });
        }
        console.error('Claim coupon error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Validate coupon code khi user nhập vào booking
export const validateCoupon = async (req, res) => {
    try {
        const user = req.user;
        const { code, roomId, nights } = req.body;

        if (!code) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập mã ưu đãi' });
        }

        const promotion = await Promotion.findOne({
            couponCode: code.toUpperCase().trim(),
            isActive: true,
        }).populate('hotel', 'name city');

        if (!promotion) {
            return res.status(404).json({ success: false, message: 'Mã ưu đãi không tồn tại' });
        }

        if (!promotion.isValid) {
            return res.status(400).json({ success: false, message: 'Mã ưu đãi đã hết hạn hoặc hết lượt' });
        }

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
        if (nights && promotion.minNights > nights) {
            return res.status(400).json({
                success: false,
                message: `Cần đặt tối thiểu ${promotion.minNights} đêm để áp dụng mã này`,
            });
        }

        // Check applicable room types
        if (roomId && promotion.applicableRoomTypes?.length > 0) {
            const Room = (await import('../models/Room.js')).default;
            const room = await Room.findById(roomId);
            if (room && !promotion.applicableRoomTypes.includes(room.roomType)) {
                return res.status(400).json({
                    success: false,
                    message: 'Mã ưu đãi không áp dụng cho loại phòng này',
                });
            }
        }

        return res.json({
            success: true,
            data: {
                promotionId: promotion._id,
                code: promotion.couponCode,
                discountType: promotion.discountType,
                discountValue: promotion.discountValue,
                title: promotion.title,
                hotel: promotion.hotel,
                minNights: promotion.minNights,
            },
        });
    } catch (error) {
        console.error('Validate coupon error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Lấy coupons đã claim của user
export const getMyCoupons = async (req, res) => {
    try {
        const user = req.user;

        const coupons = await Coupon.find({ user: user._id })
            .populate({
                path: 'promotion',
                populate: { path: 'hotel', select: 'name city' },
            })
            .sort({ createdAt: -1 })
            .lean();

        return res.json({ success: true, data: coupons });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ===== OWNER =====

export const createPromotion = async (req, res) => {
    let uploadedImageUrl = '';
    try {
        const hotel = req.hotel;
        const {
            title, description, discountType, discountValue,
            minNights, maxUses, validFrom, validTo,
            applicableRoomTypes, image, couponCode, category,
        } = req.body;

        if (!title || !description || !discountType || !discountValue || !validFrom || !validTo || !couponCode) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng điền đầy đủ thông tin bắt buộc',
            });
        }

        if (discountType === 'percent' && (discountValue < 1 || discountValue > 90)) {
            return res.status(400).json({
                success: false,
                message: 'Phần trăm giảm giá phải từ 1% đến 90%',
            });
        }

        // Check coupon code unique (Only check ACTIVE ones)
        // Mình chỉ chặn nếu đang có 1 cái mã CÒN HOẠT ĐỘNG trùng tên
        const existingCode = await Promotion.findOne({
            couponCode: couponCode.toUpperCase().trim(),
            isActive: true
        });

        if (existingCode) {
            return res.status(400).json({ success: false, message: 'Một mã coupon trùng tên đang hoạt động. Vui lòng tắt mã cũ trước khi tạo lại tên này.' });
        }

        if (req.file) {
            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: 'quickstay/promotions',
            });
            uploadedImageUrl = result.secure_url;
        }

        const promotion = await Promotion.create({
            title: title.trim(),
            description: description.trim(),
            discountType,
            discountValue,
            minNights: minNights || 1,
            maxUses: maxUses || null,
            validFrom: new Date(validFrom),
            validTo: new Date(validTo),
            hotel: hotel._id,
            applicableRoomTypes: applicableRoomTypes || [],
            image: uploadedImageUrl || image || '',
            couponCode: couponCode.toUpperCase().trim(),
            category: category || 'other',
            isActive: true,
        });

        await promotion.populate('hotel', 'name city');

        return res.status(201).json({ success: true, data: promotion });
    } catch (error) {
        console.error('Create promotion error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    } finally {
        if (req.file) {
            await cleanupTempFile(req.file);
        }
    }
};

export const getOwnerPromotions = async (req, res) => {
    try {
        const hotel = req.hotel;

        const promotions = await Promotion.find({ hotel: hotel._id })
            .sort({ createdAt: -1 })
            .lean();

        return res.json({ success: true, data: promotions });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const updatePromotion = async (req, res) => {
    let uploadedImageUrl = '';
    try {
        const hotel = req.hotel;
        const { id } = req.params;

        const promotion = await Promotion.findOne({ _id: id, hotel: hotel._id });
        if (!promotion) {
            return res.status(404).json({ success: false, message: 'Promotion not found' });
        }

        const allowedFields = [
            'title', 'description', 'discountType', 'discountValue',
            'minNights', 'maxUses', 'validFrom', 'validTo',
            'applicableRoomTypes', 'image', 'isActive', 'category',
        ];

        if (req.file) {
            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: 'quickstay/promotions',
            });
            uploadedImageUrl = result.secure_url;
            promotion.image = uploadedImageUrl;
        }

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                if (field === 'validFrom' || field === 'validTo') {
                    promotion[field] = new Date(req.body[field]);
                } else if (field !== 'image' || !req.file) {
                    promotion[field] = req.body[field];
                }
            }
        }

        await promotion.save();
        await promotion.populate('hotel', 'name city');

        return res.json({ success: true, data: promotion });
    } catch (error) {
        console.error('Update promotion error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    } finally {
        if (req.file) {
            await cleanupTempFile(req.file);
        }
    }
};

export const deletePromotion = async (req, res) => {
    try {
        const hotel = req.hotel;
        const { id } = req.params;

        const promotion = await Promotion.findOne({ _id: id, hotel: hotel._id });
        if (!promotion) {
            return res.status(404).json({ success: false, message: 'Promotion not found' });
        }

        // Soft delete: deactivate thay vì xóa hẳn
        promotion.isActive = false;
        await promotion.save();

        return res.json({ success: true, message: 'Promotion deactivated' });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};
