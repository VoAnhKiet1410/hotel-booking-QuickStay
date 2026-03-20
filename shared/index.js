/**
 * @hotel/shared — Entry point
 *
 * Re-exports tất cả shared utilities dùng chung giữa các microservices.
 */

export { protect } from './middleware/authMiddleware.js';
export { calculateNights, validateBookingDates } from './utils/dateUtils.js';
export {
    BOOKING_STATUS,
    PAYMENT_METHODS,
    REFUND_STATUS,
    HOUSEKEEPING_STATUS,
    ROOM_STATUS,
    USER_ROLES,
} from './utils/constants.js';
export { trySendEmail } from './utils/emailHelper.js';
export { createServiceClient } from './utils/serviceClient.js';
