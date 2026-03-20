import { describe, it, expect } from 'vitest';
import {
    parsePriceVnd,
    normalizeText,
    hasAmenity,
    isNearCenter,
    isScenicView,
    isFamilyFriendly,
    formatAmenity,
    formatDate,
} from './roomFilters.js';

// ============================================================
// parsePriceVnd
// ============================================================
describe('parsePriceVnd', () => {
    it('parse chuỗi chứa số', () => {
        expect(parsePriceVnd('1.200.000 ₫')).toBe(1200000);
    });

    it('trả về number nếu input là number', () => {
        expect(parsePriceVnd(500000)).toBe(500000);
    });

    it('trả về NaN cho null/undefined', () => {
        expect(parsePriceVnd(null)).toBeNaN();
        expect(parsePriceVnd(undefined)).toBeNaN();
    });

    it('trả về NaN cho chuỗi không chứa số', () => {
        expect(parsePriceVnd('abc')).toBeNaN();
    });

    it('trả về NaN cho Infinity', () => {
        expect(parsePriceVnd(Infinity)).toBeNaN();
    });

    it('trả về NaN cho -Infinity', () => {
        expect(parsePriceVnd(-Infinity)).toBeNaN();
    });

    it('xử lý boolean thông qua Number()', () => {
        // Number(true) = 1, Number.isFinite(1) = true → trả về 1
        expect(parsePriceVnd(true)).toBe(1);
    });

    it('trả về NaN cho object', () => {
        // Number({}) = NaN → trả về NaN
        expect(parsePriceVnd({})).toBeNaN();
    });

    it('parse chuỗi có khoảng trắng', () => {
        expect(parsePriceVnd('  500 000 ')).toBe(500000);
    });
});

// ============================================================
// normalizeText
// ============================================================
describe('normalizeText', () => {
    it('chuyển thành lowercase và bỏ dấu tiếng Việt', () => {
        expect(normalizeText('Hà Nội')).toBe('ha noi');
        expect(normalizeText('Đà Nẵng')).toBe('da nang');
    });

    it('trim whitespace', () => {
        expect(normalizeText('  hello  ')).toBe('hello');
    });

    it('trả về chuỗi rỗng cho non-string', () => {
        expect(normalizeText(null)).toBe('');
        expect(normalizeText(123)).toBe('');
        expect(normalizeText(undefined)).toBe('');
    });
});

// ============================================================
// hasAmenity
// ============================================================
describe('hasAmenity', () => {
    const room = { amenities: ['Free WiFi', 'Pool Access', 'Room Service'] };

    it('trả về true nếu có amenity', () => {
        expect(hasAmenity(room, 'Free WiFi')).toBe(true);
    });

    it('trả về false nếu không có amenity', () => {
        expect(hasAmenity(room, 'Spa')).toBe(false);
    });

    it('xử lý room null/undefined', () => {
        expect(hasAmenity(null, 'Free WiFi')).toBe(false);
        expect(hasAmenity(undefined, 'Free WiFi')).toBe(false);
    });

    it('xử lý room không có amenities', () => {
        expect(hasAmenity({}, 'Free WiFi')).toBe(false);
    });
});

// ============================================================
// isNearCenter
// ============================================================
describe('isNearCenter', () => {
    it('trả về true cho địa chỉ có keyword trung tâm', () => {
        const room = { hotel: { address: 'Trung Tâm Thành Phố', city: 'test' } };
        expect(isNearCenter(room)).toBe(true);
    });

    it('trả về true cho Hoàn Kiếm, Hà Nội', () => {
        const room = { hotel: { address: 'Hoàn Kiếm', city: 'Hà Nội' } };
        expect(isNearCenter(room)).toBe(true);
    });

    it('trả về false cho địa chỉ ngoại ô', () => {
        const room = { hotel: { address: 'Ngoại thành', city: 'Hải Dương' } };
        expect(isNearCenter(room)).toBe(false);
    });

    it('trả về true cho Quận 1', () => {
        const room = { hotel: { address: 'Quận 1, TP.HCM', city: 'HCM' } };
        expect(isNearCenter(room)).toBe(true);
    });

    it('trả về true cho keyword downtown', () => {
        const room = { hotel: { address: 'Downtown area', city: 'test' } };
        expect(isNearCenter(room)).toBe(true);
    });

    it('trả về false khi Hà Nội nhưng không có Hoàn Kiếm', () => {
        const room = { hotel: { address: 'Long Biên', city: 'Hà Nội' } };
        expect(isNearCenter(room)).toBe(false);
    });

    it('xử lý room không có hotel', () => {
        expect(isNearCenter({})).toBe(false);
        expect(isNearCenter({ hotel: {} })).toBe(false);
    });

    it('trả về true cho Quận 3', () => {
        const room = { hotel: { address: 'Quận 3, TP.HCM', city: 'HCM' } };
        expect(isNearCenter(room)).toBe(true);
    });
});

