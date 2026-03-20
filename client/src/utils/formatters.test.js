import { describe, it, expect } from 'vitest';
import {
    formatCurrency,
    formatPricePerNight,
    parsePriceVnd,
    formatDate,
    formatDateShort,
    toDateInputValue,
    calculateNights,
} from './formatters.js';

// ============================================================
// formatCurrency
// ============================================================
describe('formatCurrency', () => {
    it('format số dương đúng định dạng VND', () => {
        const result = formatCurrency(1200000);
        expect(result).toContain('₫');
        // Kiểm tra có chứa dấu phân cách hàng nghìn
        expect(result).toMatch(/1.*200.*000/);
    });

    it('trả về "0 ₫" khi input không phải number', () => {
        expect(formatCurrency('abc')).toBe('0 ₫');
        expect(formatCurrency(undefined)).toBe('0 ₫');
        expect(formatCurrency(NaN)).toBe('0 ₫');
    });

    it('format số 0 đúng', () => {
        expect(formatCurrency(0)).toContain('0');
        expect(formatCurrency(0)).toContain('₫');
    });
});

// ============================================================
// formatPricePerNight
// ============================================================
describe('formatPricePerNight', () => {
    it('thêm /đêm sau giá', () => {
        const result = formatPricePerNight(500000);
        expect(result).toContain('₫/đêm');
    });

    it('xử lý số 0', () => {
        const result = formatPricePerNight(0);
        expect(result).toContain('0');
        expect(result).toContain('₫/đêm');
    });

    it('xử lý NaN', () => {
        const result = formatPricePerNight(NaN);
        expect(result).toBe('0 ₫/đêm');
    });
});

// ============================================================
// parsePriceVnd
// ============================================================
describe('parsePriceVnd', () => {
    it('parse chuỗi VND thành số', () => {
        expect(parsePriceVnd('1.200.000 ₫')).toBe(1200000);
        expect(parsePriceVnd('500000')).toBe(500000);
    });

    it('trả về number nếu input là number', () => {
        expect(parsePriceVnd(1200000)).toBe(1200000);
    });

    it('trả về NaN nếu chuỗi rỗng', () => {
        expect(parsePriceVnd('')).toBeNaN();
    });

    it('trả về NaN nếu chuỗi không chứa số', () => {
        expect(parsePriceVnd('abc')).toBeNaN();
    });

    it('chuyển đổi non-string non-number bằng Number()', () => {
        expect(parsePriceVnd(null)).toBe(0);
        expect(parsePriceVnd(true)).toBe(1);
        expect(parsePriceVnd(false)).toBe(0);
    });
});

// ============================================================
// formatDate (full format)
// ============================================================
describe('formatDate', () => {
    it('format date theo locale vi-VN với default options', () => {
        const result = formatDate('2026-03-05');
        expect(result).toBeTruthy();
        // Kết quả chứa năm
        expect(result).toContain('2026');
    });

    it('trả về chuỗi rỗng cho ngày không hợp lệ', () => {
        expect(formatDate('invalid')).toBe('');
    });

    it('chấp nhận custom options', () => {
        const result = formatDate('2026-03-05', { month: '2-digit' });
        expect(result).toBeTruthy();
    });

    it('chấp nhận Date object', () => {
        const result = formatDate(new Date('2026-12-25'));
        expect(result).toContain('2026');
    });
});

// ============================================================
// formatDateShort
// ============================================================
describe('formatDateShort', () => {
    it('format date theo dd/mm/yyyy cho locale vi-VN', () => {
        const result = formatDateShort('2026-03-05');
        expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    });

    it('trả về chuỗi rỗng cho ngày không hợp lệ', () => {
        expect(formatDateShort('invalid')).toBe('');
    });

    it('chấp nhận Date object', () => {
        const result = formatDateShort(new Date('2026-06-15'));
        expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    });
});

// ============================================================
// toDateInputValue
// ============================================================
describe('toDateInputValue', () => {
    it('format Date thành yyyy-mm-dd', () => {
        const date = new Date(2026, 2, 5); // March 5, 2026
        expect(toDateInputValue(date)).toBe('2026-03-05');
    });

    it('pad tháng và ngày một chữ số', () => {
        const date = new Date(2026, 0, 1); // January 1, 2026
        expect(toDateInputValue(date)).toBe('2026-01-01');
    });
});

// ============================================================
// calculateNights
// ============================================================
describe('calculateNights', () => {
    it('tính đúng số đêm', () => {
        expect(calculateNights('2026-03-01', '2026-03-05')).toBe(4);
        expect(calculateNights('2026-01-01', '2026-01-02')).toBe(1);
    });

    it('trả về null cho ngày không hợp lệ', () => {
        expect(calculateNights('invalid', '2026-03-05')).toBeNull();
        expect(calculateNights('2026-03-01', 'invalid')).toBeNull();
    });

    it('trả về null khi checkout <= checkin', () => {
        expect(calculateNights('2026-03-05', '2026-03-01')).toBeNull();
        expect(calculateNights('2026-03-05', '2026-03-05')).toBeNull();
    });
});
