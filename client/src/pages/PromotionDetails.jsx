import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Clock, Users, ArrowLeft, Loader2, CheckCircle2, Copy } from 'lucide-react'
import { useUser, useClerk } from '@clerk/clerk-react'
import { useAppContext } from '../context/appContextCore'
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
    other: 'Ưu đãi chung',
}

// ----- Sub-component cho 1 thẻ số có hiệu ứng nhảy (pop) -----
const AnimatedDigit = ({ value, label }) => {
    const elRef = React.useRef(null)
    const prevRef = React.useRef(value)

    React.useEffect(() => {
        if (prevRef.current !== value && elRef.current) {
            const el = elRef.current
            el.classList.add('scale-110', 'shadow-indigo-500/20')
            const timeout = setTimeout(() => {
                el.classList.remove('scale-110', 'shadow-indigo-500/20')
            }, 300)
            prevRef.current = value
            return () => clearTimeout(timeout)
        }
    }, [value])

    return (
        <div className="flex flex-col items-center">
            <div
                ref={elRef}
                className="text-xl md:text-2xl font-bold font-mono text-gray-900 bg-white/60 border border-slate-200/60 rounded-lg md:rounded-xl w-10 h-11 md:w-12 md:h-12 flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-transform duration-300 scale-100"
            >
                {value.toString().padStart(2, '0')}
            </div>
            <span className="text-[9px] md:text-[10px] text-gray-400 mt-1.5 uppercase font-bold tracking-wider">{label}</span>
        </div>
    )
}

// Extracted outside CountdownTimer to avoid re-creation every second
const BlinkColon = () => (
    <div className="text-xl md:text-2xl font-bold text-slate-300 pt-2 md:pt-2.5 animate-pulse">:</div>
)

const CountdownTimer = ({ validTo }) => {
    const [timeLeft, setTimeLeft] = useState(() => calcTimeLeft(validTo))

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(calcTimeLeft(validTo))
        }, 1000) // Đếm theo từng giây
        return () => clearInterval(timer)
    }, [validTo])

    if (!timeLeft) return <div className="text-red-500 font-semibold bg-red-50 px-3 py-1.5 rounded-lg text-sm inline-block w-full text-center">Đã kết thúc</div>

    return (
        <div className="flex gap-1.5 sm:gap-2.5 items-start justify-center w-full">
            <AnimatedDigit value={timeLeft.days} label="Ngày" />
            <BlinkColon />
            <AnimatedDigit value={timeLeft.hours} label="Giờ" />
            <BlinkColon />
            <AnimatedDigit value={timeLeft.minutes} label="Phút" />
            <BlinkColon />
            <AnimatedDigit value={timeLeft.seconds} label="Giây" />
        </div>
    )
}

function calcTimeLeft(validTo) {
    const diff = new Date(validTo) - new Date()
    if (diff <= 0) return null
    return {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
    }
}

