import React from 'react'
import { useNavigate } from 'react-router-dom'
import { parsePriceVnd, formatAmenity } from '../utils/roomFilters'

const RoomCard = ({ room, searchCheckIn, searchCheckOut, searchGuests }) => {
    const navigate = useNavigate()
    const price = parsePriceVnd(room?.pricePerNight)
    const priceLabel = Number.isFinite(price) ? `${price.toLocaleString('vi-VN')}₫` : 'Liên hệ'

    const navigateToRoom = () => {
        const params = new URLSearchParams()
        if (searchCheckIn) params.set('checkIn', searchCheckIn)
        if (searchCheckOut) params.set('checkOut', searchCheckOut)
        if (searchGuests) params.set('guests', searchGuests.toString())
        const queryStr = params.toString()
        navigate(`/rooms/${room._id}${queryStr ? `?${queryStr}` : ''}`)
        scrollTo(0, 0)
    }

    const roomMeta = {
        capacity: room?.capacity || 2,
        type: room?.roomType || 'Phòng tiêu chuẩn',
        bed: room?.bed || 'Giường đôi',
        area: room?.area || '30',
        description: room?.description || `Tại ${room?.hotel?.name || ''} — ${(room?.amenities || []).slice(0, 3).map(a => formatAmenity(a)).join(', ')}.`,
        wing: room?.wing || ''
    }

    // Vietnamese labels
    const capacityText = `TỐI ĐA ${roomMeta.capacity} KHÁCH`
    const bedText = roomMeta.bed.toUpperCase()
    const areaText = `${roomMeta.area} M²`

    return (
        <div className="group cursor-pointer h-full flex flex-col" onClick={navigateToRoom}>
            {/* Image — full bleed, no border-radius like Image 1 */}
            <div className="overflow-hidden relative aspect-[4/3] w-full">
                <img
                    src={room?.images?.[0] || 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?q=80&w=800'}
                    alt={roomMeta.type}
                    className="w-full h-[110%] object-cover transition-transform duration-[1.2s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.05]"
                />
            </div>

            {/* Title — sits directly below the image on the bg, not in a white box */}
            <h3 className="font-sans text-[22px] md:text-[26px] font-normal text-black tracking-tight leading-none mt-5 mb-3">
                {roomMeta.type}
            </h3>

            {/* Thin black divider — full width */}
            <div className="w-full h-[0.8px] bg-black/80 mb-4" />

            {/* Two-column info with vertical separator */}
            <div className="flex-1 grid grid-cols-[1fr_1px_1fr] gap-0">
                {/* Left column — Specs */}
                <div className="pr-4 flex flex-col justify-between">
                    <div className="font-mono text-[8.5px] uppercase tracking-[0.12em] text-black/80 leading-[1.7] space-y-[2px]">
                        <p>{capacityText}</p>
                        <p>{bedText}</p>
                        <p>{areaText}</p>
                        <p>1 PHÒNG TẮM</p>
                        {price > 0 && (
                            <p className="!mt-1 font-bold text-black">{priceLabel}/ĐÊM</p>
                        )}
                    </div>

                    {/* VIEW button — rect + circle combo matching the Drake design */}
                    <div className="flex items-center mt-5 mb-1">
                        <button
                            className="border border-black px-4 py-[6px] font-mono text-[9px] uppercase tracking-[0.15em] font-semibold text-black group-hover:bg-black group-hover:text-white transition-colors duration-300 leading-none cursor-pointer"
                            onClick={(e) => { e.stopPropagation(); navigateToRoom(); }}
                        >
                            XEM
                        </button>
                        <button
                            className="w-[30px] h-[30px] rounded-full border border-black flex items-center justify-center -ml-[1px] bg-transparent group-hover:bg-black group-hover:text-white transition-colors duration-300 cursor-pointer"
                            onClick={(e) => { e.stopPropagation(); navigateToRoom(); }}
                        >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Vertical separator */}
                <div className="bg-black/25 w-full h-full" />

                {/* Right column — Description */}
                <div className="pl-4 font-mono text-[8.5px] uppercase tracking-[0.06em] text-black/75 leading-[1.7]">
                    <p className="line-clamp-7">
                        {roomMeta.description}
                    </p>
                </div>
            </div>
        </div>
    )
}

export default RoomCard
