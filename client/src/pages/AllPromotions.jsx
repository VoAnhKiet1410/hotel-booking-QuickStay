import React, { useEffect, useState, useRef, useLayoutEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser, useClerk } from '@clerk/clerk-react'
import { useAppContext } from '../context/appContextCore'
import { exclusiveOffers as fallbackOffers } from '../assets/assets'
import { toast } from 'react-hot-toast'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const CATEGORY_LABELS = {
    family: 'Gia đình',
    couple: 'Cặp đôi',
    luxury: 'Cao cấp',
    earlybird: 'Đặt sớm',
    seasonal: 'Theo mùa',
    other: 'Ưu đãi',
}

const CountdownTimer = ({ validTo }) => {
    const [timeLeft, setTimeLeft] = useState(() => calcTimeLeft(validTo))

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(calcTimeLeft(validTo))
        }, 60_000)
        return () => clearInterval(timer)
    }, [validTo])

    if (!timeLeft) return <span className="font-mono text-[10px] text-white/50 uppercase tracking-wider">Đã hết hạn</span>

    return (
        <span className="font-mono text-[10px] text-white/60 uppercase tracking-wider">
            Còn {timeLeft.days > 0 ? `${timeLeft.days} ngày ` : ''}{timeLeft.hours}h {timeLeft.minutes}p
        </span>
    )
}

function calcTimeLeft(validTo) {
    const diff = new Date(validTo) - new Date()
    if (diff <= 0) return null
    return {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
    }
}

const ProgressBar = ({ usedCount, maxUses }) => {
    if (!maxUses) return null
    const percent = Math.min(100, Math.round((usedCount / maxUses) * 100))
    const remaining = maxUses - usedCount

    return (
        <div className="mt-3">
            <div className="h-px w-full bg-white/20 overflow-hidden">
                <div
                    className="h-full bg-white/70 transition-all duration-500"
                    style={{ width: `${percent}%` }}
                />
            </div>
            <p className="font-mono text-[9px] text-white/40 mt-1.5 uppercase tracking-wider">
                Còn {remaining} lượt · Đã dùng {percent}%
            </p>
        </div>
    )
}

