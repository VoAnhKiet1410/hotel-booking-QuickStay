import { verifyToken, clerkClient } from '@clerk/express';
import { getAuthorizedParties, CLOCK_SKEW_MS } from '../utils/constants.js';

/**
 * Shared auth middleware — xác thực Clerk JWT token.
 *
 * Mỗi service import middleware này từ @hotel/shared.
 * Service cần cung cấp User model riêng hoặc callback để tìm/tạo user.
 *
 * @param {object} options
 * @param {Function} options.findOrCreateUser — async (userId, clerkUser) => user document
 * @returns {Function} Express middleware
 */
export const protect = (options = {}) => {
    const { findOrCreateUser } = options;

    return async (req, res, next) => {
        try {
            if (!process.env.CLERK_SECRET_KEY) {
                return res.status(500).json({
                    success: false,
                    message: 'Auth misconfigured',
                });
            }

            // Lấy token từ header hoặc cookie
            let token = null;
            const authHeader = req.headers.authorization;

            if (authHeader && authHeader.startsWith('Bearer ')) {
                token = authHeader.substring(7);
            } else if (typeof req.headers.cookie === 'string') {
                const cookies = req.headers.cookie
                    .split(';')
                    .map((part) => part.trim());
                const sessionCookie = cookies.find((part) =>
                    part.startsWith('__session=')
                );
                if (sessionCookie) {
                    token = decodeURIComponent(
                        sessionCookie.slice('__session='.length)
                    );
                }
            }

            if (!token) {
                return res.status(401).json({
                    success: false,
                    message: 'Not authorized, no token',
                    reason: 'missing_token',
                });
            }

            // Verify token
            const isDev = process.env.NODE_ENV !== 'production';
            const clockSkew = isDev
                ? CLOCK_SKEW_MS.DEVELOPMENT
                : CLOCK_SKEW_MS.PRODUCTION;

            let userId = null;
            try {
                const payload = await verifyToken(token, {
                    secretKey: process.env.CLERK_SECRET_KEY,
                    authorizedParties: getAuthorizedParties(
                        process.env.CLIENT_URL,
                        isDev
                    ),
                    clockSkewInMs: clockSkew,
                });
                userId = payload.sub;
            } catch (verifyError) {
                const message = verifyError.message || 'Invalid token';
                const isNotActiveYet =
                    message.includes('nbf') || message.includes('not active');

                return res.status(401).json({
                    success: false,
                    message: isNotActiveYet
                        ? 'Not authorized, token not active yet'
                        : 'Not authorized, invalid token',
                    reason: isNotActiveYet
                        ? 'token_not_active_yet'
                        : 'invalid_token',
                });
            }

            // Tìm hoặc tạo user nếu callback được cung cấp
            if (findOrCreateUser) {
                let clerkUser = null;
                try {
                    clerkUser = await clerkClient.users.getUser(userId);
                } catch {
                    // Clerk API fail — chỉ set userId thay vì full user object
                }

                const user = await findOrCreateUser(userId, clerkUser);
                req.user = user || { _id: userId };
            } else {
                // Minimal user — chỉ set userId cho services không cần full user
                req.user = { _id: userId };
            }

            next();
        } catch (error) {
            console.error('Auth error:', error.message);
            return res
                .status(500)
                .json({ success: false, message: 'Server error' });
        }
    };
};
