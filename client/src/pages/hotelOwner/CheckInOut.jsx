import React, { useEffect, useState, useCallback } from 'react'
import Title from '../../components/Title'
import { useAppContext } from '../../context/appContextCore'
import { toast } from 'react-hot-toast'
import { formatCurrency, formatDateShort, formatTime } from '../../utils/formatters'
import {
    LogIn, LogOut, CheckCircle, Clock, UserCheck,
    UserX, RefreshCcw, Users, AlertTriangle
} from 'lucide-react'
import ConfirmModal from '../../components/ConfirmModal'


// Status badge config — consistent with Bookings.jsx
const STATUS_CONFIG = {
    confirmed: {
        color: 'bg-blue-50 text-blue-700 border-blue-200',
        label: 'Đã xác nhận',
        icon: CheckCircle
    },
    checked_in: {
        color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        label: 'Đã nhận phòng',
        icon: UserCheck
    },
}


/**
 * CheckInOut — Trang chuyên biệt cho quy trình nhận/trả phòng hàng ngày.
 *
 * Gọi API /api/bookings/owner/today để lấy arrivals & departures,
 * cung cấp action buttons cho check-in, check-out, no-show.
 */
const CheckInOut = () => {
    const { axios } = useAppContext()

    // Data state
    const [arrivals, setArrivals] = useState([])
    const [departures, setDepartures] = useState([])
    const [overdue, setOverdue] = useState([])
    const [isLoading, setIsLoading] = useState(true)

    // Action loading states — track per booking ID
    const [actionIds, setActionIds] = useState({})

    // Modal state
    const [modal, setModal] = useState({
        isOpen: false,
        type: null,       // 'checkin' | 'checkout' | 'noshow'
        bookingId: null,
        bookingInfo: null,
    })

    // BUG-3 FIX: Payment confirmation state cho checkout payAtHotel
    const [confirmPayment, setConfirmPayment] = useState(true)

    // ──────────────────────────────────────────────
    // Fetch today's activity
    // ──────────────────────────────────────────────
    const fetchTodayData = useCallback(async () => {
        try {
            const { data } = await axios.get('/api/bookings/owner/today')
            if (data.success) {
                setArrivals(data.data?.arrivals || [])
                setDepartures(data.data?.departures || [])
                setOverdue(data.data?.overdue || [])
            }
        } catch (error) {
            console.error('Failed to fetch today activity:', error)
            toast.error('Không thể tải dữ liệu hôm nay')
        } finally {
            setIsLoading(false)
        }
    }, [axios])

    useEffect(() => {
        fetchTodayData()
    }, [fetchTodayData])

    // ──────────────────────────────────────────────
    // Modal helpers
    // ──────────────────────────────────────────────
    const openModal = (type, booking) => {
        setModal({
            isOpen: true,
            type,
            bookingId: booking._id,
            bookingInfo: booking,
        })
    }

    const closeModal = () => {
        setModal({
            isOpen: false,
            type: null,
            bookingId: null,
            bookingInfo: null,
        })
    }

    // ──────────────────────────────────────────────
    // Actions
    // ──────────────────────────────────────────────
    const setActionLoading = (id, loading) => {
        setActionIds(prev =>
            loading
                ? { ...prev, [id]: true }
                : (() => { const n = { ...prev }; delete n[id]; return n })()
        )
    }

    /**
     * Xử lý check-in — gọi PUT /api/bookings/owner/:id/check-in
     */
    const handleCheckIn = async (bookingId) => {
        setActionLoading(bookingId, true)
        try {
            const { data } = await axios.patch(
                `/api/bookings/owner/${bookingId}/check-in`
            )
            if (data.success) {
                toast.success('Nhận phòng thành công!')
                await fetchTodayData()
            }
        } catch (error) {
            toast.error(
                error?.response?.data?.message ||
                'Không thể nhận phòng. Vui lòng thử lại.'
            )
        } finally {
            setActionLoading(bookingId, false)
            closeModal()
        }
    }

    /**
     * Xử lý check-out — gọi PUT /api/bookings/owner/:id/check-out
     */
    const handleCheckOut = async (bookingId) => {
        setActionLoading(bookingId, true)
        try {
            const { data } = await axios.patch(
                `/api/bookings/owner/${bookingId}/check-out`,
                { confirmPayment } // BUG-3 FIX: Gửi flag xác nhận thanh toán
            )
            if (data.success) {
                toast.success('Trả phòng thành công!')
                await fetchTodayData()
            }
        } catch (error) {
            toast.error(
                error?.response?.data?.message ||
                'Không thể trả phòng. Vui lòng thử lại.'
            )
        } finally {
            setActionLoading(bookingId, false)
            setConfirmPayment(true) // Reset cho lần sau
            closeModal()
        }
    }

    /**
     * Xử lý no-show — gọi PUT /api/bookings/owner/:id/no-show
     */
    const handleNoShow = async (bookingId) => {
        setActionLoading(bookingId, true)
        try {
            const { data } = await axios.patch(
                `/api/bookings/owner/${bookingId}/no-show`
            )
            if (data.success) {
                toast.success('Đã đánh dấu No-show')
                await fetchTodayData()
            }
        } catch (error) {
            toast.error(
                error?.response?.data?.message ||
                'Không thể đánh dấu no-show. Vui lòng thử lại.'
            )
        } finally {
            setActionLoading(bookingId, false)
            closeModal()
        }
    }

    /**
     * Xử lý xác nhận từ modal — dispatch theo type
     */
    const handleModalConfirm = () => {
        if (!modal.bookingId) return
        switch (modal.type) {
            case 'checkin':
                handleCheckIn(modal.bookingId)
                break
            case 'checkout':
                handleCheckOut(modal.bookingId)
                break
            case 'noshow':
                handleNoShow(modal.bookingId)
                break
            default:
                closeModal()
        }
    }

    // ──────────────────────────────────────────────
    // Modal config — generates title, message, type
    // ──────────────────────────────────────────────
    const getModalConfig = () => {
        if (!modal.bookingInfo) return {}
        const b = modal.bookingInfo
        const guestName =
            b.user?.username || b.user?.email || 'Khách'
        const roomType = b.room?.roomType || 'Phòng'

        if (modal.type === 'checkin') {
            return {
                title: 'Xác nhận nhận phòng',
                message: `Xác nhận khách hàng ${guestName} đã nhận phòng ${roomType}?`,
                confirmText: 'Xác nhận nhận phòng',
                type: 'checkin',
            }
        }

        if (modal.type === 'checkout') {
            const needsPayment = b.paymentMethod === 'payAtHotel' && !b.isPaid
            return {
                title: 'Xác nhận trả phòng',
                message: `Xác nhận khách hàng ${guestName} đã trả phòng ${roomType}?${needsPayment
                    ? ''
                    : ''
                }`,
                // BUG-3 FIX: Thêm nội dung xác nhận thanh toán cho payAtHotel
                extraContent: needsPayment ? (
                    <label className="mt-3 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm cursor-pointer">
                        <input
                            type="checkbox"
                            checked={confirmPayment}
                            onChange={(e) => setConfirmPayment(e.target.checked)}
                            className="h-4 w-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                        />
                        <span className="text-amber-800">
                            <strong>Xác nhận đã thu {formatCurrency(b.totalPrice)}</strong>
                            <br />
                            <span className="text-xs text-amber-600">
                                Bỏ chọn nếu khách chưa thanh toán (có thể cập nhật sau)
                            </span>
                        </span>
                    </label>
                ) : null,
                confirmText: 'Xác nhận trả phòng',
                type: 'checkout',
            }
        }

        if (modal.type === 'noshow') {
            return {
                title: '🚫 Đánh dấu Không đến (No-show)',
                message: `Khách hàng ${guestName} không đến nhận phòng ${roomType}?\n\n• Đặt phòng sẽ bị HỦY\n• Khách hàng KHÔNG ĐƯỢC HOÀN TIỀN\n• Hành động này không thể hoàn tác`,
                confirmText: 'Xác nhận No-show',
                type: 'danger',
            }
        }

        return {}
    }

    const modalConfig = getModalConfig()

    // ──────────────────────────────────────────────
    // Helpers
    // ──────────────────────────────────────────────

    /**
     * Kiểm tra booking có thể no-show hay không
     * (status=confirmed và checkInDate <= hôm nay)
     */
    const canNoShow = (booking) => {
        if (booking.status !== 'confirmed') return false
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const checkInDay = new Date(booking.checkInDate)
        checkInDay.setHours(0, 0, 0, 0)
        return checkInDay <= today
    }

    // ──────────────────────────────────────────────
    // Card component cho mỗi booking
    // ──────────────────────────────────────────────
    const BookingCard = ({ booking, variant }) => {
        const loading = Boolean(actionIds[booking._id])
        const config = STATUS_CONFIG[booking.status] || STATUS_CONFIG.confirmed
        const StatusIcon = config.icon

        return (
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md">
                {/* Guest info + Status */}
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-slate-900">
                            {booking.user?.username ||
                                booking.user?.email ||
                                'Khách'}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                            {booking.user?.email}
                        </p>
                    </div>
                    <span
                        className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${config.color}`}
                    >
                        <StatusIcon className="h-3 w-3" />
                        {config.label}
                    </span>
                </div>

                {/* Hotel name (IMP-5: cho multi-hotel owners) */}
                {booking.hotel?.name && (
                    <p className="mt-1 truncate text-[11px] font-medium text-slate-400">
                        🏨 {booking.hotel.name}
                    </p>
                )}

                {/* Room + Price */}
                <div className="mt-3 flex items-center justify-between gap-2">
                    <div>
                        <p className="text-sm font-medium text-slate-800">
                            {booking.room?.roomType || 'Phòng'}
                        </p>
                        <p className="text-xs text-slate-500">
                            {booking.guests} khách
                        </p>
                    </div>
                    <p className="text-sm font-bold text-slate-900">
                        {formatCurrency(booking.totalPrice)}
                    </p>
                </div>

                {/* Dates */}
                <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
                    <span>Nhận: {formatDateShort(booking.checkInDate)}</span>
                    <span className="text-slate-300">→</span>
                    <span>Trả: {formatDateShort(booking.checkOutDate)}</span>
                </div>

                {/* IMP-1: Hiển thị thời điểm check-in/check-out */}
                {booking.checkedInAt && (
                    <p className="mt-1 text-[11px] text-indigo-500">
                        ✓ Nhận phòng lúc {formatTime(booking.checkedInAt)}
                    </p>
                )}

                {/* Special requests */}
                {booking.specialRequests && (
                    <div className="mt-2 flex items-start gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5">
                        <span className="shrink-0 text-[11px]">📋</span>
                        <p className="line-clamp-2 text-[11px] leading-tight text-amber-700">
                            {booking.specialRequests}
                        </p>
                    </div>
                )}

                {/* Payment indicator */}
                <div className="mt-3 flex items-center gap-1.5">
                    <span
                        className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ${booking.isPaid
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                    >
                        {booking.isPaid ? '✓ Đã thanh toán' : '○ Chưa thanh toán'}
                    </span>
                </div>

                {/* Action Buttons */}
                <div className="mt-4 flex flex-wrap items-center gap-2">
                    {/* Check-in button — chỉ cho arrivals confirmed */}
                    {variant === 'arrival' &&
                        booking.status === 'confirmed' && (
                            <button
                                disabled={loading}
                                onClick={() => openModal('checkin', booking)}
                                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <LogIn className="h-3.5 w-3.5" />
                                Nhận phòng
                            </button>
                        )}

                    {/* No-show button — chỉ cho arrivals confirmed + quá ngày */}
                    {variant === 'arrival' && canNoShow(booking) && (
                        <button
                            disabled={loading}
                            onClick={() => openModal('noshow', booking)}
                            className="inline-flex items-center gap-1 rounded-lg bg-orange-100 px-3 py-2 text-xs font-medium text-orange-700 transition-all hover:bg-orange-200 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <UserX className="h-3.5 w-3.5" />
                            No-show
                        </button>
                    )}

                    {/* Check-out button — chỉ cho departures đã check-in (BUG-2 FIX) */}
                    {variant === 'departure' &&
                        booking.status === 'checked_in' && (
                            <button
                                disabled={loading}
                                onClick={() => openModal('checkout', booking)}
                                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <LogOut className="h-3.5 w-3.5" />
                                Trả phòng
                            </button>
                        )}

                    {/* Already checked-in indicator for arrivals */}
                    {variant === 'arrival' &&
                        booking.status === 'checked_in' && (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600">
                                <UserCheck className="h-3.5 w-3.5" />
                                Đã nhận phòng
                            </span>
                        )}
                </div>
            </div>
        )
    }

    // ──────────────────────────────────────────────
    // Empty state component
    // ──────────────────────────────────────────────
    // eslint-disable-next-line no-unused-vars -- EmptyStateIcon is used as JSX component below
    const EmptyState = ({ message, icon: EmptyStateIcon }) => (
        <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                <EmptyStateIcon className="h-6 w-6 text-slate-400" />
            </div>
            <p className="mt-3 text-sm text-slate-500">{message}</p>
        </div>
    )

    // ──────────────────────────────────────────────
    // Render
    // ──────────────────────────────────────────────
    return (
        <div className="max-w-6xl">
            {/* Confirm Modal */}
            <ConfirmModal
                isOpen={modal.isOpen}
                onClose={closeModal}
                onConfirm={handleModalConfirm}
                title={modalConfig.title}
                message={modalConfig.message}
                confirmText={modalConfig.confirmText}
                type={modalConfig.type}
                isLoading={modal.bookingId && Boolean(actionIds[modal.bookingId])}
                extraContent={modalConfig.extraContent}
            />

            {/* Header */}
            <div className="flex items-center justify-between gap-4">
                <Title
                    align="left"
                    font="font-outfit"
                    title="Nhận & Trả phòng"
                    subTitle="Quản lý khách đến và khách đi hôm nay."
                />
                <button
                    onClick={() => {
                        setIsLoading(true)
                        fetchTodayData()
                    }}
                    disabled={isLoading}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-600 shadow-sm transition-all hover:bg-slate-50 active:scale-[0.98] disabled:opacity-50"
                >
                    <RefreshCcw
                        className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`}
                    />
                    Làm mới
                </button>
            </div>

            {/* Loading state */}
            {isLoading ? (
                <div className="mt-10 flex flex-col items-center justify-center py-12">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600" />
                    <p className="mt-3 text-sm text-slate-500">
                        Đang tải dữ liệu...
                    </p>
                </div>
            ) : (
                /* Overdue + Two-column layout */
                <>
                    {/* ──── Overdue Section (IMP-3) ──── */}
                    {overdue.length > 0 && (
                        <div className="mt-8">
                            <div className="flex items-center justify-between rounded-t-2xl border border-red-200 bg-red-50/80 px-5 py-3">
                                <div className="flex items-center gap-2">
                                    <AlertTriangle className="h-4.5 w-4.5 text-red-600" />
                                    <h2 className="text-sm font-bold text-red-900">
                                        Khách ở quá hạn
                                    </h2>
                                </div>
                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-200 text-xs font-bold text-red-800">
                                    {overdue.length}
                                </span>
                            </div>
                            <div className="space-y-3 rounded-b-2xl border border-t-0 border-red-100 bg-red-50/20 p-4">
                                {overdue.map((booking) => (
                                    <BookingCard
                                        key={booking._id}
                                        booking={booking}
                                        variant="departure"
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
                    {/* ──── Arrivals Column ──── */}
                    <div>
                        <div className="flex items-center justify-between rounded-t-2xl border border-indigo-100 bg-indigo-50/60 px-5 py-3">
                            <div className="flex items-center gap-2">
                                <LogIn className="h-4.5 w-4.5 text-indigo-600" />
                                <h2 className="text-sm font-bold text-indigo-900">
                                    Khách đến hôm nay
                                </h2>
                            </div>
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                                {arrivals.length}
                            </span>
                        </div>

                        <div className="space-y-3 rounded-b-2xl border border-t-0 border-slate-200 bg-slate-50/30 p-4">
                            {arrivals.length === 0 ? (
                                <EmptyState
                                    message="Không có khách đến dự kiến hôm nay"
                                    icon={Users}
                                />
                            ) : (
                                arrivals.map((booking) => (
                                    <BookingCard
                                        key={booking._id}
                                        booking={booking}
                                        variant="arrival"
                                    />
                                ))
                            )}
                        </div>
                    </div>

                    {/* ──── Departures Column ──── */}
                    <div>
                        <div className="flex items-center justify-between rounded-t-2xl border border-amber-100 bg-amber-50/60 px-5 py-3">
                            <div className="flex items-center gap-2">
                                <LogOut className="h-4.5 w-4.5 text-amber-600" />
                                <h2 className="text-sm font-bold text-amber-900">
                                    Khách đi hôm nay
                                </h2>
                            </div>
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700">
                                {departures.length}
                            </span>
                        </div>

                        <div className="space-y-3 rounded-b-2xl border border-t-0 border-slate-200 bg-slate-50/30 p-4">
                            {departures.length === 0 ? (
                                <EmptyState
                                    message="Không có khách trả phòng dự kiến hôm nay"
                                    icon={Clock}
                                />
                            ) : (
                                departures.map((booking) => (
                                    <BookingCard
                                        key={booking._id}
                                        booking={booking}
                                        variant="departure"
                                    />
                                ))
                            )}
                        </div>
                    </div>
                </div>
                </>
            )}
        </div>
    )
}

export default CheckInOut
