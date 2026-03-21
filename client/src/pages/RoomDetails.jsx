import React, { useEffect, useState, useRef, useLayoutEffect } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)
import { useClerk, useUser } from '@clerk/clerk-react'
import {
  assets,
  facilityIcons,
  roomCommonData,
} from '../assets/assets'
import { useAppContext } from '../context/appContextCore'
import { toast } from 'react-hot-toast'
import ReviewSection from '../components/ReviewSection'
import ChatModal from '../components/ChatModal'

const RoomDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { axios } = useAppContext()
  const { openSignIn } = useClerk()
  const { user } = useUser()

  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [isHostImageError, setIsHostImageError] = useState(false)
  const [room, setRoom] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [checkInDate, setCheckInDate] = useState('')
  const [checkOutDate, setCheckOutDate] = useState('')
  const [guests, setGuests] = useState('2')
  const [isBooking, setIsBooking] = useState(false)
  const [couponCode, setCouponCode] = useState('')
  const [couponData, setCouponData] = useState(null)
  const [couponError, setCouponError] = useState('')
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false)
  const [specialRequests, setSpecialRequests] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('payAtHotel')

  const [isChatOpen, setIsChatOpen] = useState(false)
  const [currentConversation, setCurrentConversation] = useState(null)
  const [isInitiatingChat, setIsInitiatingChat] = useState(false)

  const heroRef = useRef(null)
  const infoRef = useRef(null)
  const galleryRef = useRef(null)

  const ownerRoom = location.state?.ownerRoom

  // GSAP Animations
  useLayoutEffect(() => {
    if (isLoading || !room) return

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

      // Gallery images
      if (galleryRef.current) {
        const imgs = galleryRef.current.querySelectorAll('.gallery-item')
        imgs.forEach((img) => {
          gsap.from(img, {
            y: 60,
            opacity: 0,
            duration: 0.9,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: img,
              start: 'top 85%',
            },
          })
        })
      }
    })

    return () => ctx.revert()
  }, [isLoading, room])

  useEffect(() => {
    let cancelled = false

    const fetchRoom = async () => {
      try {
        if (!id) return

        if (ownerRoom?.isDummy) {
          if (!cancelled) {
            setRoom(ownerRoom)
            setIsLoading(false)
          }
          return
        }

        if (!axios) {
          if (!cancelled) {
            setRoom(ownerRoom || null)
            setIsLoading(false)
          }
          return
        }

        setIsLoading(true)
        const { data } = await axios.get(`/api/rooms/${id}`)
        if (cancelled) return
        const serverRoom = data?.data || null
        setRoom(serverRoom || ownerRoom || null)
      } catch {
        if (!cancelled) {
          setRoom(ownerRoom || null)
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    if (ownerRoom && !ownerRoom.isDummy) {
      setRoom(ownerRoom)
      setIsLoading(false)
    }

    fetchRoom()

    return () => {
      cancelled = true
    }
  }, [axios, id, ownerRoom])

  /* ══════════════════════════════════════════════════
     LOADING & ERROR STATES
     ══════════════════════════════════════════════════ */

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

  if (!room) {
    return (
      <div className="min-h-screen bg-[#f0eeea] flex items-center justify-center">
        <div className="text-center">
          <h2 className="font-playfair text-2xl text-gray-800 mb-4">Không tìm thấy phòng</h2>
          <button onClick={() => navigate('/rooms')} className="font-mono text-xs uppercase tracking-[0.15em] border border-gray-800 px-6 py-3 hover:bg-gray-900 hover:text-white transition-all cursor-pointer">
            Quay lại
          </button>
        </div>
      </div>
    )
  }

  /* ══════════════════════════════════════════════════
     HELPERS & COMPUTED VALUES
     ══════════════════════════════════════════════════ */

  const formatAmenity = (amenity) => {
    if (amenity === 'Free WiFi') return 'Wi-Fi miễn phí'
    if (amenity === 'Free Breakfast') return 'Bữa sáng miễn phí'
    if (amenity === 'Room Service') return 'Dịch vụ phòng'
    if (amenity === 'Mountain View') return 'View núi'
    if (amenity === 'Pool Access') return 'Hồ bơi'
    return amenity
  }

  const getStatusBadge = (status) => {
    if (status === 'open') {
      return {
        label: 'Đang mở đặt phòng',
        classes: 'border-emerald-200 bg-emerald-50 text-emerald-700',
      }
    }

    if (status === 'paused') {
      return {
        label: 'Tạm dừng nhận đặt phòng',
        classes: 'border-amber-200 bg-amber-50 text-amber-700',
      }
    }

    return {
      label: 'Hết phòng',
      classes: 'border-red-200 bg-red-50 text-red-700',
    }
  }

  const safeImages = Array.isArray(room.images) ? room.images : []
  const mainImage = safeImages[selectedImageIndex] || safeImages[0]
  const priceText = `${room.pricePerNight.toLocaleString('vi-VN')}₫`
  const roomStatus = room.status || 'open'
  const statusBadge = getStatusBadge(roomStatus)
  const isRoomOpen = roomStatus === 'open'

  const toDateInputValue = (date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const todayInputValue = toDateInputValue(new Date())

  const roomCapacity = Number(room.capacity)
  const maxGuests = Number.isFinite(roomCapacity) && roomCapacity > 0 ? roomCapacity : 4
  const guestValue = String(
    Math.max(1, Math.min(Number(guests) || 1, Math.min(maxGuests, 10))),
  )

  /* ══════════════════════════════════════════════════
     HANDLERS (unchanged logic)
     ══════════════════════════════════════════════════ */

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Vui lòng nhập mã ưu đãi')
      return
    }
    if (!axios) return

    setIsValidatingCoupon(true)
    setCouponError('')
    setCouponData(null)

    try {
      const nights = checkInDate && checkOutDate
        ? Math.ceil((new Date(checkOutDate) - new Date(checkInDate)) / (1000 * 60 * 60 * 24))
        : 1

      const { data } = await axios.post('/api/promotions/validate', {
        code: couponCode.trim(),
        roomId: room._id,
        nights,
      })

      if (data?.success) {
        setCouponData(data.data)
        toast.success(`Áp dụng mã "${data.data.code}" thành công!`)
      }
    } catch (error) {
      const message = error?.response?.data?.message || 'Mã ưu đãi không hợp lệ'
      setCouponError(message)
      setCouponData(null)
    } finally {
      setIsValidatingCoupon(false)
    }
  }

  const handleRemoveCoupon = () => {
    setCouponCode('')
    setCouponData(null)
    setCouponError('')
  }

  // Tính giá preview
  const nightsCount = checkInDate && checkOutDate
    ? Math.max(1, Math.ceil((new Date(checkOutDate) - new Date(checkInDate)) / (1000 * 60 * 60 * 24)))
    : 0
  const subtotal = nightsCount > 0 ? room.pricePerNight * nightsCount : 0
  let discountAmount = 0
  if (couponData && subtotal > 0) {
    discountAmount = couponData.discountType === 'percent'
      ? Math.round(subtotal * couponData.discountValue / 100)
      : Math.min(couponData.discountValue, subtotal)
  }
  const finalTotal = Math.max(0, subtotal - discountAmount)

  const handleBookNow = async () => {
    if (!user) {
      openSignIn()
      return
    }

    if (!axios) {
      toast.error('Không thể kết nối máy chủ, vui lòng thử lại')
      return
    }

    if (!isRoomOpen) {
      toast.error('Phòng hiện không nhận đặt')
      return
    }

    if (!checkInDate || !checkOutDate) {
      toast.error('Vui lòng chọn ngày nhận phòng và trả phòng')
      return
    }

    const start = new Date(checkInDate)
    const end = new Date(checkOutDate)
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
      toast.error('Ngày nhận/trả phòng không hợp lệ')
      return
    }

    setIsBooking(true)
    try {
      const availability = await axios.post('/api/bookings/check-availability', {
        roomId: room._id,
        checkInDate,
        checkOutDate,
      })

      const availabilityData = availability?.data?.data
      if (availability?.data?.success && availabilityData && availabilityData.isAvailable === false) {
        const reason = availabilityData.reason
        if (reason === 'fully_booked') {
          toast.error('❌ Phòng đã hết chỗ trong khoảng thời gian này. Vui lòng chọn ngày khác.')
        } else if (reason === 'room_closed') {
          toast.error('Phòng hiện tạm dừng nhận đặt')
        } else {
          toast.error('Phòng không khả dụng cho thời gian đã chọn')
        }
        return
      }

      const { data } = await axios.post('/api/bookings', {
        roomId: room._id,
        checkInDate,
        checkOutDate,
        guests: Number(guestValue),
        paymentMethod,
        couponCode: couponData ? couponData.code : undefined,
        specialRequests: specialRequests.trim() || undefined,
      })

      if (data?.success) {
        const bookingId = data.data?._id

        // Nếu chọn Stripe → redirect sang trang thanh toán
        if (paymentMethod === 'stripe' && bookingId) {
          try {
            const stripeRes = await axios.post('/api/payments/create-checkout-session', {
              bookingId,
            })
            if (stripeRes.data?.success && stripeRes.data.data?.url) {
              toast.success('Đang chuyển đến trang thanh toán...')
              window.location.href = stripeRes.data.data.url
              return
            }
          } catch {
            // Nếu tạo Stripe session thất bại, vẫn giữ booking → khách tự thanh toán sau
            toast.error('Không thể tạo phiên thanh toán. Bạn có thể thanh toán sau trong "Đặt phòng của tôi".')
          }
        }

        // payAtHotel hoặc Stripe fallback
        toast.success('🎉 Đặt phòng thành công! Đang chờ khách sạn xác nhận.')
        navigate('/my-bookings')
        scrollTo(0, 0)
        return
      }

      toast.error(data?.message || 'Đặt phòng không thành công')
    } catch (error) {
      const serverMsg = error?.response?.data?.message || ''
      // Race condition: phòng vừa hết sau khi check availability
      if (serverMsg.includes('No rooms available') || serverMsg.includes('not available')) {
        toast.error('❌ Phòng vừa được đặt bởi người khác. Vui lòng chọn ngày khác hoặc phòng khác.')
      } else {
        toast.error(serverMsg || 'Không thể đặt phòng, vui lòng thử lại')
      }
    } finally {
      setIsBooking(false)
    }
  }

  const handleContactHost = async () => {
    if (!user) {
      openSignIn()
      return
    }

    const host = room?.hotel?.owner
    if (!host || !host._id) {
      toast.error('Không tìm thấy thông tin chủ nhà')
      return
    }

    if (host._id === user.id) {
      toast.error('Bạn không thể trò chuyện với chính phòng của mình')
      return
    }

    try {
      setIsInitiatingChat(true)
      const { data } = await axios.post('/api/chat/conversations', {
        receiverId: host._id
      })

      if (data.success) {
        setCurrentConversation(data.data)
        setIsChatOpen(true)
      }
    } catch (error) {
      console.error(error)
      toast.error('Đã xảy ra lỗi khi kết nối cuộc trò chuyện')
    } finally {
      setIsInitiatingChat(false)
    }
  }

  /* ══════════════════════════════════════════════════════════
     RENDER — Editorial Layout (Drake-inspired)
     ══════════════════════════════════════════════════════════ */

  return (
    <div className="bg-[#f0eeea] min-h-screen">
      {/* ═══════════════════════════════════════════════════════
          HERO SECTION — Full-width room image
          ═══════════════════════════════════════════════════════ */}
      <section ref={heroRef} className="relative h-[60vh] md:h-[70vh] overflow-hidden">
        <img
          src={mainImage}
          alt={room.roomType}
          className="hero-img w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

        {/* Hero overlay content */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-16 lg:p-24">
          <div className="max-w-7xl mx-auto">
            {/* Hotel badge */}
            <span className="inline-block font-mono text-[10px] uppercase tracking-[0.2em] text-white/80 border border-white/30 px-3 py-1.5 mb-4 backdrop-blur-sm">
              {room.hotel?.name}
            </span>

            {/* Room type — boxed words */}
            <div className="flex flex-wrap gap-[3px] mb-4">
              {`${room.hotel?.wing || 'Modern Wing'} ${room.roomType}`.split(' ').map((word, i) => (
                <span
                  key={i}
                  className="inline-block border-[2.5px] border-white px-3 md:px-4 py-1.5 text-3xl md:text-5xl lg:text-[52px] font-sans font-semibold text-white tracking-[-0.02em] leading-none"
                >
                  {word}
                </span>
              ))}
            </div>

            {/* Location + rating */}
            <div className="flex items-center gap-4 text-white/80">
              <span className="flex items-center gap-1.5">
                <img src={assets.locationIcon} alt="location" className="w-4 h-4 brightness-0 invert" />
                <span className="font-mono text-xs">{room.hotel?.city}</span>
              </span>
              <span className="text-white/40">·</span>
              <span className="flex items-center gap-1">
                {Array.from({ length: 5 }, (_, i) => (
                  <svg key={i} width="14" height="14" viewBox="0 0 15 17" fill="none" xmlns="http://www.w3.org/2000/svg" className="inline-block">
                    <path d="M7.364 1.605a.34.34 0 0 1 .116-.144.3.3 0 0 1 .165-.053q.09.001.166.053.076.054.115.144l1.366 3.12c.09.205.223.382.387.517.165.135.355.222.557.255l3.055.504q.088.015.157.08a.36.36 0 0 1 .096.16q.027.097.006.195a.4.4 0 0 1-.085.168l-2.21 2.425a1.45 1.45 0 0 0-.318.576c-.063.218-.078.45-.043.676l.521 3.427a.4.4 0 0 1-.018.194.35.35 0 0 1-.106.154.28.28 0 0 1-.332.026l-2.73-1.62a1.14 1.14 0 0 0-.584-.162c-.203 0-.404.056-.583.163l-2.73 1.619A.28.28 0 0 1 4 14.055a.35.35 0 0 1-.106-.153.4.4 0 0 1-.018-.194l.52-3.426a1.6 1.6 0 0 0-.043-.677 1.45 1.45 0 0 0-.318-.576l-2.21-2.424a.4.4 0 0 1-.085-.169.4.4 0 0 1 .006-.194.36.36 0 0 1 .096-.162Q1.912 6.016 2 6l3.054-.503a1.2 1.2 0 0 0 .557-.255c.165-.134.298-.312.388-.518z"
                      fill={i < 5 ? '#F8701B' : 'transparent'}
                      stroke={i < 5 ? '#F8701B' : 'rgba(255,255,255,0.7)'}
                      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    />
                  </svg>
                ))}
              </span>
              <span className="font-mono text-xs">{room.hotel?.starRating || 4.8}</span>
              {statusBadge && (
                <>
                  <span className="text-white/40">·</span>
                  <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-semibold ${statusBadge.classes}`}>
                    {statusBadge.label}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Favorite button */}
        <button
          type="button"
          className="absolute right-6 top-6 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-white/10 backdrop-blur-sm transition-all hover:bg-white/90 group"
        >
          <img src={assets.heartIcon} alt="favorite" className="h-5 w-5 brightness-0 invert group-hover:invert-0 transition-all" />
        </button>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SPLIT-SCREEN: Info Left + Gallery/Booking Right
          ═══════════════════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-6 md:px-16 lg:px-24 py-16 md:py-24">
        <div ref={infoRef} className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-10 lg:gap-14">
          {/* ── LEFT COLUMN: Room Info ── */}
          <div className="lg:sticky lg:top-28 self-start">
            {/* Wing label + tagline */}
            <div className="mb-8">
              <div className="w-16 h-[3px] bg-gray-900 mb-6" />
              <div className="flex items-center justify-between mb-6">
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-gray-500">
                  {room.hotel?.wing || 'Modern Wing'}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-gray-500">
                  {room.hotel?.theme || 'Urban Stays'}
                </span>
              </div>

              {/* Room name — boxed words */}
              <div className="flex flex-wrap gap-[3px] mb-8">
                {room.roomType.split(' ').map((word, i) => (
                  <span
                    key={i}
                    className="inline-block border-[2.5px] border-black px-3 md:px-4 py-1.5 text-3xl md:text-5xl lg:text-[52px] font-sans font-semibold text-black tracking-[-0.02em] leading-none"
                  >
                    {word}
                  </span>
                ))}
              </div>
            </div>

            {/* Description */}
            <p className="text-gray-700 leading-relaxed text-base md:text-lg max-w-xl mb-8" style={{ fontStyle: 'italic' }}>
              {room.description || `Không gian được thiết kế ấm cúng, phù hợp cho chuyến đi nghỉ dưỡng hoặc công tác, với tiện nghi hiện đại và đội ngũ hỗ trợ 24/7.`}
            </p>

            {/* Room specs grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
              {room.bed && (
                <div className="border-t border-gray-300 pt-3">
                  <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-gray-400 mb-1">Giường</p>
                  <p className="text-sm font-medium text-gray-900">{room.bed}</p>
                </div>
              )}
              {room.area && (
                <div className="border-t border-gray-300 pt-3">
                  <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-gray-400 mb-1">Diện tích</p>
                  <p className="text-sm font-medium text-gray-900">{room.area}m²</p>
                </div>
              )}
              <div className="border-t border-gray-300 pt-3">
                <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-gray-400 mb-1">Sức chứa</p>
                <p className="text-sm font-medium text-gray-900">{maxGuests} khách</p>
              </div>
              <div className="border-t border-gray-300 pt-3">
                <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-gray-400 mb-1">Giá / đêm</p>
                <p className="text-sm font-medium text-gray-900">{priceText}</p>
              </div>
            </div>

            {/* Amenities */}
            <div className="mb-10">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-4">Tiện nghi</p>
              <div className="flex flex-wrap gap-3">
                {room.amenities.map((amenity) => (
                  <span
                    key={amenity}
                    className="inline-flex items-center gap-2 border border-gray-300 bg-white px-4 py-2 text-xs font-medium text-gray-700"
                  >
                    {facilityIcons[amenity] && (
                      <img src={facilityIcons[amenity]} alt={amenity} className="h-4 w-4" />
                    )}
                    {formatAmenity(amenity)}
                  </span>
                ))}
              </div>
            </div>

            {/* CTA — Book a Room */}
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('booking-card')
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }
              }}
              className="inline-flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.15em] text-gray-900 border-[2px] border-gray-900 px-6 py-3 hover:bg-gray-900 hover:text-white transition-all cursor-pointer group"
            >
              <span>Đặt phòng</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="transition-transform group-hover:translate-x-1">
                <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          {/* ── RIGHT COLUMN: Gallery ── */}
          <div className="space-y-3" ref={galleryRef}>
            {/* Gallery images */}
            {safeImages.slice(0, 4).map((image, index) => (
              <button
                key={`${image}-${index}`}
                type="button"
                onClick={() => setSelectedImageIndex(index)}
                className={`gallery-item group relative w-full overflow-hidden block transition-all ${selectedImageIndex === index
                  ? 'ring-2 ring-gray-900'
                  : 'hover:opacity-90'
                  }`}
              >
                <img
                  src={image}
                  alt={`${room.roomType} ${index + 1}`}
                  className="w-full h-auto transition-transform duration-500 group-hover:scale-105"
                />
                {index === 3 && safeImages.length > 4 && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/45">
                    <p className="text-sm font-semibold text-white">
                      +{safeImages.length - 4} ảnh
                    </p>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          BOOKING CARD SECTION
          ═══════════════════════════════════════════════════════ */}
      <section className="bg-[#ece8e1] py-16 md:py-24" id="booking-card">
        <div className="max-w-7xl mx-auto px-6 md:px-16 lg:px-24">
          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-10 lg:gap-14">
            {/* Left: Room features */}
            <div>
              {/* Section label */}
              <div className="flex flex-wrap gap-[3px] mb-10">
                {`Trải nghiệm tại đây`.split(' ').map((word, i) => (
                  <span
                    key={i}
                    className="inline-block border-[2px] border-black px-2 md:px-3 py-1 text-xl md:text-3xl lg:text-[36px] font-sans font-medium text-black tracking-[-0.02em] leading-none"
                  >
                    {word}
                  </span>
                ))}
              </div>

              <div className="space-y-5">
                {roomCommonData.map((item) => (
                  <div key={item.title} className="flex gap-4 border-b border-gray-300/50 pb-5">
                    <div className="mt-0.5 flex h-10 w-10 items-center justify-center bg-white">
                      <img src={item.icon} alt={item.title} className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                      <p className="mt-1 text-xs text-gray-600">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Cancellation Policy */}
              <div className="mt-8 border border-gray-300 bg-white overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-200 bg-gray-50">
                  <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-gray-500">
                    Chính sách hủy phòng
                  </p>
                </div>
                <div className="divide-y divide-gray-100">
                  {[
                    {
                      when: 'Trước 7+ ngày',
                      refund: '100%',
                      note: 'Hoàn tiền đầy đủ',
                      color: 'text-emerald-600',
                      dot: 'bg-emerald-400',
                    },
                    {
                      when: 'Trước 3–7 ngày',
                      refund: '50%',
                      note: 'Hoàn tiền một phần',
                      color: 'text-amber-600',
                      dot: 'bg-amber-400',
                    },
                    {
                      when: 'Trong vòng 3 ngày',
                      refund: '0%',
                      note: 'Không hoàn tiền',
                      color: 'text-red-500',
                      dot: 'bg-red-400',
                    },
                  ].map((row) => (
                    <div key={row.when} className="flex items-center justify-between px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${row.dot}`} />
                        <span className="text-xs text-gray-600">{row.when}</span>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs font-semibold ${row.color}`}>
                          {row.refund}
                        </span>
                        <span className="ml-1.5 text-[10px] text-gray-400">{row.note}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-5 py-3 border-t border-gray-200 bg-gray-50">
                  <p className="text-[10px] text-gray-400 leading-relaxed">
                    Thời gian tính từ ngày nhận phòng. Hoàn tiền áp dụng cho thanh toán qua Stripe. Thanh toán tại khách sạn không yêu cầu hoàn tiền.
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Booking card */}
            <div className="bg-white border border-gray-200 p-8 h-fit lg:sticky lg:top-28 self-start">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-2">Đặt phòng nhanh</p>
              <p className="font-playfair text-3xl font-semibold text-gray-900">
                {priceText}
                <span className="text-sm font-normal text-gray-500 ml-2">/đêm</span>
              </p>
              <div className="w-full h-px bg-gray-200 my-6" />

              {/* Date inputs */}
              <div className="grid grid-cols-2 gap-3 text-xs mb-4">
                <label className="flex flex-col gap-1.5">
                  <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-gray-400">Nhận phòng</span>
                  <div className="relative">
                    <img src={assets.calenderIcon} alt="calendar" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
                    <input
                      type="date"
                      value={checkInDate}
                      min={todayInputValue}
                      disabled={!isRoomOpen || isBooking}
                      onChange={(e) => {
                        const nextValue = e.target.value
                        setCheckInDate(nextValue)
                        if (checkOutDate) {
                          const start = new Date(nextValue)
                          const end = new Date(checkOutDate)
                          if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && end <= start) {
                            setCheckOutDate('')
                          }
                        }
                      }}
                      className="h-11 w-full border border-gray-200 bg-white pl-10 pr-3 text-xs text-gray-700 outline-none transition-colors focus:border-gray-900 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
                    />
                  </div>
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-gray-400">Trả phòng</span>
                  <div className="relative">
                    <img src={assets.calenderIcon} alt="calendar" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
                    <input
                      type="date"
                      value={checkOutDate}
                      min={checkInDate || todayInputValue}
                      disabled={!isRoomOpen || isBooking}
                      onChange={(e) => setCheckOutDate(e.target.value)}
                      className="h-11 w-full border border-gray-200 bg-white pl-10 pr-3 text-xs text-gray-700 outline-none transition-colors focus:border-gray-900 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
                    />
                  </div>
                </label>
              </div>

              {/* Guests */}
              <label className="flex flex-col gap-1.5 text-xs mb-4">
                <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-gray-400">Số khách</span>
                <div className="relative">
                  <img src={assets.guestsIcon} alt="guests" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
                  <select
                    value={guestValue}
                    disabled={!isRoomOpen || isBooking}
                    onChange={(e) => setGuests(e.target.value)}
                    className="h-11 w-full appearance-none border border-gray-200 bg-white pl-10 pr-10 text-xs text-gray-700 outline-none transition-colors focus:border-gray-900 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
                  >
                    {Array.from({ length: Math.min(maxGuests, 10) }, (_, index) => {
                      const value = String(index + 1)
                      return (
                        <option key={value} value={value}>
                          {value} khách
                        </option>
                      )
                    })}
                  </select>
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                    ▾
                  </span>
                </div>
              </label>

              {/* Coupon */}
              <div className="mb-4">
                <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-gray-400">Mã ưu đãi</span>
                <div className="mt-1.5 flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => {
                      setCouponCode(e.target.value.toUpperCase())
                      setCouponError('')
                    }}
                    disabled={!isRoomOpen || isBooking || !!couponData}
                    placeholder="Nhập mã"
                    className="h-10 flex-1 border border-gray-200 bg-white px-3 text-xs text-gray-700 uppercase tracking-wider outline-none transition-colors focus:border-gray-900 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
                  />
                  {couponData ? (
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="shrink-0 border border-red-300 bg-red-50 px-3 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100"
                    >
                      Hủy
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={!isRoomOpen || isBooking || isValidatingCoupon || !couponCode.trim()}
                      className="shrink-0 bg-gray-900 px-4 text-xs font-semibold text-white transition-all hover:bg-black active:scale-[0.97] disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      {isValidatingCoupon ? 'Đang kiểm...' : 'Áp dụng'}
                    </button>
                  )}
                </div>
                {couponError && (
                  <p className="mt-1.5 text-[11px] text-red-500">{couponError}</p>
                )}
                {couponData && (
                  <div className="mt-2 border border-emerald-200 bg-emerald-50 px-3 py-2">
                    <p className="text-[11px] font-semibold text-emerald-700">
                      ✅ {couponData.title} — Giảm {couponData.discountType === 'percent' ? `${couponData.discountValue}%` : `${couponData.discountValue.toLocaleString('vi-VN')}₫`}
                    </p>
                  </div>
                )}
              </div>

              {/* Yêu cầu đặc biệt */}
              <div className="mb-4">
                <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-gray-400">
                  Yêu cầu đặc biệt
                </span>
                <div className="mt-1.5 relative">
                  <textarea
                    rows={2}
                    maxLength={500}
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    disabled={!isRoomOpen || isBooking}
                    placeholder="Ví dụ: tầng cao, view biển, giường phụ cho trẻ em..."
                    className="w-full resize-none border border-gray-200 bg-white px-3 py-2.5
                               text-xs text-gray-700 outline-none transition-colors leading-relaxed
                               focus:border-gray-900 disabled:cursor-not-allowed
                               disabled:bg-slate-50 disabled:text-slate-400"
                  />
                  <span className="absolute bottom-2 right-2.5 text-[9px] text-gray-300 select-none">
                    {specialRequests.length}/500
                  </span>
                </div>
                <p className="mt-1 text-[10px] text-gray-400 leading-relaxed">
                  Khách sạn sẽ cố gắng đáp ứng nhưng không có gì đảm bảo.
                </p>
              </div>

              {/* Phương thức thanh toán */}
              <div className="mb-4">
                <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-gray-400">
                  Phương thức thanh toán
                </span>
                <div className="mt-1.5 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('payAtHotel')}
                    disabled={!isRoomOpen || isBooking}
                    className={`relative flex flex-col items-center gap-1.5 border p-3 text-center transition-all ${
                      paymentMethod === 'payAtHotel'
                        ? 'border-gray-900 bg-gray-900/[0.03]'
                        : 'border-gray-200 bg-white hover:border-gray-400'
                    } disabled:cursor-not-allowed disabled:opacity-50`}
                  >
                    {paymentMethod === 'payAtHotel' && (
                      <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-gray-900">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </span>
                    )}
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-600">
                      <rect x="2" y="6" width="20" height="12" rx="2"/>
                      <path d="M12 12h.01M8 12h.01M16 12h.01"/>
                    </svg>
                    <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-gray-700">Tiền mặt tại quầy</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('stripe')}
                    disabled={!isRoomOpen || isBooking}
                    className={`relative flex flex-col items-center gap-1.5 border p-3 text-center transition-all ${
                      paymentMethod === 'stripe'
                        ? 'border-gray-900 bg-gray-900/[0.03]'
                        : 'border-gray-200 bg-white hover:border-gray-400'
                    } disabled:cursor-not-allowed disabled:opacity-50`}
                  >
                    {paymentMethod === 'stripe' && (
                      <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-gray-900">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </span>
                    )}
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-indigo-600">
                      <rect x="1" y="4" width="22" height="16" rx="2"/>
                      <path d="M1 10h22"/>
                    </svg>
                    <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-gray-700">Thanh toán online</span>
                  </button>
                </div>
              </div>

              {/* Price preview */}
              {nightsCount > 0 && (
                <div className="border border-gray-200 bg-[#f0eeea] p-3 space-y-2 mb-4">
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>{room.pricePerNight.toLocaleString('vi-VN')}₫ × {nightsCount} đêm</span>
                    <span>{subtotal.toLocaleString('vi-VN')}₫</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-xs text-emerald-600 font-medium">
                      <span>Giảm giá ({couponData.code})</span>
                      <span>-{discountAmount.toLocaleString('vi-VN')}₫</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-gray-300 pt-2 text-sm font-bold text-gray-900">
                    <span>Tổng cộng</span>
                    <span>{finalTotal.toLocaleString('vi-VN')}₫</span>
                  </div>
                </div>
              )}

              {/* Book button */}
              <button
                type="button"
                disabled={!isRoomOpen || isBooking}
                onClick={handleBookNow}
                className="mt-2 w-full inline-flex items-center justify-center gap-3 font-mono text-[11px] uppercase tracking-[0.15em] bg-gray-900 text-white px-6 py-4 hover:bg-black transition-all disabled:cursor-not-allowed disabled:bg-slate-400 group"
              >
                <span>
                  {isBooking
                    ? 'Đang xử lý...'
                    : !isRoomOpen
                      ? 'Tạm dừng nhận đặt phòng'
                      : paymentMethod === 'stripe'
                        ? 'Đặt & Thanh toán online'
                        : 'Đặt phòng ngay'
                  }
                </span>
                {!isBooking && isRoomOpen && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="transition-transform group-hover:translate-x-1">
                    <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>

              <p className="mt-3 text-[11px] leading-relaxed text-gray-500">
                {paymentMethod === 'stripe'
                  ? 'Bạn sẽ được chuyển đến trang thanh toán Stripe an toàn sau khi bấm nút.'
                  : 'Bạn sẽ thanh toán tiền mặt khi nhận phòng tại khách sạn.'
                }
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          HOST SECTION
          ═══════════════════════════════════════════════════════ */}
      <section className="bg-[#f0eeea] py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6 md:px-16 lg:px-24">
          <div className="border border-gray-300 bg-white p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <img
                  src={isHostImageError ? assets.userIcon : (room?.hotel?.owner?.imageUrl || assets.userIcon)}
                  alt={room?.hotel?.owner?.username || 'Chủ nhà'}
                  className="h-14 w-14 rounded-full object-cover border border-gray-200 bg-slate-50"
                  onError={() => setIsHostImageError(true)}
                />
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-gray-400 mb-1">Chủ nhà</p>
                  <p className="text-base font-semibold text-gray-900">
                    {room?.hotel?.owner?.username || 'Đang cập nhật'}
                  </p>
                  <p className="mt-1 text-xs text-gray-600">
                    {room?.hotel?.hostDescription || 'Đã xác minh trên QuickStay · Phản hồi nhanh, thân thiện'}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-600 sm:justify-end">
                <div className="flex items-center gap-1">
                  <svg width="14" height="14" viewBox="0 0 15 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7.364 1.605a.34.34 0 0 1 .116-.144.3.3 0 0 1 .165-.053q.09.001.166.053.076.054.115.144l1.366 3.12c.09.205.223.382.387.517.165.135.355.222.557.255l3.055.504q.088.015.157.08a.36.36 0 0 1 .096.16q.027.097.006.195a.4.4 0 0 1-.085.168l-2.21 2.425a1.45 1.45 0 0 0-.318.576c-.063.218-.078.45-.043.676l.521 3.427a.4.4 0 0 1-.018.194.35.35 0 0 1-.106.154.28.28 0 0 1-.332.026l-2.73-1.62a1.14 1.14 0 0 0-.584-.162c-.203 0-.404.056-.583.163l-2.73 1.619A.28.28 0 0 1 4 14.055a.35.35 0 0 1-.106-.153.4.4 0 0 1-.018-.194l.52-3.426a1.6 1.6 0 0 0-.043-.677 1.45 1.45 0 0 0-.318-.576l-2.21-2.424a.4.4 0 0 1-.085-.169.4.4 0 0 1 .006-.194.36.36 0 0 1 .096-.162Q1.912 6.016 2 6l3.054-.503a1.2 1.2 0 0 0 .557-.255c.165-.134.298-.312.388-.518z"
                      fill="#F8701B" stroke="#F8701B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    />
                  </svg>
                  <span>4.9 điểm đánh giá</span>
                </div>
                <span>100% tỷ lệ phản hồi</span>
                <span>Thường trả lời trong 1 giờ</span>
                <button
                  type="button"
                  onClick={handleContactHost}
                  disabled={isInitiatingChat}
                  className="inline-flex items-center justify-center font-mono text-[11px] uppercase tracking-[0.15em] border border-gray-900 px-5 py-2.5 text-gray-900 transition-all hover:bg-gray-900 hover:text-white active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isInitiatingChat ? 'Đang kết nối...' : 'Liên hệ đặt phòng'}
                </button>
              </div>
            </div>
          </div>

          {/* Map / Location info */}
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
            <div className="border border-gray-300 bg-white overflow-hidden">
              <div className="h-56 w-full bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.15),_transparent_60%),radial-gradient(circle_at_bottom,_rgba(251,191,36,0.12),_transparent_60%)]" />
            </div>
            <div className="border border-gray-300 bg-white p-6 flex flex-col justify-center">
              <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-gray-400 mb-2">Địa chỉ</p>
              <div className="flex items-start gap-2 text-sm text-gray-700">
                <img src={assets.locationFilledIcon} alt="location" className="h-4 w-4 mt-0.5" />
                <span>{room.hotel?.address}</span>
              </div>
              <p className="mt-4 text-xs text-gray-500 leading-relaxed">
                Vị trí gần trung tâm, thuận tiện di chuyển đến các điểm tham quan, nhà hàng và khu mua sắm nổi bật.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          REVIEWS
          ═══════════════════════════════════════════════════════ */}
      <section className="bg-[#f0eeea] pb-16">
        <div className="max-w-7xl mx-auto px-6 md:px-16 lg:px-24">
          <ReviewSection roomId={room._id} />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          BACK NAVIGATION
          ═══════════════════════════════════════════════════════ */}
      <section className="bg-[#ece8e1] py-16">
        <div className="max-w-7xl mx-auto px-6 md:px-16 lg:px-24 text-center">
          <button
            onClick={() => navigate(-1)}
            className="font-mono text-[11px] uppercase tracking-[0.15em] text-gray-700 border border-gray-800 px-8 py-3 hover:bg-gray-900 hover:text-white transition-all cursor-pointer"
          >
            ← Quay lại
          </button>
        </div>
      </section>

      {/* Chat Modal */}
      {isChatOpen && currentConversation && (
        <ChatModal
          conversation={currentConversation}
          onClose={() => setIsChatOpen(false)}
        />
      )}
    </div>
  )
}

export default RoomDetails
