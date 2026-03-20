/**
 * Format số tiền theo định dạng VND
 * @param {number} amount - Số tiền cần format
 * @returns {string} Chuỗi đã format (vd: "1.200.000 ₫")
 */
export const formatCurrency = (amount) => {
    if (typeof amount !== 'number' || Number.isNaN(amount)) {
        return '0 ₫'
    }
    return `${amount.toLocaleString('vi-VN')} ₫`
}

/**
 * Format số tiền với đơn vị /đêm
 * @param {number} amount - Số tiền cần format
 * @returns {string} Chuỗi đã format (vd: "1.200.000 ₫/đêm")
 */
export const formatPricePerNight = (amount) => {
    return `${formatCurrency(amount)}/đêm`
}

/**
 * Parse chuỗi giá VND thành số
 * @param {string|number} value - Giá trị cần parse
 * @returns {number} Số đã parse hoặc NaN
 */
export const parsePriceVnd = (value) => {
    if (typeof value === 'number') return value
    if (typeof value !== 'string') return Number(value)
    const numeric = value.replace(/[^\d]/g, '')
    if (!numeric) return Number.NaN
    return Number(numeric)
}

/**
 * Format ngày theo định dạng Việt Nam
 * @param {string|Date} value - Ngày cần format
 * @param {object} options - Tùy chọn format
 * @returns {string} Chuỗi ngày đã format
 */
export const formatDate = (value, options = {}) => {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ''
    
    const defaultOptions = {
        year: 'numeric',
        month: 'long',
        day: '2-digit',
        ...options
    }
    
    return date.toLocaleDateString('vi-VN', defaultOptions)
}

/**
 * Format ngày ngắn gọn (dd/mm/yyyy)
 * @param {string|Date} value - Ngày cần format
 * @returns {string} Chuỗi ngày đã format
 */
export const formatDateShort = (value) => {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ''
    
    return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    })
}

/**
 * Format giờ ngắn gọn (HH:mm)
 * @param {string|Date} value - Thời điểm cần format
 * @returns {string} Chuỗi giờ đã format (vd: "14:30")
 */
export const formatTime = (value) => {
    if (!value) return ''
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ''

    return date.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
    })
}

/**
 * Chuyển Date thành giá trị cho input[type="date"]
 * @param {Date} date - Ngày cần chuyển
 * @returns {string} Chuỗi yyyy-mm-dd
 */
export const toDateInputValue = (date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

/**
 * Tính số đêm giữa 2 ngày
 * @param {string|Date} checkIn - Ngày nhận phòng
 * @param {string|Date} checkOut - Ngày trả phòng
 * @returns {number|null} Số đêm hoặc null nếu không hợp lệ
 */
export const calculateNights = (checkIn, checkOut) => {
    const start = new Date(checkIn)
    const end = new Date(checkOut)
    
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        return null
    }
    
    const diffMs = end.getTime() - start.getTime()
    const nights = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
    
    return nights > 0 ? nights : null
}
