import User from '../models/User.js';
import { clerkClient, verifyToken } from '@clerk/express';
import {
    getAuthorizedParties,
    CLOCK_SKEW_MS,
} from '../../../shared/utils/constants.js';

/**
 * Auth middleware - Xac thuc Clerk JWT va tim/tao user trong shared DB.
 */
export const protect = async (req, res, next) => {
    try {
        if (!process.env.CLERK_SECRET_KEY) {
            return res.status(500).json({
                success: false,
                message: 'Auth misconfigured',
            });
        }

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

        const isDev = process.env.NODE_ENV !== 'production';
        let userId = null;
        try {
            const payload = await verifyToken(token, {
                secretKey: process.env.CLERK_SECRET_KEY,
                authorizedParties: getAuthorizedParties(
                    process.env.CLIENT_URL,
                    isDev
                ),
                clockSkewInMs: isDev
                    ? CLOCK_SKEW_MS.DEVELOPMENT
                    : CLOCK_SKEW_MS.PRODUCTION,
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

        let user = await User.findById(userId);

        if (!user) {
            const clerkUser = await clerkClient.users.getUser(userId);
            const email =
                clerkUser.emailAddresses?.[0]?.emailAddress ||
                clerkUser.primaryEmailAddress?.emailAddress ||
                '';
            const username =
                `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() ||
                clerkUser.username ||
                email ||
                userId;
            const imageUrl =
                clerkUser.imageUrl ||
                'https://img.clerk.com/avatars/default-profile.png';
            user = await User.create({
                _id: userId,
                username,
                email,
                imageUrl,
            });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Auth error:', error.message);
        return res
            .status(500)
            .json({ success: false, message: 'Server error' });
    }
};
