import React, { useEffect, useState } from 'react'
import Title from '../../components/Title'
import { useAppContext } from '../../context/appContextCore'
import { toast } from 'react-hot-toast'
import { formatCurrency, formatDateShort } from '../../utils/formatters'
import { LogIn, LogOut, CheckCircle, XCircle, Clock, UserCheck, Home } from 'lucide-react'

const BOOKING_STATUS = {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    CHECKED_IN: 'checked_in',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
}

const BOOKING_STATUS_LABELS = {
    pending: 'Chờ xác nhận',
    confirmed: 'Đã xác nhận',
    checked_in: 'Đã nhận phòng',
    completed: 'Đã trả phòng',
    cancelled: 'Đã hủy',
}

const Bookings = () => {
    const { axios } = useAppContext()
    const [bookings, setBookings] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [statusFilter, setStatusFilter] = useState('all')
    const [updatingIds, setUpdatingIds] = useState({})

    useEffect(() => {
        let cancelled = false
        const fetchBookings = async () => {
            if (!axios) return
            try {
                setIsLoading(true)
                const { data } = await axios.get('/api/bookings/owner')
                if (cancelled) return
                setBookings(Array.isArray(data?.data) ? data.data : [])
            } catch (error) {
                if (cancelled) return
                toast.error(error?.response?.data?.message || 'Không thể tải danh sách đặt phòng')
            } finally {
                if (!cancelled) setIsLoading(false)
            }
        }
        fetchBookings()
        return () => { cancelled = true }
    }, [axios])

    const filteredBookings = bookings.filter(b => 
        statusFilter === 'all' || b.status === statusFilter
    )

    const updateBookingStatus = async (bookingId, status) => {
        if (!axios) return
        setUpdatingIds(prev => ({ ...prev, [bookingId]: true }))
        try {
            const { data } = await axios.patch(`/api/bookings/owner/${bookingId}`, { status })
            if (data?.success) {
                setBookings(prev => prev.map(b => b._id === bookingId ? data.data : b))
                toast.success('Cập nhật trạng thái thành công')
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Không thể cập nhật')
        } finally {
            setUpdatingIds(prev => { const n = { ...prev }; delete n[bookingId]; return n })
        }
    }

    const handleCheckIn = async (bookingId) => {
        if (!axios) return
        setUpdatingIds(prev => ({ ...prev, [bookingId]: true }))
        try {
            const { data } = await axios.patch(`/api/bookings/owner/${bookingId}/check-in`)
            if (data?.success) {
                setBookings(prev => prev.map(b => b._id === bookingId ? data.data : b))
                toast.success('Nhận phòng thành công!')
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Không thể nhận phòng')
        } finally {
            setUpdatingIds(prev => { const n = { ...prev }; delete n[bookingId]; return n })
        }
    }

    const handleCheckOut = async (bookingId) => {
        console.log('=== handleCheckOut CALLED ===', bookingId)
        if (!axios) {
            console.log('axios is null/undefined!')
            return
        }
        const confirmed = window.confirm('Xác nhận trả phòng? Nếu khách chưa thanh toán, hệ thống sẽ tự động đánh dấu đã thanh toán.')
        console.log('User confirmed:', confirmed)
        if (!confirmed) return

        setUpdatingIds(prev => ({ ...prev, [bookingId]: true }))
        try {
            console.log('Calling API: PATCH /api/bookings/owner/' + bookingId + '/check-out')
            const { data } = await axios.patch(`/api/bookings/owner/${bookingId}/check-out`)
            console.log('API response:', data)
            if (data?.success) {
                setBookings(prev => prev.map(b => b._id === bookingId ? data.data : b))
                toast.success('Trả phòng thành công!')
            }
        } catch (error) {
            console.error('Check-out error:', error?.response?.data || error.message)
            toast.error(error?.response?.data?.message || 'Không thể trả phòng')
        } finally {
            setUpdatingIds(prev => { const n = { ...prev }; delete n[bookingId]; return n })
        }
    }

    const updatePaymentStatus = async (bookingId, isPaid) => {
        if (!axios) return
        setUpdatingIds(prev => ({ ...prev, [bookingId]: true }))
        try {
            const { data } = await axios.patch(`/api/bookings/owner/${bookingId}`, { isPaid })
            if (data?.success) {
                setBookings(prev => prev.map(b => b._id === bookingId ? data.data : b))
                toast.success(isPaid ? 'Đã xác nhận thanh toán' : 'Đã hủy xác nhận thanh toán')
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Không thể cập nhật')
        } finally {
            setUpdatingIds(prev => { const n = { ...prev }; delete n[bookingId]; return n })
        }
    }

    const getStatusConfig = (status) => {
        const configs = {
            pending: { color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock },
            confirmed: { color: 'bg-blue-50 text-blue-700 border-blue-200', icon: CheckCircle },
            checked_in: { color: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: UserCheck },
            completed: { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: Home },
            cancelled: { color: 'bg-red-50 text-red-700 border-red-200', icon: XCircle },
        }
        return configs[status] || configs.pending
    }

    const statusCounts = bookings.reduce((acc, b) => {
        acc[b.status] = (acc[b.status] || 0) + 1
        return acc
    }, {})

    return (
        <div className="max-w-6xl">
            <Title
                align="left"
                font="font-outfit"
                title="Quản lý đặt phòng"
                subTitle="Xem và quản lý tất cả đơn đặt phòng của khách sạn."
            />

            {/* Status Filter Tabs */}
            <div className="mt-6 flex flex-wrap items-center gap-2">
                {[
                    { key: 'all', label: 'Tất cả', count: bookings.length },
                    { key: BOOKING_STATUS.PENDING, label: 'Chờ xác nhận', count: statusCounts.pending || 0 },
                    { key: BOOKING_STATUS.CONFIRMED, label: 'Đã xác nhận', count: statusCounts.confirmed || 0 },
                    { key: BOOKING_STATUS.CHECKED_IN, label: 'Đang ở', count: statusCounts.checked_in || 0 },
                    { key: BOOKING_STATUS.COMPLETED, label: 'Đã trả phòng', count: statusCounts.completed || 0 },
                    { key: BOOKING_STATUS.CANCELLED, label: 'Đã hủy', count: statusCounts.cancelled || 0 },
                ].map(({ key, label, count }) => (
                    <button
                        key={key}
                        onClick={() => setStatusFilter(key)}
                        className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
                            statusFilter === key
                                ? 'bg-gray-900 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        {label} ({count})
                    </button>
                ))}
            </div>

            <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="hidden lg:grid grid-cols-[1.2fr_1fr_0.8fr_0.7fr_0.8fr_1.2fr] gap-4 border-b border-slate-100 bg-slate-50 px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    <span>Khách hàng</span>
                    <span>Phòng</span>
                    <span>Ngày</span>
                    <span>Tổng tiền</span>
                    <span>Trạng thái</span>
                    <span>Hành động</span>
                </div>

                {isLoading ? (
                    <div className="px-5 py-8 text-center text-sm text-gray-500">Đang tải...</div>
                ) : filteredBookings.length === 0 ? (
                    <div className="px-5 py-8 text-center text-sm text-gray-500">Không có đơn đặt phòng nào</div>
                ) : (
                    filteredBookings.map(booking => {
                        const isUpdating = Boolean(updatingIds[booking._id])
                        const statusConfig = getStatusConfig(booking.status)
                        const StatusIcon = statusConfig.icon
                        const canCheckIn = booking.status === 'confirmed' || booking.status === 'pending'
                        const canCheckOut = booking.status === 'checked_in' || booking.status === 'confirmed'
                        const isCompleted = booking.status === 'completed'
                        const isCancelled = booking.status === 'cancelled'

                        return (
                            <div key={booking._id} className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr_0.8fr_0.7fr_0.8fr_1.2fr] gap-4 border-t border-slate-100 px-5 py-4 text-sm hover:bg-slate-50/50 transition-colors">
                                {/* Customer */}
                                <div>
                                    <p className="font-medium text-gray-900 truncate">
                                        {booking.user?.username || booking.user?.email || 'Khách'}
                                    </p>
                                    <p className="text-xs text-gray-500 truncate">{booking.user?.email}</p>
                                </div>

                                {/* Room */}
                                <div>
                                    <p className="font-medium text-gray-900 truncate">{booking.room?.roomType}</p>
                                    <p className="text-xs text-gray-500">{booking.guests} khách</p>
                                </div>

                                {/* Dates */}
                                <div className="text-xs text-gray-600 space-y-1">
                                    <p>Nhận: {formatDateShort(booking.checkInDate)}</p>
                                    <p>Trả: {formatDateShort(booking.checkOutDate)}</p>
                                </div>

                                {/* Price */}
                                <div className="font-semibold text-gray-900">
                                    {formatCurrency(booking.totalPrice)}
                                </div>

                                {/* Status Badge */}
                                <div>
                                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${statusConfig.color}`}>
                                        <StatusIcon className="h-3 w-3" />
                                        {BOOKING_STATUS_LABELS[booking.status]}
                                    </span>
                                </div>

                                {/* Actions */}
                                <div className="flex flex-wrap items-center gap-2">
                                    {/* Payment Status */}
                                    <button
                                        disabled={isUpdating || isCompleted}
                                        onClick={() => updatePaymentStatus(booking._id, !booking.isPaid)}
                                        className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                                            booking.isPaid
                                                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                    >
                                        {booking.isPaid ? '✓ Đã TT' : '○ Chưa TT'}
                                    </button>

                                    {/* Check-in Button */}
                                    {canCheckIn && !isCancelled && (
                                        <button
                                            disabled={isUpdating}
                                            onClick={() => handleCheckIn(booking._id)}
                                            className="inline-flex items-center gap-1 rounded-lg bg-indigo-100 px-2.5 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                        >
                                            <LogIn className="h-3 w-3" />
                                            Nhận phòng
                                        </button>
                                    )}

                                    {/* Check-out Button */}
                                    {canCheckOut && !isCancelled && (
                                        <button
                                            disabled={isUpdating}
                                            onClick={() => {
                                                console.log('>>> Trả phòng button clicked!', booking._id, 'status:', booking.status)
                                                handleCheckOut(booking._id)
                                            }}
                                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-100 px-2.5 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                        >
                                            <LogOut className="h-3 w-3" />
                                            Trả phòng
                                        </button>
                                    )}

                                    {/* Cancel Button */}
                                    {!isCompleted && !isCancelled && booking.status !== 'checked_in' && (
                                        <button
                                            disabled={isUpdating}
                                            onClick={() => updateBookingStatus(booking._id, 'cancelled')}
                                            className="inline-flex items-center gap-1 rounded-lg bg-red-100 px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                        >
                                            <XCircle className="h-3 w-3" />
                                            Hủy
                                        </button>
                                    )}

                                    {/* Completed Badge */}
                                    {isCompleted && (
                                        <span className="text-xs text-emerald-600 font-medium">
                                            ✓ Hoàn thành
                                        </span>
                                    )}
                                </div>
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    )
}

export default Bookings