const AllPromotions = () => {
    const navigate = useNavigate()
    const { axios } = useAppContext()
    const { user } = useUser()
    const { openSignIn } = useClerk()
    const [promotions, setPromotions] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [claimingId, setClaimingId] = useState(null)
    const gridRef = useRef(null)

    useEffect(() => {
        window.scrollTo(0, 0)
        const fetchPromotions = async () => {
            if (!axios) {
                setPromotions(fallbackOffers.map((item, i) => ({
                    _id: item._id,
                    title: item.title,
                    description: item.description,
                    discountValue: item.priceOff,
                    discountType: 'percent',
                    validTo: new Date(Date.now() + (30 + i * 10) * 24 * 60 * 60 * 1000).toISOString(),
                    image: item.image,
                    maxUses: 100,
                    usedCount: Math.floor(Math.random() * 60) + 20,
                    category: ['seasonal', 'couple', 'luxury'][i],
                    couponCode: `DEMO${item.priceOff}`,
                    hotel: { name: 'QuickStay', city: 'Hà Nội' },
                    isFallback: true,
                })))
                setIsLoading(false)
                return
            }

            try {
                const { data } = await axios.get('/api/promotions')
                if (data?.success && data.data?.length > 0) {
                    setPromotions(data.data)
                } else {
                    setPromotions(fallbackOffers.map((item, i) => ({
                        _id: item._id,
                        title: item.title,
                        description: item.description,
                        discountValue: item.priceOff,
                        discountType: 'percent',
                        validTo: new Date(Date.now() + (30 + i * 10) * 24 * 60 * 60 * 1000).toISOString(),
                        image: item.image,
                        maxUses: 100,
                        usedCount: Math.floor(Math.random() * 60) + 20,
                        category: ['seasonal', 'couple', 'luxury'][i],
                        couponCode: `DEMO${item.priceOff}`,
                        hotel: { name: 'QuickStay', city: 'Hà Nội' },
                        isFallback: true,
                    })))
                }
            } catch {
                setPromotions(fallbackOffers.map((item, i) => ({
                    _id: item._id,
                    title: item.title,
                    description: item.description,
                    discountValue: item.priceOff,
                    discountType: 'percent',
                    validTo: new Date(Date.now() + (30 + i * 10) * 24 * 60 * 60 * 1000).toISOString(),
                    image: item.image,
                    maxUses: 100,
                    usedCount: Math.floor(Math.random() * 60) + 20,
                    category: ['seasonal', 'couple', 'luxury'][i],
                    couponCode: `DEMO${item.priceOff}`,
                    hotel: { name: 'QuickStay', city: 'Hà Nội' },
                    isFallback: true,
                })))
            } finally {
                setIsLoading(false)
            }
        }

        fetchPromotions()
    }, [axios])

    useLayoutEffect(() => {
        if (isLoading || promotions.length === 0) return;

        let ctx = gsap.context(() => {
            if (!gridRef.current) return;
            const cards = gridRef.current.children;
            if (cards.length === 0) return;

            gsap.fromTo(cards, {
                y: 40,
                opacity: 0
            }, {
                y: 0,
                opacity: 1,
                duration: 0.6,
                stagger: 0.1,
                ease: "power2.out",
                scrollTrigger: {
                    trigger: gridRef.current,
                    start: "top 90%",
                    toggleActions: "play none none none"
                }
            });
        });
        return () => ctx.revert();
    }, [promotions, isLoading]);

    const handleClaim = async (promotion) => {
        if (!user) {
            openSignIn()
            return
        }
        if (promotion.isFallback) {
            toast.success(`Mã ưu đãi: ${promotion.couponCode}`)
            return
        }
        if (!axios) return

        setClaimingId(promotion._id)
        try {
            const { data } = await axios.post('/api/promotions/claim', {
                promotionId: promotion._id,
            })
            if (data?.success) {
                toast.success(
                    data.message || `Đã lấy mã: ${data.data?.code || promotion.couponCode}`,
                    { duration: 5000 }
                )
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Không thể lấy mã ưu đãi')
        } finally {
            setClaimingId(null)
        }
    }

    const handleViewDetail = (promotion) => {
        if (promotion.isFallback) {
            navigate('/rooms')
        } else {
            navigate(`/promotions/${promotion._id}`)
        }
    }

    if (isLoading) {
        return (
            <div className='min-h-screen bg-[#f5f3ef]'>
                <div className='px-6 md:px-16 lg:px-24 xl:px-32 pt-28 pb-24'>
                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-12 max-w-6xl mx-auto'>
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className='h-64 bg-gray-200 animate-pulse' />
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className='min-h-screen bg-[#f5f3ef] pt-28 pb-32'>
            <div className='px-6 md:px-16 lg:px-24 xl:px-32'>
                <div className="max-w-6xl mx-auto">

                    {/* Drake-style header */}
                    <div data-scroll data-scroll-speed="0.1">
                        <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-gray-400 mb-4 block">
                            Chương trình khuyến mãi
                        </span>
                        <div className="flex flex-wrap gap-2 mb-4">
                            {['Tất', 'Cả', 'Ưu', 'Đãi'].map((word) => (
                                <span key={word} className="inline-block border-2 border-gray-800 rounded-lg px-3.5 py-1.5 text-3xl md:text-4xl lg:text-5xl font-playfair font-semibold text-gray-900 tracking-tight">
                                    {word}
                                </span>
                            ))}
                        </div>
                        <p className="text-sm text-gray-500 font-light max-w-lg">
                            Tổng hợp các chương trình khuyến mãi, gói nghỉ dưỡng dành riêng cho bạn.
                        </p>
                    </div>

                    <div className="border-t border-gray-300 mt-10 mb-10" />

                    {/* Cards grid */}
                    <div ref={gridRef} className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5'>
                        {promotions.map((promo) => (
                            <div
                                key={promo._id}
                                className='group relative flex flex-col justify-end min-h-[340px] overflow-hidden border border-gray-300 hover:-translate-y-1 transition-all duration-300 cursor-pointer'
                            >
                                {/* Background Image with Parallax */}
                                <div className='absolute inset-0 w-full h-full overflow-hidden'>
                                    <div
                                        data-scroll
                                        data-scroll-speed="-0.1"
                                        className='w-full h-[120%] -top-[10%] absolute bg-no-repeat bg-cover bg-center transition-transform duration-700 group-hover:scale-105'
                                        style={{ backgroundImage: `url(${promo.image})` }}
                                    />
                                </div>
                                <div className='absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10 group-hover:from-black/85 transition-colors duration-300' />

                                {/* Badge row */}
                                <div className='absolute top-4 left-4 flex items-center gap-2 z-[1]'>
                                    <span className='font-mono text-[10px] uppercase tracking-[0.15em] bg-white px-3 py-1.5 text-gray-900 font-medium'>
                                        {promo.discountValue}{promo.discountType === 'percent' ? '%' : '₫'} OFF
                                    </span>
                                    {promo.category && promo.category !== 'other' && (
                                        <span className='font-mono text-[10px] uppercase tracking-[0.15em] bg-white/20 backdrop-blur-sm text-white px-3 py-1.5'>
                                            {CATEGORY_LABELS[promo.category] || promo.category}
                                        </span>
                                    )}
                                </div>

                                {/* Content */}
                                <div className='relative z-[1] px-5 pb-5 pt-16'>
                                    <p className='font-playfair text-xl font-semibold text-white'>{promo.title}</p>
                                    <p className='mt-1.5 text-sm text-white/70 font-light leading-snug'>{promo.description}</p>

                                    {promo.hotel && (
                                        <p className='font-mono text-[9px] text-white/40 mt-2 uppercase tracking-wider'>
                                            📍 {promo.hotel.name}{promo.hotel.city ? ` · ${promo.hotel.city}` : ''}
                                        </p>
                                    )}

                                    <CountdownTimer validTo={promo.validTo} />
                                    <ProgressBar usedCount={promo.usedCount} maxUses={promo.maxUses} />

                                    {/* Actions — Drake style */}
                                    <div className='flex items-center gap-4 mt-4'>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleClaim(promo) }}
                                            disabled={claimingId === promo._id}
                                            className='font-mono text-[10px] uppercase tracking-[0.15em] border border-white/40 text-white px-4 py-2 hover:bg-white hover:text-gray-900 transition-all disabled:opacity-50 cursor-pointer'
                                        >
                                            {claimingId === promo._id ? 'Đang lấy...' : 'Lấy mã'}
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleViewDetail(promo) }}
                                            className='group/btn flex items-center gap-2 cursor-pointer'
                                        >
                                            <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/70">Chi tiết</span>
                                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full border border-white/40 text-white group-hover/btn:bg-white group-hover/btn:text-gray-900 transition-all">
                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                                </svg>
                                            </span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AllPromotions
