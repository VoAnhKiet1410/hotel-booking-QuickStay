import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useAppContext } from '../context/appContextCore'
import { toast } from 'react-hot-toast'
import { CreditCard, Calendar, Users, MapPin, CheckCircle, XCircle, Clock } from 'lucide-react'

const BookingDetail = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const { axios } = useAppContext()
    const [booking, setBooking] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isProcessing, setIsProcessing] = useState(false)

    const paymentStatus = searchParams.get('payment')

    useEffect(() => {
        if (paymentStatus === 'cancelled') {
            toast.error('Thanh toán đã bị hủy')
        }
    }, [paymentStatus])

    useEffect(() => {
        let cancelled = false
        const fetchBooking = async () => {
            if (!axios || !id) return
            try {
                setIsLoading(true)
                const { data } = await axios.get(`/api/bookings/${id}`)
                if (cancelled) return
                if (data?.success) {
                    setBooking(data.data)
                } else {
                    toast.error('Không tìm thấy đặt phòng')
                    navigate('/my-bookings')
                }
            } catch (error) {
                if (cancelled) return
                toast.error(error?.response?.data?.message || 'Không thể tải thông tin đặt phòng')
                navigate('/my-bookings')
            } finally {
                if (!cancelled) setIsLoading(false)
            }
        }
        fetchBooking()
        return () => { cancelled = true }
    }, [axios, id, navigate])

    const handlePayment = async () => {
        if (!axios || !booking) return

        setIsProcessing(true)
        try {
            const { data } = await axios.post('/api/payments/create-checkout-session', {
                bookingId: booking._id,
            })

            if (data?.success && data.data?.url) {
                // Redirect to Stripe Checkout
                window.location.href = data.data.url
            } else {
                toast.error('Không thể tạo phiên thanh toán')
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Không thể xử lý thanh toán')
        } finally {
            setIsProcessing(false)
        }
    }

    const formatDate = (dateStr) => {
        if (!dateStr) return ''
        const date = new Date(dateStr)
        return date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        })
    }

    const calculateNights = () => {
        if (!booking) return 0
        const checkIn = new Date(booking.checkInDate)
        const checkOut = new Date(booking.checkOutDate)
        return Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24))
    }

    const getStatusConfig = (status) => {
        const configs = {
            pending: {
                icon: Clock,
                text: 'Chờ xác nhận',
                color: 'text-amber-600',
                bg: 'bg-amber-50',
                ring: 'ring-amber-200'
            },
            confirmed: {
                icon: CheckCircle,
                text: 'Đã xác nhận',
                color: 'text-emerald-600',
                bg: 'bg-emerald-50',
                ring: 'ring-emerald-200'
            },
            cancelled: {
                icon: XCircle,
                text: 'Đã hủy',
                color: 'text-red-600',
                bg: 'bg-red-50',
                ring: 'ring-red-200'
            },
        }
        return configs[status] || configs.pending
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 pt-28 pb-12 px-4">
                <div className="mx-auto max-w-4xl">
                    <div className="animate-pulse space-y-4">
                        <div className="h-8 w-64 bg-slate-200 rounded" />
                        <div className="h-96 bg-white rounded-2xl" />
                    </div>
                </div>
            </div>
        )
    }

    if (!booking) return null

    const statusConfig = getStatusConfig(booking.status)
    const StatusIcon = statusConfig.icon
    const nights = calculateNights()

    return (
        <div className="min-h-screen bg-slate-50 pt-28 pb-12 px-4">
            <div className="mx-auto max-w-4xl">
                <button
                    onClick={() => navigate('/my-bookings')}
                    className="mb-6 flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
                >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Quay lại danh sách đặt phòng
                </button>

                <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
                    {/* Header */}
                    <div className="flex items-start justify-between border-b border-slate-100 pb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">Chi tiết đặt phòng</h1>
                            <p className="mt-1 text-sm text-slate-500">Mã đặt phòng: #{booking._id.slice(-8).toUpperCase()}</p>
                        </div>
                        <span className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ring-1 ${statusConfig.bg} ${statusConfig.color} ${statusConfig.ring}`}>
                            <StatusIcon className="h-4 w-4" />
                            {statusConfig.text}
                        </span>
                    </div>

                    {/* Hotel & Room Info */}
                    <div className="mt-6 grid gap-6 md:grid-cols-2">
                        <div>
                            <h3 className="text-sm font-semibold text-slate-900">Thông tin khách sạn</h3>
                            <div className="mt-3 space-y-2">
                                <p className="text-lg font-medium text-slate-900">{booking.hotel?.name}</p>
                                <p className="flex items-center gap-2 text-sm text-slate-600">
                                    <MapPin className="h-4 w-4" />
                                    {booking.hotel?.address}, {booking.hotel?.city}
                                </p>
                                <p className="text-sm text-slate-600">
                                    Loại phòng: <span className="font-medium">{booking.room?.roomType}</span>
                                </p>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-sm font-semibold text-slate-900">Thông tin đặt phòng</h3>
                            <div className="mt-3 space-y-2">
                                <p className="flex items-center gap-2 text-sm text-slate-600">
                                    <Calendar className="h-4 w-4" />
                                    Nhận phòng: <span className="font-medium">{formatDate(booking.checkInDate)}</span>
                                </p>
                                <p className="flex items-center gap-2 text-sm text-slate-600">
                                    <Calendar className="h-4 w-4" />
                                    Trả phòng: <span className="font-medium">{formatDate(booking.checkOutDate)}</span>
                                </p>
                                <p className="flex items-center gap-2 text-sm text-slate-600">
                                    <Users className="h-4 w-4" />
                                    Số khách: <span className="font-medium">{booking.guests}</span>
                                </p>
                                <p className="text-sm text-slate-600">
                                    Số đêm: <span className="font-medium">{nights} đêm</span>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Room Image */}
                    {booking.room?.images?.[0] && (
                        <div className="mt-6">
                            <img
                                src={booking.room.images[0]}
                                alt={booking.room.roomType}
                                className="h-64 w-full rounded-xl object-cover"
                            />
                        </div>
                    )}

                    {/* Payment Info */}
                    <div className="mt-6 rounded-xl bg-slate-50 p-6">
                        <h3 className="text-sm font-semibold text-slate-900">Thông tin thanh toán</h3>
                        <div className="mt-4 space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-600">Giá phòng/đêm</span>
                                <span className="font-medium text-slate-900">
                                    {(nights > 0 ? booking.totalPrice / nights : booking.totalPrice).toLocaleString('vi-VN')} ₫
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-600">Số đêm</span>
                                <span className="font-medium text-slate-900">{nights}</span>
                            </div>
                            <div className="border-t border-slate-200 pt-3">
                                <div className="flex justify-between">
                                    <span className="font-semibold text-slate-900">Tổng cộng</span>
                                    <span className="text-xl font-bold text-indigo-600">
                                        {booking.totalPrice.toLocaleString('vi-VN')} ₫
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between border-t border-slate-200 pt-3">
                                <span className="text-sm text-slate-600">Trạng thái thanh toán</span>
                                <span className={`text-sm font-semibold ${booking.isPaid ? 'text-emerald-600' : 'text-amber-600'}`}>
                                    {booking.isPaid ? '✓ Đã thanh toán' : '○ Chưa thanh toán'}
                                </span>
                            </div>
                            {booking.isPaid && booking.paidAt && (
                                <p className="text-xs text-slate-500">
                                    Thanh toán lúc: {new Date(booking.paidAt).toLocaleString('vi-VN')}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Payment Button — CHỈ cho booking Stripe */}
                    {!booking.isPaid && booking.status !== 'cancelled' && booking.paymentMethod === 'stripe' && (
                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                onClick={handlePayment}
                                disabled={isProcessing}
                                className="flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed"
                            >
                                <CreditCard className="h-4 w-4" />
                                {isProcessing ? 'Đang xử lý...' : 'Thanh toán online ngay'}
                            </button>
                        </div>
                    )}

                    {/* payAtHotel chưa trả → hướng dẫn */}
                    {!booking.isPaid && booking.status !== 'cancelled' && booking.paymentMethod !== 'stripe' && (
                        <div className="mt-6 rounded-xl bg-amber-50 border border-amber-200 p-4 text-center">
                            <p className="text-sm font-medium text-amber-700">
                                💰 Thanh toán tiền mặt khi nhận phòng tại quầy lễ tân
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default BookingDetail
