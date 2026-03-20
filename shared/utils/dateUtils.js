/**
 * Tính số đêm giữa 2 ngày.
 * @param {string|Date} checkInDate
 * @param {string|Date} checkOutDate
 * @returns {number|null} Số đêm hoặc null nếu ngày không hợp lệ
 */
export const calculateNights = (checkInDate, checkOutDate) => {
    const start = new Date(checkInDate);
    const end = new Date(checkOutDate);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        return null;
    }

    const diffMs = end.getTime() - start.getTime();
    const nights = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (nights <= 0) return null;

    return nights;
};

/**
 * Validate ngày check-in/check-out cho booking.
 * @returns {{ valid: boolean, message?: string }}
 */
export const validateBookingDates = (checkInDate, checkOutDate) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);

    checkIn.setHours(0, 0, 0, 0);
    checkOut.setHours(0, 0, 0, 0);

    if (Number.isNaN(checkIn.getTime()) || Number.isNaN(checkOut.getTime())) {
        return { valid: false, message: 'Invalid date format' };
    }

    if (checkIn < now) {
        return { valid: false, message: 'Check-in date must be today or in the future' };
    }

    if (checkOut <= checkIn) {
        return { valid: false, message: 'Check-out date must be after check-in date' };
    }

    const maxDays = 30;
    const diffDays = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    if (diffDays > maxDays) {
        return { valid: false, message: `Maximum booking duration is ${maxDays} days` };
    }

    return { valid: true };
};
