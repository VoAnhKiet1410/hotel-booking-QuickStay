// Upload limits
export const MAX_IMAGES_PER_ROOM = 5
export const MAX_FILE_SIZE_MB = 10

// Pagination
export const DEFAULT_PAGE_SIZE = 12
export const MAX_PAGE_SIZE = 50

// Room status
export const ROOM_STATUS = {
    OPEN: 'open',
    PAUSED: 'paused',
    SOLDOUT: 'soldout',
}

export const ROOM_STATUS_LABELS = {
    [ROOM_STATUS.OPEN]: 'Đang mở đặt phòng',
    [ROOM_STATUS.PAUSED]: 'Tạm dừng nhận đặt phòng',
    [ROOM_STATUS.SOLDOUT]: 'Hết phòng',
}

export const ROOM_STATUS_COLORS = {
    [ROOM_STATUS.OPEN]: {
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
    },
    [ROOM_STATUS.PAUSED]: {
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        border: 'border-amber-200',
    },
    [ROOM_STATUS.SOLDOUT]: {
        bg: 'bg-red-50',
        text: 'text-red-700',
        border: 'border-red-200',
    },
}

// Booking status
export const BOOKING_STATUS = {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    CANCELLED: 'cancelled',
}

export const BOOKING_STATUS_LABELS = {
    [BOOKING_STATUS.PENDING]: 'Chờ xác nhận',
    [BOOKING_STATUS.CONFIRMED]: 'Đã xác nhận',
    [BOOKING_STATUS.CANCELLED]: 'Đã hủy',
}

// Payment methods
export const PAYMENT_METHODS = {
    STRIPE: 'Stripe',
    PAY_AT_HOTEL: 'Pay At Hotel',
}

export const PAYMENT_METHOD_LABELS = {
    [PAYMENT_METHODS.STRIPE]: 'Thanh toán online',
    [PAYMENT_METHODS.PAY_AT_HOTEL]: 'Thanh toán tại khách sạn',
}

// Amenities
export const AMENITY_OPTIONS = [
    { label: 'Wi-Fi miễn phí', value: 'Free WiFi' },
    { label: 'Bữa sáng miễn phí', value: 'Free Breakfast' },
    { label: 'Dịch vụ phòng', value: 'Room Service' },
    { label: 'View núi', value: 'Mountain View' },
    { label: 'Hồ bơi', value: 'Pool Access' },
]

export const AMENITY_LABELS = {
    'Free WiFi': 'Wi-Fi miễn phí',
    'Free Breakfast': 'Bữa sáng miễn phí',
    'Room Service': 'Dịch vụ phòng',
    'Mountain View': 'View núi',
    'Pool Access': 'Hồ bơi',
    'Sea View': 'View biển',
    'Ocean View': 'View đại dương',
}

// Room types
// Room types (suggestions for datalist)
export const ROOM_TYPE_OPTIONS = [
    'Nook',
    'Crash Pad',
    'Salon',
    'Classic Suite',
    'Queen',
    'King',
    'Double',
    'Rooftop Suite',
]

// Room Type Templates Auto-fill
export const ROOM_TEMPLATES = {
    'Nook': {
        capacity: '2',
        bed: '1 Giường Double',
        area: '10',
        description: 'Phòng không gian nhỏ gọn (~10m²) tại Classic Wing nằm ngay sát khu vực sân thượng náo nhiệt (Sky Yard). Phù hợp cho khách thích tiệc tùng chỉ cần tiện nghi thiết yếu ngủ nghỉ. (Lưu ý: Cần chuẩn bị nút bịt tai cho khách).',
    },
    'Crash Pad': {
        capacity: '2',
        bed: '1 Giường Queen',
        area: '16',
        description: 'Trạm nghỉ (~16m²) Không gian riêng tư tại Classic Wing cho cặp đôi/solo, thiết kế táo bạo với vách tắm kính ngay dưới chân giường, tường gạch thô hoặc giấy dán tường art-deco.',
    },
    'Salon': {
        capacity: '2',
        bed: '1 Giường Queen',
        area: '19',
        description: 'Phòng khách (~19m²): Phòng hạng sang tại Classic Wing rộng rãi hơn với đồ gỗ tùy chỉnh và buồng tắm đứng bằng kính nguyên bản.',
    },
    'Classic Suite': {
        capacity: '2',
        bed: '1 Giường Queen',
        area: '35',
        description: 'Suite Cổ điển (~35m²): Căn góc hình chữ L tại Classic Wing mang phong cách mid-century, trang bị khu vực quầy bar và không gian tiếp khách. Được ví như một "phòng khách thu nhỏ" lý tưởng để nghỉ ngơi lâu dài.',
    },
    'Queen': {
        capacity: '2',
        bed: '1 Giường Queen',
        area: '15',
        description: 'Queen (~15m²): Hạng phòng phổ biến nhất tại Modern Wing với tầm nhìn ra đường phố hoặc sân trong, sở hữu góc làm việc/ăn uống và quầy bar mini.',
    },
    'King': {
        capacity: '2',
        bed: '1 Giường King',
        area: '20',
        description: 'King (~20m²): "Ốc đảo riêng tư" tại Modern Wing ngập tràn ánh sáng tự nhiên nhờ cửa sổ lớn, đi kèm đầy đủ quầy bar và tủ đồ ăn vặt.',
    },
    'Double': {
        capacity: '4',
        bed: '2 Giường Queen',
        area: '19',
        description: 'Double (~19m²): Thiết kế tại Modern Wing tối ưu sức chứa cho nhóm 4 người hoặc gia đình có không gian sinh hoạt chung thoải mái.',
    },
    'Rooftop Suite': {
        capacity: '4',
        bed: '1 Giường King + 1 Giường Queen',
        area: '90',
        description: 'Rooftop Suite (~90m²): Penthouse Áp mái xa xỉ nhất hạng Modern Wing với 2 phòng ngủ, rạp hiên sân thượng cực rộng tới 50m² để ngắm hoàng hôn, phòng tắm cẩm thạch và nhà bếp. Tuyệt tác sinh ra để tổ chức tiệc riêng tư.',
    }
}

// Capacity options
export const CAPACITY_OPTIONS = ['1', '2', '3', '4', '5', '6']

// Price ranges for filter
export const PRICE_RANGES = [
    { value: 'lt1200', label: 'Dưới 1.200.000₫/đêm', min: 0, max: 1200000 },
    { value: '1200_1600', label: '1.200.000₫ – 1.600.000₫', min: 1200000, max: 1600000 },
    { value: 'gt1600', label: 'Trên 1.600.000₫/đêm', min: 1600000, max: Infinity },
]

// Sort options
export const SORT_OPTIONS = [
    { value: 'newest', label: 'Mới nhất' },
    { value: 'priceAsc', label: 'Giá thấp đến cao' },
    { value: 'priceDesc', label: 'Giá cao đến thấp' },
]