// ============================================================
// isScenicView
// ============================================================
describe('isScenicView', () => {
    it('trả về true khi có amenity Mountain View', () => {
        const room = { amenities: ['Mountain View'], roomType: 'Standard' };
        expect(isScenicView(room)).toBe(true);
    });

    it('trả về true khi roomType chứa "sea view"', () => {
        const room = { amenities: [], roomType: 'Sea View Deluxe' };
        expect(isScenicView(room)).toBe(true);
    });

    it('trả về false cho phòng thường', () => {
        const room = { amenities: ['Free WiFi'], roomType: 'Standard' };
        expect(isScenicView(room)).toBe(false);
    });

    it('trả về true khi roomType chứa "hướng biển" (tiếng Việt)', () => {
        const room = { amenities: [], roomType: 'Phòng hướng biển' };
        expect(isScenicView(room)).toBe(true);
    });

    it('trả về true khi roomType chứa "ocean view"', () => {
        const room = { amenities: [], roomType: 'Ocean View Suite' };
        expect(isScenicView(room)).toBe(true);
    });

    it('xử lý room null/undefined', () => {
        expect(isScenicView(null)).toBe(false);
        expect(isScenicView(undefined)).toBe(false);
    });
});

// ============================================================
// isFamilyFriendly
// ============================================================
describe('isFamilyFriendly', () => {
    it('trả về true khi capacity >= 4', () => {
        expect(isFamilyFriendly({ capacity: 4, roomType: 'Suite' })).toBe(true);
        expect(isFamilyFriendly({ capacity: 6, roomType: 'Suite' })).toBe(true);
    });

    it('trả về true khi roomType chứa "family"', () => {
        expect(isFamilyFriendly({ capacity: 2, roomType: 'Family Room' })).toBe(true);
    });

    it('trả về false cho phòng đơn nhỏ', () => {
        expect(isFamilyFriendly({ capacity: 2, roomType: 'Single' })).toBe(false);
    });

    it('trả về true khi roomType chứa "gia đình"', () => {
        expect(isFamilyFriendly({ capacity: 2, roomType: 'Phòng gia đình' })).toBe(true);
    });

    it('xử lý capacity null/undefined', () => {
        expect(isFamilyFriendly({ roomType: 'Single' })).toBe(false);
        expect(isFamilyFriendly({ capacity: null, roomType: 'Single' })).toBe(false);
    });

    it('xử lý capacity non-finite', () => {
        expect(isFamilyFriendly({ capacity: NaN, roomType: 'Single' })).toBe(false);
    });
});

// ============================================================
// formatAmenity
// ============================================================
describe('formatAmenity', () => {
    it('map đúng amenity sang tiếng Việt', () => {
        expect(formatAmenity('Free WiFi')).toBe('Wi-Fi miễn phí');
        expect(formatAmenity('Free Breakfast')).toBe('Bữa sáng miễn phí');
        expect(formatAmenity('Room Service')).toBe('Dịch vụ phòng');
        expect(formatAmenity('Mountain View')).toBe('View núi');
        expect(formatAmenity('Pool Access')).toBe('Hồ bơi');
    });

    it('trả về nguyên giá trị nếu không có mapping', () => {
        expect(formatAmenity('Spa')).toBe('Spa');
        expect(formatAmenity('Gym')).toBe('Gym');
    });
});

// ============================================================
// formatDate
// ============================================================
describe('formatDate', () => {
    it('format date theo locale vi-VN', () => {
        const result = formatDate('2026-03-05');
        expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    });

    it('trả về chuỗi rỗng cho input falsy', () => {
        expect(formatDate('')).toBe('');
        expect(formatDate(null)).toBe('');
        expect(formatDate(undefined)).toBe('');
    });

    it('trả về chuỗi rỗng cho 0', () => {
        expect(formatDate(0)).toBe('');
    });
});
