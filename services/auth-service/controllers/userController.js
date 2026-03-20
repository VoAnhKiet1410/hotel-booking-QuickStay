// GET /api/users — Lấy thông tin user hiện tại
export const getUserdata = async (req, res) => {
    try {
        const user = req.user;

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized',
            });
        }

        const response = {
            success: true,
            id: user._id,
            username: user.username,
            email: user.email,
            imageUrl: user.imageUrl,
            role: user.role,
            recentSearchedCities: user.recentSearchedCities || [],
        };

        res.json(response);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi trên máy chủ.',
        });
    }
};

// POST /api/users/store-recent-searched — Lưu thành phố đã tìm kiếm gần đây
export const storeUserRecentSearchedCities = async (req, res) => {
    try {
        const { recentSearchedCities } = req.body;
        const user = req.user;

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized',
            });
        }

        if (
            !Array.isArray(recentSearchedCities) ||
            recentSearchedCities.length === 0
        ) {
            return res.status(400).json({
                success: false,
                message: 'recentSearchedCities must be a non-empty array',
            });
        }

        const uniqueCities = recentSearchedCities.filter(
            (city) => typeof city === 'string' && city.trim()
        );

        if (!uniqueCities.length) {
            return res.status(400).json({
                success: false,
                message: 'No valid cities provided',
            });
        }

        for (const city of uniqueCities) {
            const existingIndex = user.recentSearchedCities.indexOf(city);
            if (existingIndex !== -1) {
                user.recentSearchedCities.splice(existingIndex, 1);
            }
            user.recentSearchedCities.push(city);
            if (user.recentSearchedCities.length > 3) {
                user.recentSearchedCities.shift();
            }
        }

        await user.save();

        res.json({
            success: true,
            message: 'Recent searched cities updated',
            recentSearchedCities: user.recentSearchedCities,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// GET /api/users/:id — Internal API: lấy user theo id (cho các service khác)
export const getUserById = async (req, res) => {
    try {
        const User = (await import('../models/User.js')).default;
        const user = await User.findById(req.params.id).lean();

        if (!user) {
            return res
                .status(404)
                .json({ success: false, message: 'User not found' });
        }

        res.json({ success: true, data: user });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
