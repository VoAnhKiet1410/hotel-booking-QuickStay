import { protect as sharedProtect } from '../../../shared/middleware/authMiddleware.js';
import { createServiceClient } from '../../../shared/utils/serviceClient.js';

// Client gọi Auth Service để lấy/tạo user
const authClient = createServiceClient(
    process.env.AUTH_SERVICE_URL || 'http://localhost:3000'
);

/**
 * Auth middleware cho Hotel Service.
 * Sử dụng shared protect middleware,
 * khi cần user data sẽ gọi Auth Service để lấy.
 */
export const protect = sharedProtect({
    findOrCreateUser: async (userId, clerkUser) => {
        try {
            const result = await authClient.get(`/api/users/${userId}`);
            return result.data || { _id: userId };
        } catch {
            // Auth Service không available — trả minimal user
            return {
                _id: userId,
                role: 'user',
                username: clerkUser?.firstName
                    ? `${clerkUser.firstName} ${clerkUser.lastName || ''}`.trim()
                    : userId,
            };
        }
    },
});
