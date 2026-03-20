import React, { useEffect, useMemo, useState, useRef, useLayoutEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useAppContext } from '../context/appContextCore'
import { assets } from '../assets/assets'
import { parsePriceVnd, formatAmenity } from '../utils/roomFilters'
import RoomCard from '../components/RoomCard'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const HotelDetails = () => {
    const { hotelId } = useParams()
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const { axios } = useAppContext()

    const [hotel, setHotel] = useState(null)
    const [rooms, setRooms] = useState([])
    const [isLoading, setIsLoading] = useState(true)

    const heroRef = useRef(null)
    const infoRef = useRef(null)
    const roomsRef = useRef(null)
    const cardRefs = useRef([])

    const searchCheckIn = searchParams.get('checkIn') || ''
    const searchCheckOut = searchParams.get('checkOut') || ''
    const searchGuests = parseInt(searchParams.get('guests')) || 0

    const _numberOfNights = useMemo(() => {
        if (!searchCheckIn || !searchCheckOut) return 0
        const diff = new Date(searchCheckOut) - new Date(searchCheckIn)
        return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
    }, [searchCheckIn, searchCheckOut])

    // Fetch hotel and rooms from API
    useEffect(() => {
        let cancelled = false
        const fetchData = async () => {
            if (!cancelled) setIsLoading(true)
            try {
                const backendUrl = import.meta.env.VITE_BACKEND_URL || ''
                const { data } = await (axios || { get: (u) => fetch(`${backendUrl}${u}`).then(r => r.json()).then(d => ({ data: d })) }).get(`/api/hotels/${hotelId}`)
                if (cancelled) return
                if (data?.success && data.data) {
                    const hotelData = data.data
                    const hotelRooms = hotelData.rooms || []
                    const { rooms: _, ...hotelOnly } = hotelData
                    setHotel(hotelOnly)
                    setRooms(hotelRooms)
                }
            } catch (err) {
                if (!cancelled) console.log('Failed to fetch hotel:', err)
            } finally {
                if (!cancelled) setIsLoading(false)
            }
        }

        fetchData()
        return () => { cancelled = true }
    }, [hotelId, axios])

    // GSAP Animations
    useLayoutEffect(() => {
        if (isLoading || !hotel) return

        const ctx = gsap.context(() => {
            // Hero parallax
            const heroImg = heroRef.current?.querySelector('.hero-img')
            if (heroImg) {
                gsap.to(heroImg, {
                    yPercent: 15,
                    ease: 'none',
                    scrollTrigger: {
                        trigger: heroRef.current,
                        start: 'top top',
                        end: 'bottom top',
                        scrub: true,
                    },
                })
            }

            // Info reveal
            if (infoRef.current) {
                gsap.from(infoRef.current.children, {
                    y: 40,
                    opacity: 0,
                    duration: 1,
                    stagger: 0.15,
                    ease: 'power3.out',
                })
            }

            // Room cards stagger
            cardRefs.current.forEach((card) => {
                if (!card) return
                gsap.from(card, {
                    y: 60,
                    opacity: 0,
                    duration: 0.9,
                    ease: 'power3.out',
                    scrollTrigger: {
                        trigger: card,
                        start: 'top 85%',
                    },
                })
            })
        })

        return () => ctx.revert()
    }, [isLoading, hotel, rooms])

    // Min price for display
    const minPrice = useMemo(() => {
        if (!rooms.length) return 0
        return Math.min(...rooms.map(r => parsePriceVnd(r.pricePerNight) || Infinity))
    }, [rooms])

    const renderStars = (rating) => {
        const full = Math.floor(rating)
        const stars = []
        for (let i = 0; i < 5; i++) {
            const filled = i < full
            stars.push(
                <svg
                    key={i}
                    width="16"
                    height="16"
                    viewBox="0 0 15 17"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="inline-block"
                >
                    <path
                        d="M7.364 1.605a.34.34 0 0 1 .116-.144.3.3 0 0 1 .165-.053q.09.001.166.053.076.054.115.144l1.366 3.12c.09.205.223.382.387.517.165.135.355.222.557.255l3.055.504q.088.015.157.08a.36.36 0 0 1 .096.16q.027.097.006.195a.4.4 0 0 1-.085.168l-2.21 2.425a1.45 1.45 0 0 0-.318.576c-.063.218-.078.45-.043.676l.521 3.427a.4.4 0 0 1-.018.194.35.35 0 0 1-.106.154.28.28 0 0 1-.332.026l-2.73-1.62a1.14 1.14 0 0 0-.584-.162c-.203 0-.404.056-.583.163l-2.73 1.619A.28.28 0 0 1 4 14.055a.35.35 0 0 1-.106-.153.4.4 0 0 1-.018-.194l.52-3.426a1.6 1.6 0 0 0-.043-.677 1.45 1.45 0 0 0-.318-.576l-2.21-2.424a.4.4 0 0 1-.085-.169.4.4 0 0 1 .006-.194.36.36 0 0 1 .096-.162Q1.912 6.016 2 6l3.054-.503a1.2 1.2 0 0 0 .557-.255c.165-.134.298-.312.388-.518z"
                        fill={filled ? '#F8701B' : 'transparent'}
                        stroke={filled ? '#F8701B' : 'rgba(255,255,255,0.7)'}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            )
        }
        return stars
    }


    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#f0eeea] flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-9 w-9 rounded-full border-2 border-slate-300 border-t-gray-900 animate-spin" />
                    <p className="text-xs font-medium tracking-[0.2em] text-gray-500">ĐANG TẢI</p>
                </div>
            </div>
        )
    }

    if (!hotel) {
        return (
            <div className="min-h-screen bg-[#f0eeea] flex items-center justify-center">
                <div className="text-center">
                    <h2 className="font-playfair text-2xl text-gray-800 mb-4">Không tìm thấy khách sạn</h2>
                    <button onClick={() => navigate('/rooms')} className="font-mono text-xs uppercase tracking-[0.15em] border border-gray-800 px-6 py-3 hover:bg-gray-900 hover:text-white transition-all cursor-pointer">
                        Quay lại
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-[#f0eeea] min-h-screen">
            {/* ═══════════════════════════════════════════════════════
          HERO SECTION
          ═══════════════════════════════════════════════════════ */}
            <section ref={heroRef} className="relative h-[60vh] md:h-[70vh] overflow-hidden">
                <img
                    src={hotel.images?.[0] || assets.heroImage}
                    alt={hotel.name}
                    className="hero-img w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-16 lg:p-24">
                    <div className="max-w-7xl mx-auto">
                        {/* Theme badge */}
                        <span className="inline-block font-mono text-[10px] uppercase tracking-[0.2em] text-white/80 border border-white/30 px-3 py-1.5 mb-4 backdrop-blur-sm">
                            {hotel.theme} · {hotel.wing}
                        </span>
                        <h1 className="font-playfair text-3xl md:text-5xl lg:text-6xl text-white font-normal tracking-tight leading-[1.1]">
                            {hotel.name}
                        </h1>
                        <div className="flex items-center gap-4 mt-4 text-white/80">
                            <span className="flex items-center gap-1.5">
                                <img src={assets.locationIcon} alt="location" className="w-4 h-4 brightness-0 invert" />
                                <span className="font-mono text-xs">{hotel.city}</span>
                            </span>
                            <span className="text-white/40">·</span>
                            <span className="flex items-center gap-1">{renderStars(hotel.starRating || 4.5)}</span>
                            <span className="font-mono text-xs">{hotel.starRating || 4.5}</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════
          HOTEL INFO SECTION
          ═══════════════════════════════════════════════════════ */}
            <section className="max-w-7xl mx-auto px-6 md:px-16 lg:px-24 py-16 md:py-24">
                <div ref={infoRef} className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-12 lg:gap-20">
                    {/* Left: Description */}
                    <div>
                        <h2 className="font-playfair text-2xl md:text-3xl text-gray-900 tracking-tight mb-6">
                            Về khu vực này
                        </h2>
                        <p className="text-gray-600 leading-relaxed text-base md:text-lg">
                            {hotel.regionDescription}
                        </p>
                        <div className="mt-8 flex flex-wrap gap-3">
                            {(hotel.amenities || ['Free WiFi', 'Room Service', 'Pool Access']).map(amenity => (
                                <span key={amenity} className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2 text-xs font-medium text-gray-700">
                                    {formatAmenity(amenity)}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Right: Quick Info Card */}
                    <div className="bg-white border border-gray-200 p-8 h-fit">
                        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-2">Giá từ</p>
                        <p className="font-playfair text-3xl font-semibold text-gray-900">
                            {minPrice > 0 ? `${minPrice.toLocaleString('vi-VN')}₫` : 'Liên hệ'}
                            <span className="text-sm font-normal text-gray-500 ml-2">/đêm</span>
                        </p>
                        <div className="w-full h-px bg-gray-200 my-6" />
                        <div className="space-y-4 text-sm text-gray-600">
                            <div className="flex items-start gap-6">
                                <span className="shrink-0 whitespace-nowrap">Địa chỉ</span>
                                <span className="flex-1 min-w-0 text-right font-medium text-gray-800">{hotel.address}</span>
                            </div>
                            <div className="flex items-center gap-6">
                                <span className="shrink-0 whitespace-nowrap">Liên hệ</span>
                                <span className="flex-1 min-w-0 text-right font-medium text-gray-800">{hotel.contact}</span>
                            </div>
                            <div className="flex items-center gap-6">
                                <span className="shrink-0 whitespace-nowrap">Phong cách</span>
                                <span className="flex-1 min-w-0 text-right font-medium text-gray-800">{hotel.wing}</span>
                            </div>
                            <div className="flex items-center gap-6">
                                <span className="shrink-0 whitespace-nowrap">Số loại phòng</span>
                                <span className="flex-1 min-w-0 text-right font-medium text-gray-800">{rooms.length}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════
          ROOMS LISTING
          ═══════════════════════════════════════════════════════ */}
            <section ref={roomsRef} className="bg-[#ece8e1] py-16 md:py-24">
                <div className="max-w-7xl mx-auto px-6 md:px-16 lg:px-24">
                    {/* Wing Label */}
                    <div className="flex flex-wrap gap-[3px] mb-10">
                        {(hotel.wing || 'Modern Wing').split(' ').map((word, i) => (
                            <span
                                key={i}
                                className="inline-block border-[2.5px] border-black px-3 md:px-4 py-1.5 text-3xl md:text-5xl lg:text-[52px] font-sans font-semibold text-black tracking-[-0.02em] leading-none"
                            >
                                {word}
                            </span>
                        ))}
                    </div>

                    {/* Section Subtitle */}
                    <div className="mb-14">
                        <div className="flex flex-wrap gap-[3px]">
                            {`Các phòng tại ${hotel.name}`.split(' ').map((word, i) => (
                                <span
                                    key={i}
                                    className="wing-word inline-block border-[2px] border-black px-2 md:px-3 py-1 text-xl md:text-3xl lg:text-[36px] font-sans font-medium text-black tracking-[-0.02em] leading-none"
                                >
                                    {word}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Room Cards Grid matching Image 1 */}
                    {rooms.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
                            {rooms.map((room, index) => (
                                <React.Fragment key={room._id}>
                                    {/* Insert Quote Card at the 4th position if there are >3 rooms */}
                                    {index === 3 && (
                                        <div className="bg-[#b5add4] rounded-t-[500px] rounded-b-none px-6 md:px-10 pt-16 pb-12 flex flex-col justify-end text-black h-full min-h-[450px]">
                                            <div className="flex-1 flex items-center justify-center mb-8">
                                                <svg width="120" height="120" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-90">
                                                    <rect x="25" y="30" width="30" height="45" rx="5" transform="rotate(-20 25 30)" stroke="black" strokeWidth="2.5" fill="none" />
                                                    <rect x="40" y="35" width="30" height="45" rx="5" transform="rotate(10 40 35)" stroke="black" strokeWidth="2.5" fill="none" />
                                                    <path d="M75 25 C70 20, 80 15, 80 25 C85 20, 85 30, 80 30 C85 35, 75 35, 75 30 C70 35, 65 30, 70 25 C65 20, 70 15, 75 25 Z" stroke="black" strokeWidth="2.5" fill="none" />
                                                    <path d="M85 70 C80 65, 90 60, 90 70 C95 65, 95 75, 90 75 C95 80, 85 80, 85 75 C80 80, 75 75, 80 70 C75 65, 80 60, 85 70 Z" stroke="black" strokeWidth="2.5" fill="none" />
                                                    <path d="M30 80 Q 40 90 50 85 T 70 95" stroke="black" strokeWidth="2.5" fill="none" />
                                                </svg>
                                            </div>
                                            <div>
                                                <h3 className="text-lg md:text-xl font-sans font-medium leading-[1.3] tracking-normal mb-6 text-black">
                                                    “Nửa khách sạn, nửa không gian triển lãm, nửa quán cà phê và nhà hàng — QuickStay là nơi tuyệt vời nhất để nghỉ lại, theo ý kiến của chúng tôi.”
                                                </h3>
                                                <p className="font-mono text-[9px] uppercase tracking-[0.15em] font-bold">
                                                    CONDÉ NAST
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Standard Room Card */}
                                    <div ref={(el) => { cardRefs.current[index] = el }} className="h-full">
                                        <RoomCard
                                            room={room}
                                            searchCheckIn={searchCheckIn}
                                            searchCheckOut={searchCheckOut}
                                            searchGuests={searchGuests}
                                        />
                                    </div>
                                </React.Fragment>
                            ))}

                            {/* Append Quote Card at the 4th position if there are 3 or fewer rooms */}
                            {rooms.length <= 3 && (
                                <div className="bg-[#b5add4] rounded-t-[500px] rounded-b-none px-6 md:px-10 pt-16 pb-12 flex flex-col justify-end text-black h-full min-h-[450px]">
                                    <div className="flex-1 flex items-center justify-center mb-8">
                                        <svg width="120" height="120" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-90">
                                            <rect x="25" y="30" width="30" height="45" rx="5" transform="rotate(-20 25 30)" stroke="black" strokeWidth="2.5" fill="none" />
                                            <rect x="40" y="35" width="30" height="45" rx="5" transform="rotate(10 40 35)" stroke="black" strokeWidth="2.5" fill="none" />
                                            <path d="M75 25 C70 20, 80 15, 80 25 C85 20, 85 30, 80 30 C85 35, 75 35, 75 30 C70 35, 65 30, 70 25 C65 20, 70 15, 75 25 Z" stroke="black" strokeWidth="2.5" fill="none" />
                                            <path d="M85 70 C80 65, 90 60, 90 70 C95 65, 95 75, 90 75 C95 80, 85 80, 85 75 C80 80, 75 75, 80 70 C75 65, 80 60, 85 70 Z" stroke="black" strokeWidth="2.5" fill="none" />
                                            <path d="M30 80 Q 40 90 50 85 T 70 95" stroke="black" strokeWidth="2.5" fill="none" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-lg md:text-xl font-sans font-medium leading-[1.3] tracking-normal mb-6 text-black">
                                            “Nửa khách sạn, nửa không gian triển lãm, nửa quán cà phê và nhà hàng — QuickStay là nơi tuyệt vời nhất để nghỉ lại, theo ý kiến của chúng tôi.”
                                        </h3>
                                        <p className="font-mono text-[9px] uppercase tracking-[0.15em] font-bold">
                                            CONDÉ NAST
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="border border-gray-300 bg-white p-8 text-center">
                            <p className="text-gray-500 text-sm">Hiện chưa có phòng nào tại khách sạn này.</p>
                        </div>
                    )}
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════
          BACK NAVIGATION
          ═══════════════════════════════════════════════════════ */}
            <section className="bg-[#f0eeea] py-16">
                <div className="max-w-7xl mx-auto px-6 md:px-16 lg:px-24 text-center">
                    <button
                        onClick={() => navigate('/rooms')}
                        className="font-mono text-[11px] uppercase tracking-[0.15em] text-gray-700 border border-gray-800 px-8 py-3 hover:bg-gray-900 hover:text-white transition-all cursor-pointer"
                    >
                        ← Xem tất cả khách sạn
                    </button>
                </div>
            </section>
        </div>
    )
}

export default HotelDetails
