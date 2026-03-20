import React, { useEffect, useState, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAppContext } from '../context/appContextCore'
import { CheckCircle, Copy, Check, Calendar, Users, MapPin } from 'lucide-react'
import { toast } from 'react-hot-toast'
import gsap from 'gsap'

const BookingSuccess = () => {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const { axios } = useAppContext()
    const [isVerifying, setIsVerifying] = useState(true)
    const [booking, setBooking] = useState(null)
    const [copied, setCopied] = useState(false)

    // Refs for animations
    const cardRef = useRef(null)
    const iconRef = useRef(null)
    const confettiRef = useRef(null)

    const sessionId = searchParams.get('session_id')

    // Verify payment on mount
    useEffect(() => {
        let cancelled = false
        const verifyPayment = async () => {
            if (!axios || !sessionId) {
                setIsVerifying(false)
                return
            }
            try {
                const { data } = await axios.get(`/api/payments/verify?sessionId=${sessionId}`)
                if (cancelled) return
                if (data?.success) {
                    setBooking(data.data)
                    toast.success('Thanh toán thành công! Đặt phòng đã được xác nhận.', { duration: 5000 })

                    // Phát custom event để Navbar có thể inject notification
                    // (dự phòng khi socket chưa kết nối kịp sau redirect từ Stripe)
                    window.dispatchEvent(new CustomEvent('localNotification', {
                        detail: {
                            type: 'payment_success',
                            bookingId: data.data?._id,
                            message: `Thanh toán ${data.data?.totalPrice?.toLocaleString('vi-VN')}₫ thành công. Đặt phòng đã được xác nhận!`,
                            totalPrice: data.data?.totalPrice,
                            createdAt: new Date().toISOString(),
                        }
                    }))
                } else {
                    toast.error('Không thể xác minh thanh toán')
                }
            } catch {
                if (cancelled) return
                toast.error('Lỗi xác minh thanh toán')
            } finally {
                if (!cancelled) setIsVerifying(false)
            }
        }

        verifyPayment()
        return () => { cancelled = true }
    }, [axios, sessionId])

    // Celebration animations after verification completes
    useEffect(() => {
        if (isVerifying) return

        const ctx = gsap.context(() => {
            // Card fade-in + slide up
            gsap.fromTo(cardRef.current,
                { opacity: 0, y: 40 },
                { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }
            )

            // Icon scale-in with bounce
            gsap.fromTo(iconRef.current,
                { scale: 0, rotation: -180 },
                {
                    scale: 1, rotation: 0, duration: 0.7,
                    ease: 'back.out(1.7)', delay: 0.3
                }
            )

            // Confetti sparkles
            if (confettiRef.current) {
                const sparkles = confettiRef.current.querySelectorAll('.sparkle')
                sparkles.forEach((sparkle, i) => {
                    gsap.fromTo(sparkle,
                        { opacity: 0, scale: 0 },
                        {
                            opacity: 1, scale: 1, duration: 0.5,
                            delay: 0.5 + i * 0.08,
                            ease: 'back.out(2)',
                        }
                    )
                    gsap.to(sparkle, {
                        y: -10 + Math.random() * 20,
                        x: -5 + Math.random() * 10,
                        opacity: 0,
                        duration: 1.5,
                        delay: 1.2 + i * 0.08,
                        ease: 'power1.out',
                    })
                })
            }
        })

        return () => ctx.revert()
    }, [isVerifying])

    // Copy booking ID to clipboard
    const handleCopy = async () => {
        if (!booking?._id) return
        try {
            await navigator.clipboard.writeText(booking._id)
            setCopied(true)
            toast.success('Đã sao chép mã đặt phòng')
            setTimeout(() => setCopied(false), 2000)
        } catch {
            toast.error('Không thể sao chép')
        }
    }

    // Format date helper
    const formatDate = (dateStr) => {
        if (!dateStr) return '—'
        return new Date(dateStr).toLocaleDateString('vi-VN', {
            day: '2-digit', month: '2-digit', year: 'numeric'
        })
    }

    // Format booking ID — consistent with email templates
    const shortId = (id) => {
        if (!id) return ''
        return `#${id.slice(-8).toUpperCase()}`
    }

    // Loading state
    if (isVerifying) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#f5f3ef]">
                <div className="text-center">
                    <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
                    <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.2em] text-gray-400">Đang xác minh...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#f5f3ef] px-4 pt-32 pb-12">
            <div className="w-full max-w-md">

                {/* Main Card */}
                <div
                    ref={cardRef}
                    className="border border-gray-200 bg-white p-6 md:p-8 text-center shadow-lg"
                    style={{ opacity: 0 }}
                >
                    {/* Celebration sparkles container */}
                    <div ref={confettiRef} className="relative inline-block mb-4">
                        {/* Sparkle dots */}
                        {[...Array(8)].map((_, i) => (
                            <span
                                key={i}
                                className="sparkle absolute"
                                style={{
                                    width: 6 + Math.random() * 4,
                                    height: 6 + Math.random() * 4,
                                    borderRadius: '50%',
                                    background: ['#10b981', '#f59e0b', '#6366f1', '#ec4899', '#14b8a6', '#f97316', '#8b5cf6', '#06b6d4'][i],
                                    top: `${-10 + Math.random() * 70}px`,
                                    left: `${-20 + Math.random() * 90}px`,
                                    opacity: 0,
                                }}
                            />
                        ))}

                        {/* Check icon */}
                        <div
                            ref={iconRef}
                            className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 border-2 border-emerald-200"
                            style={{ transform: 'scale(0)' }}
                        >
                            <CheckCircle className="h-7 w-7 text-emerald-500" strokeWidth={1.5} />
                        </div>
                    </div>

                    {/* Title — boxed words, consistent square borders */}
                    <div className="flex flex-wrap gap-1 justify-center mb-3">
                        {['Thanh', 'Toán', 'Thành', 'Công'].map((word) => (
                            <span
                                key={word}
                                className="inline-block border-[2px] border-gray-900 px-2.5 py-1 text-lg font-semibold text-gray-900 tracking-tight"
                            >
                                {word}
                            </span>
                        ))}
                    </div>

                    {/* Subtitle */}
                    <p className="text-xs text-gray-500 font-light max-w-xs mx-auto">
                        Đặt phòng của bạn đã được xác nhận và thanh toán thành công.
                    </p>

                    {/* Booking info */}
                    {booking && (
                        <div className="mt-5 border-t border-gray-200 pt-4 text-left">
                            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-gray-400 mb-3">
                                Thông tin đặt phòng
                            </p>
                            <div className="space-y-2.5 text-[13px]">
                                {/* Booking ID — with copy button */}
                                <div className="flex items-center gap-4">
                                    <span className="shrink-0 whitespace-nowrap text-gray-500">Mã đặt phòng</span>
                                    <div className="flex-1 min-w-0 flex items-center justify-end gap-2">
                                        <span className="font-mono text-[11px] text-gray-900 truncate" title={booking._id}>
                                            {shortId(booking._id)}
                                        </span>
                                        <button
                                            onClick={handleCopy}
                                            className="shrink-0 p-1.5 rounded hover:bg-gray-100 transition-colors cursor-pointer"
                                            title="Sao chép mã"
                                        >
                                            {copied
                                                ? <Check className="w-3.5 h-3.5 text-emerald-500" />
                                                : <Copy className="w-3.5 h-3.5 text-gray-400" />
                                            }
                                        </button>
                                    </div>
                                </div>

                                {/* Hotel name */}
                                <div className="flex items-center gap-4">
                                    <span className="shrink-0 whitespace-nowrap text-gray-500 flex items-center gap-1.5">
                                        <MapPin className="w-3.5 h-3.5" />
                                        Khách sạn
                                    </span>
                                    <span className="flex-1 min-w-0 text-right font-semibold text-gray-900 truncate">
                                        {booking.hotel?.name}
                                    </span>
                                </div>

                                {/* Room type */}
                                {booking.room?.roomType && (
                                    <div className="flex items-center gap-4">
                                        <span className="shrink-0 whitespace-nowrap text-gray-500">Loại phòng</span>
                                        <span className="flex-1 min-w-0 text-right font-medium text-gray-800 truncate">
                                            {booking.room.roomType}
                                        </span>
                                    </div>
                                )}

                                {/* Check-in / Check-out */}
                                {(booking.checkInDate || booking.checkOutDate) && (
                                    <div className="flex items-center gap-4">
                                        <span className="shrink-0 whitespace-nowrap text-gray-500 flex items-center gap-1.5">
                                            <Calendar className="w-3.5 h-3.5" />
                                            Ngày lưu trú
                                        </span>
                                        <span className="flex-1 min-w-0 text-right font-medium text-gray-800">
                                            {formatDate(booking.checkInDate)} → {formatDate(booking.checkOutDate)}
                                        </span>
                                    </div>
                                )}

                                {/* Guests */}
                                {booking.guests && (
                                    <div className="flex items-center gap-4">
                                        <span className="shrink-0 whitespace-nowrap text-gray-500 flex items-center gap-1.5">
                                            <Users className="w-3.5 h-3.5" />
                                            Số khách
                                        </span>
                                        <span className="flex-1 min-w-0 text-right font-medium text-gray-800">
                                            {booking.guests} khách
                                        </span>
                                    </div>
                                )}

                                {/* Divider before total */}
                                <div className="border-t border-dashed border-gray-200 pt-3 mt-1">
                                    <div className="flex items-center gap-4">
                                        <span className="shrink-0 whitespace-nowrap text-gray-700 font-medium">Tổng tiền</span>
                                        <span className="flex-1 min-w-0 text-right text-lg font-bold text-gray-900">
                                            {booking.totalPrice?.toLocaleString('vi-VN')} ₫
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="mt-6 flex flex-col gap-2.5">
                        <button
                            onClick={() => navigate('/my-bookings')}
                            className="group flex items-center justify-center gap-3 bg-gray-900 text-white px-5 py-3 hover:bg-gray-800 transition-colors cursor-pointer"
                        >
                            <span className="font-mono text-[10px] uppercase tracking-[0.15em]">Xem đặt phòng</span>
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full border border-white/30 group-hover:border-white/60 transition-all">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                </svg>
                            </span>
                        </button>
                        <button
                            onClick={() => navigate('/')}
                            className="font-mono text-[10px] uppercase tracking-[0.15em] border border-gray-300 px-5 py-3 text-gray-700 hover:border-gray-800 hover:text-gray-900 transition-all cursor-pointer"
                        >
                            Về trang chủ
                        </button>
                    </div>
                </div>

                {/* Email confirmation note */}
                <p className="mt-8 text-center font-mono text-[10px] uppercase tracking-wider text-gray-400">
                    Email xác nhận đã được gửi đến địa chỉ email của bạn.
                </p>
            </div>
        </div>
    )
}

export default BookingSuccess
