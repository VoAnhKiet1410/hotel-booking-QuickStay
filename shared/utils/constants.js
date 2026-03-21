// Upload limits
export const MAX_IMAGES_PER_ROOM = 5;
export const MAX_FILE_SIZE_MB = 10;

// Pagination
export const DEFAULT_PAGE_SIZE = 12;
export const MAX_PAGE_SIZE = 50;

// Room status
export const ROOM_STATUS = {
    OPEN: 'open',
    PAUSED: 'paused',
    SOLDOUT: 'soldout',
};

// Booking status
export const BOOKING_STATUS = {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    CHECKED_IN: 'checked_in',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
};

// Payment methods
export const PAYMENT_METHODS = {
    STRIPE: 'Stripe',
    PAY_AT_HOTEL: 'Pay At Hotel',
};

// Refund status
export const REFUND_STATUS = {
    NOT_REQUESTED: 'not_requested',
    PENDING: 'pending',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    FAILED: 'failed',
    REJECTED: 'rejected',
};

// Housekeeping status
export const HOUSEKEEPING_STATUS = {
    CLEAN: 'clean',
    DIRTY: 'dirty',
    INSPECTING: 'inspecting',
    OUT_OF_ORDER: 'out_of_order',
};

// User roles
export const USER_ROLES = {
    USER: 'user',
    HOTEL_OWNER: 'hotelOwner',
};

// Clock skew for JWT verification (in milliseconds)
export const CLOCK_SKEW_MS = {
    DEVELOPMENT: 300_000, // 5 minutes
    PRODUCTION: 30_000,   // 30 seconds
};

// Authorized parties for Clerk
export const getAuthorizedParties = (clientUrl, isDev = false) => {
    const parties = new Set();

    if (clientUrl) {
        parties.add(clientUrl.trim().replace(/\/+$/, ''));
    }

    // Production Vercel URLs (main + preview deployments)
    parties.add('https://hotel-booking-quick-stay-chi.vercel.app');

    if (isDev) {
        parties.add('http://localhost:5173');
        parties.add('http://localhost:5174');
        parties.add('http://127.0.0.1:5173');
        parties.add('http://127.0.0.1:5174');
    }

    return Array.from(parties);
};