const PromotionDetails = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const { axios } = useAppContext()
    const { user } = useUser()
    const { openSignIn } = useClerk()

    const [promotion, setPromotion] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isClaiming, setIsClaiming] = useState(false)
    const [isClaimed, setIsClaimed] = useState(false)
    const [myCoupon, setMyCoupon] = useState(null)
    const contentRef = React.useRef(null)

    React.useLayoutEffect(() => {
        if (isLoading || !promotion) return;

        let ctx = gsap.context(() => {
            if (!contentRef.current) return;
            gsap.fromTo(contentRef.current, {
                y: 30,
                opacity: 0
            }, {
                y: 0,
                opacity: 1,
                ease: "none",
                scrollTrigger: {
                    trigger: contentRef.current,
                    start: "top 95%",
                    end: "bottom 85%",
                    scrub: 1
                }
            });
        });
        return () => ctx.revert();
    }, [promotion, isLoading]);

    useEffect(() => {
        let isCancelled = false
        window.scrollTo(0, 0)

        const loadData = async () => {
            await fetchPromotion(isCancelled)
            if (user && !isCancelled) checkMyCoupons()
        }
        loadData()

        return () => { isCancelled = true }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, user, axios])

    const fetchPromotion = async (isCancelled = false) => {
        if (!axios) return
        try {
            const { data } = await axios.get(`/api/promotions/${id}`)
            if (isCancelled) return
            if (data?.success) {
                setPromotion(data.data)
            } else {
                toast.error('Không tìm thấy ưu đãi')
                navigate('/')
            }
        } catch {
            if (isCancelled) return
            toast.error('Lỗi khi tải dữ liệu ưu đãi')
            navigate('/')
        } finally {
            if (!isCancelled) setIsLoading(false)
        }
    }

    const checkMyCoupons = async () => {
        if (!axios) return
        try {
            const { data } = await axios.get('/api/promotions/my-coupons')
            if (data?.success) {
                const claimed = data.data.find(c => c.promotion?._id === id)
                if (claimed) setMyCoupon(claimed)
            }
        } catch {
            // Ignore error payload
        }
    }

    const handleClaim = async () => {
        if (!user) {
            toast.error('Vui lòng đăng nhập để sao chép mã ưu đãi')
            openSignIn() // Option 1: Lưu code dự bị hoặc redirect
            return
        }

        if (!axios) return

        setIsClaiming(true)
        try {
            // 1. Dual-Action: Copy Text to Clipboard
            if (promotion?.couponCode) {
                await navigator.clipboard.writeText(promotion.couponCode)
                toast.success('Đã sao chép mã ưu đãi!')
            }

            // 2. Silent Claim ngầm
            const { data } = await axios.post('/api/promotions/claim', {
                promotionId: id
            })
            if (data.success) {
                setIsClaimed(true)
                if (data.message !== 'Bạn đã lấy mã này rồi') {
                    // toast phụ cho lưu ví
                }
            }
        } catch (error) {
            console.error('Lỗi khi lưu mã:', error)
            if (error.response?.data?.message) {
                toast.error(error.response.data.message)
            } else {
                toast.error('Có lỗi xảy ra, vui lòng thử lại sau')
            }
        } finally {
            setIsClaiming(false)
        }
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 pt-24 pb-20 px-4 md:px-8">
                <div className="max-w-5xl mx-auto space-y-6">
                    <div className="h-64 md:h-96 w-full rounded-2xl bg-slate-200 animate-pulse" />
                    <div className="flex flex-col md:flex-row gap-8">
                        <div className="flex-1 space-y-4">
                            <div className="h-10 w-3/4 rounded-lg bg-slate-200 animate-pulse" />
                            <div className="h-24 w-full rounded-lg bg-slate-200 animate-pulse" />
                        </div>
                        <div className="w-full md:w-80 h-48 rounded-2xl bg-slate-200 animate-pulse shrink-0" />
                    </div>
                </div>
            </div>
        )
    }

    if (!promotion) return null

    const usagePercent = promotion.maxUses ? Math.min(100, Math.round((promotion.usedCount / promotion.maxUses) * 100)) : null
    const discountText = promotion.discountType === 'percent'
        ? `${promotion.discountValue}% `
        : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(promotion.discountValue)

    return (
        <div className="min-h-screen bg-[#F8FAFC] pt-20 pb-20">
            {/* Top Banner section */}
            <div data-nav-theme="light" className="relative h-[300px] md:h-[400px] bg-slate-900 border-b border-white/10 overflow-hidden">
                {promotion.image && (
                    <img
                        src={promotion.image}
                        alt={promotion.title}
                        data-scroll
                        data-scroll-speed="-0.15"
                        className="absolute inset-0 w-full h-full object-cover scale-110"
                    />
                )}
                {/* Lớp phủ Gradient hiện đại: Đậm ở dưới để nổi Text, và trong suốt rực rỡ ở trên */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/10 to-transparent" />

                <div className="absolute inset-0 flex items-end">
                    <div className="max-w-5xl mx-auto w-full px-6 md:px-12 pb-12" data-scroll data-scroll-speed="0.1">
                        <button
                            onClick={() => navigate(-1)}
                            className="flex items-center gap-2 text-white/80 hover:text-white text-sm font-medium mb-6 transition-colors group"
                        >
                            <span className="group-hover:-translate-x-1 transition-transform">←</span> Quay lại
                        </button>

                        <div className="flex gap-2 mb-4">
                            <span className="px-3 py-1 rounded-full bg-emerald-500 text-white text-[10px] font-bold tracking-wider uppercase">
                                Giảm {discountText}
                            </span>
                            {promotion.category && promotion.category !== 'other' && (
                                <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/30 text-[10px] font-semibold tracking-wider uppercase">
                                    {CATEGORY_LABELS[promotion.category] || promotion.category}
                                </span>
                            )}
                        </div>
                        <h1 className="text-3xl md:text-5xl font-bold font-playfair text-white max-w-3xl leading-tight">
                            {promotion.title}
                        </h1>
                        <div className="flex items-center gap-4 mt-4 text-white/80 text-sm">
                            <span className="flex items-center gap-1.5">
                                📍 {promotion.hotel?.name || 'QuickStay'} {promotion.hotel?.city ? `- ${promotion.hotel.city} ` : ''}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1.5">
                                ⏳ Đến {new Date(promotion.validTo).toLocaleDateString('vi-VN')}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="max-w-5xl mx-auto px-6 md:px-12 py-10">
                <div ref={contentRef} className="flex flex-col md:flex-row gap-10 md:gap-16">

                    {/* Left: Details */}
                    <div className="flex-1 space-y-10">
                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-4 font-outfit">Chi tiết ưu đãi</h2>
                            <p className="text-gray-600 leading-relaxed whitespace-pre-line text-sm md:text-base">
                                {promotion.description}
                            </p>
                        </section>

                        <section className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 font-outfit">Điều kiện áp dụng</h3>
                            <ul className="space-y-5">
                                <li className="flex items-start gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 shrink-0" />
                                    <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-1 sm:gap-4 text-sm text-gray-700 w-full">
                                        <span className="font-semibold text-gray-900 shrink-0">Mức ưu đãi:</span>
                                        <span className="leading-relaxed">Giảm ngay {discountText} vào tổng hóa đơn đặt phòng.</span>
                                    </div>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 shrink-0" />
                                    <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-1 sm:gap-4 text-sm text-gray-700 w-full">
                                        <span className="font-semibold text-gray-900 shrink-0">Thời gian hiệu lực:</span>
                                        <span className="leading-relaxed">Từ nay đến {new Date(promotion.validTo).toLocaleDateString('vi-VN', { timeZone: 'UTC' })} (Giờ UTC).</span>
                                    </div>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 shrink-0" />
                                    <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-1 sm:gap-4 text-sm text-gray-700 w-full">
                                        <span className="font-semibold text-gray-900 shrink-0">Số đêm tối thiểu:</span>
                                        <span className="leading-relaxed">{promotion.minNights} đêm</span>
                                    </div>
                                </li>
                                {promotion.applicableRoomTypes?.length > 0 && (
                                    <li className="flex items-start gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 shrink-0" />
                                        <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-1 sm:gap-4 text-sm text-gray-700 w-full items-start">
                                            <span className="font-semibold text-gray-900 shrink-0">Phòng áp dụng:</span>
                                            <div className="flex flex-wrap gap-2">
                                                {promotion.applicableRoomTypes.map(type => (
                                                    <span key={type} className="px-2.5 py-1 bg-slate-100 rounded text-xs font-bold text-slate-700">{type}</span>
                                                ))}
                                            </div>
                                        </div>
                                    </li>
                                )}
                            </ul>
                        </section>
                    </div>

                    {/* Right: Action Box */}
                    <div className="w-full md:w-80 shrink-0 relative">
                        <div className="sticky top-28 bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden">
                            {/* Decorative elements */}
                            <div className="absolute -left-4 top-1/2 w-8 h-8 rounded-full bg-slate-50 border border-slate-100" />
                            <div className="absolute -right-4 top-1/2 w-8 h-8 rounded-full bg-slate-50 border border-slate-100" />
                            <div className="absolute left-4 right-4 top-1/2 border-t border-dashed border-slate-200" />

                            <div className="flex flex-col gap-6 relative z-10 pb-6 border-b border-transparent">
                                <div>
                                    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-2">Mã Coupon</p>
                                    <div className="bg-indigo-50 border-2 border-dashed border-indigo-200 rounded-xl p-4 text-center">
                                        <span className="text-2xl font-bold font-mono tracking-[0.2em] text-indigo-700 select-all">
                                            {promotion.couponCode}
                                        </span>
                                    </div>
                                </div>

                                {myCoupon || isClaimed ? (
                                    <div className="space-y-3 pt-6">
                                        <div className="flex items-center justify-center gap-2 text-emerald-600 bg-emerald-50 py-3 rounded-xl font-medium w-full text-center border border-emerald-100/50">
                                            <CheckCircle2 className="w-5 h-5" />
                                            Đã có trong ví! Dùng ngay
                                        </div>
                                        <button
                                            onClick={async () => {
                                                try {
                                                    await navigator.clipboard.writeText(promotion.couponCode)
                                                    toast.success('Đã sao chép lại mã ưu đãi!')
                                                } catch {
                                                    toast.error('Không thể sao chép, vui lòng copy thủ công')
                                                }
                                            }}
                                            className="w-full py-3 md:py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
                                        >
                                            <Copy className="w-4 h-4" />
                                            Sao chép lại mã
                                        </button>
                                    </div>
                                ) : (
                                    <div className="pt-6">
                                        <button
                                            onClick={handleClaim}
                                            disabled={isClaiming || !promotion.isValid}
                                            className={`w-full py-3 md:py-3.5 text-white font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 ${isClaiming || !promotion.isValid
                                                ? 'bg-slate-300 cursor-not-allowed'
                                                : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-500/25 active:scale-[0.98]'
                                                }`}
                                        >
                                            {isClaiming ? (
                                                <>
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                    Đang sao chép...
                                                </>
                                            ) : (
                                                <>
                                                    <Copy className="w-5 h-5" />
                                                    {promotion.isValid ? `Sao chép mã: ${promotion.couponCode}` : 'Đã hết lượt sử dụng'}
                                                </>
                                            )}
                                        </button>
                                    </div>
                                )}

                                <div className="pt-6 relative z-10">
                                    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-3 text-center">⏰ Kết thúc sau</p>
                                    <div className="flex justify-center">
                                        <CountdownTimer validTo={promotion.validTo} />
                                    </div>

                                    {usagePercent !== null && (
                                        <div className="mt-6 pt-5 border-t border-slate-100">
                                            <div className="flex justify-between text-xs text-slate-500 mb-2 font-medium">
                                                <span>Đã dùng: {promotion.usedCount}</span>
                                                <span>Tổng: {promotion.maxUses} lượt</span>
                                            </div>
                                            <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-1000 ${usagePercent >= 90 ? 'bg-red-500' : 'bg-indigo-500'}`}
                                                    style={{ width: `${usagePercent}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}

export default PromotionDetails
