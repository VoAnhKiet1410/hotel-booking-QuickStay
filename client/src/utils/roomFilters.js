// Room filter & utility functions — tách từ AllRooms.jsx

export const parsePriceVnd = (value) => {
    if (value == null) return Number.NaN
    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : Number.NaN
    }
    if (typeof value === 'string') {
        const numeric = value.replace(/[^\d]/g, '')
        if (!numeric) return Number.NaN
        const parsed = Number(numeric)
        return Number.isFinite(parsed) ? parsed : Number.NaN
    }
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : Number.NaN
}

export const normalizeText = (value) => {
    if (typeof value !== 'string') return ''
    return value
        .toLowerCase()
        .replace(/đ/g, 'd')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
}

export const hasAmenity = (room, amenityValue) => {
    const items = Array.isArray(room?.amenities) ? room.amenities : []
    return items.some((item) => item === amenityValue)
}

export const isNearCenter = (room) => {
    const address = normalizeText(room?.hotel?.address)
    const city = normalizeText(room?.hotel?.city)
    const keywords = ['trung tam', 'center', 'downtown', 'hoan kiem', 'quan 1', 'quan 3']
    const matchesKeyword = keywords.some((kw) => address.includes(kw))
    if (matchesKeyword) return true
    if (city.includes('ha noi')) return address.includes('hoan kiem')
    return false
}

export const isScenicView = (room) => {
    if (hasAmenity(room, 'Mountain View')) return true
    const roomType = normalizeText(room?.roomType)
    const phrases = ['huong bien', 'view bien', 'sea view', 'ocean view', 'beach', 'huong nui', 'view nui', 'mountain view']
    return phrases.some((p) => roomType.includes(p))
}

export const isFamilyFriendly = (room) => {
    const capacity = Number(room?.capacity)
    if (Number.isFinite(capacity) && capacity >= 4) return true
    const roomType = normalizeText(room?.roomType)
    return roomType.includes('gia dinh') || roomType.includes('family')
}

export const formatAmenity = (amenity) => {
    const map = {
        'Free WiFi': 'Wi-Fi miễn phí',
        'Free Breakfast': 'Bữa sáng miễn phí',
        'Room Service': 'Dịch vụ phòng',
        'Mountain View': 'View núi',
        'Pool Access': 'Hồ bơi',
    }
    return map[amenity] || amenity
}

export const formatDate = (dateStr) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
