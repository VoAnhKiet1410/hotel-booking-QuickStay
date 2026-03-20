import React, { useEffect, useState } from 'react'
import Title from '../../components/Title'
import { useAppContext } from '../../context/appContextCore'
import { toast } from 'react-hot-toast'
import { formatCurrency, formatDateShort } from '../../utils/formatters'
import {
    RotateCcw, XCircle, CheckCircle, Clock, AlertTriangle,
    BadgeCheck, User, Calendar, CreditCard, MessageSquare, Ban,
} from 'lucide-react'

// ── Tính số ngày trước check-in và tỷ lệ hoàn tiền ──
const calcRefundPolicy = (checkInDate, totalPrice, bookingStatus) => {
    // Đã trả phòng hoặc đang ở: dịch vụ đã/đang sử dụng → không hoàn tiền
    if (bookingStatus === 'completed') {
        return { percent: 0, amount: 0, label: 'Không hoàn — đã trả phòng', color: 'text-gray-500' }
    }
    if (bookingStatus === 'checked_in') {
        return { percent: 0, amount: 0, label: 'Không hoàn — đang lưu trú', color: 'text-gray-500' }
    }

    const now = new Date()
    const checkIn = new Date(checkInDate)
    const msPerDay = 1000 * 60 * 60 * 24
    const daysBefore = Math.ceil((checkIn - now) / msPerDay)

    if (daysBefore > 7) return { percent: 100, amount: totalPrice, label: 'Hoàn 100% (>7 ngày)', color: 'text-emerald-600' }
    if (daysBefore >= 3) return { percent: 50, amount: Math.round(totalPrice * 0.5), label: 'Hoàn 50% (3-7 ngày)', color: 'text-amber-600' }
    return { percent: 0, amount: 0, label: 'Không hoàn (<3 ngày)', color: 'text-red-600' }
}

// ── Badge trạng thái refundStatus ──
const RefundStatusBadge = ({ status }) => {
    const map = {
        not_requested: { label: 'Chưa yêu cầu', cls: 'bg-gray-100 text-gray-500' },
        pending: { label: 'Chờ xử lý', cls: 'bg-amber-100 text-amber-700 border border-amber-200' },
        processing: { label: 'Đang xử lý', cls: 'bg-blue-100 text-blue-700 border border-blue-200' },
        completed: { label: 'Đã hoàn', cls: 'bg-emerald-100 text-emerald-700 border border-emerald-200' },
        failed: { label: 'Thất bại', cls: 'bg-red-100 text-red-700 border border-red-200' },
        rejected: { label: 'Từ chối', cls: 'bg-slate-100 text-slate-600 border border-slate-200' },
    }
    const cfg = map[status] || map.not_requested
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.cls}`}>
            {cfg.label}
        </span>
    )
}

// ── Badge trạng thái booking ──
const BookingStatusBadge = ({ status }) => {
    const map = {
        pending: { label: 'Chờ xác nhận', cls: 'bg-amber-50 text-amber-700' },
        confirmed: { label: 'Đã xác nhận', cls: 'bg-blue-50 text-blue-700' },
        checked_in: { label: 'Đang ở', cls: 'bg-indigo-50 text-indigo-700' },
        completed: { label: 'Đã trả phòng', cls: 'bg-emerald-50 text-emerald-700' },
        cancelled: { label: 'Đã hủy', cls: 'bg-red-50 text-red-600' },
    }
    const cfg = map[status] || { label: status, cls: 'bg-gray-100 text-gray-500' }
    return (
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${cfg.cls}`}>
            {cfg.label}
        </span>
    )
}

// ── Modal xử lý yêu cầu hoàn tiền ──
const ProcessModal = ({ booking, onClose, onSuccess, axios }) => {
    const [action, setAction] = useState('approve')
    const [rejectedReason, setRejectedReason] = useState('')
    const [cancelReason, setCancelReason] = useState('')
    const [overrideAmount, setOverrideAmount] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    // Sync action mặc định mỗi khi booking thay đổi (tránh stale state giữa các modal)
    useEffect(() => {
        if (!booking) return
        setAction(booking.status === 'cancelled' ? 'approve' : 'cancel_booking')
        // Reset form fields khi booking đổi
        setRejectedReason('')
        setCancelReason('')
        setOverrideAmount('')
    }, [booking?._id, booking?.status])

    if (!booking) return null

    const policy = calcRefundPolicy(booking.checkInDate, booking.totalPrice, booking.status)
    const guestName = booking.user?.username || booking.user?.email || 'Khách'
    const roomType = booking.room?.roomType || 'Phòng'
    const isAlreadyCancelled = booking.status === 'cancelled'
    const isCompleted = booking.status === 'completed'
    const isCheckedIn = booking.status === 'checked_in'

    // Có thể auto refund khi cancel
    const willAutoRefund = !isAlreadyCancelled && !isCompleted && !isCheckedIn && booking.isPaid && booking.paymentMethod === 'stripe' && !booking.isRefunded

    const handleSubmit = async () => {
        if (!axios) return

        if (action === 'reject' && !rejectedReason.trim()) {
            toast.error('Vui lòng nhập lý do từ chối')
            return
        }
        if (action === 'cancel_booking' && !cancelReason.trim()) {
            toast.error('Vui lòng nhập lý do hủy đặt phòng')
            return
        }

        setIsLoading(true)
        try {
            // ── Action: Hủy đặt phòng ──
            if (action === 'cancel_booking') {
                const { data } = await axios.patch(`/api/bookings/owner/${booking._id}`, {
                    status: 'cancelled',
                    cancelReason: cancelReason.trim(),
                })
                if (data?.success) {
                    const hadAutoRefund = data.data?.isRefunded
                    toast.success(
                        hadAutoRefund
                            ? `Đã hủy đặt phòng của ${guestName} và hoàn tiền Stripe tự động thành công!`
                            : `Đã hủy đặt phòng của ${guestName}. Khách sẽ nhận email thông báo.`,
                    )
                    onSuccess(booking._id, 'cancel_booking', data.data)
                    onClose()
                }
                return
            }

            // ── Action: Duyệt / Từ chối hoàn tiền ──
            const payload = { action }
            if (action === 'reject') payload.rejectedReason = rejectedReason.trim()
            if (action === 'approve' && overrideAmount) {
                const amt = parseInt(overrideAmount, 10)
                if (!isNaN(amt) && amt > 0) payload.refundAmount = amt
            }

            const { data } = await axios.patch(
                `/api/bookings/owner/${booking._id}/refund-request`,
                payload,
            )

            if (data?.success) {
                toast.success(
                    action === 'approve'
                        ? `Hoàn tiền ${formatCurrency(data.data?.refund?.amount ?? policy.amount)} thành công! Tiền về trong 5-10 ngày.`
                        : 'Đã từ chối yêu cầu hoàn tiền. Khách sẽ được thông báo.',
                )
                onSuccess(booking._id, action, data.data)
                onClose()
            }
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại')
        } finally {
            setIsLoading(false)
        }
    }

    // Button config theo action
    const submitConfig = {
        approve: { label: 'Xác nhận hoàn tiền', cls: 'bg-emerald-600 hover:bg-emerald-700' },
        reject: { label: 'Từ chối yêu cầu', cls: 'bg-red-600 hover:bg-red-700' },
        cancel_booking: { label: 'Xác nhận hủy đặt phòng', cls: 'bg-orange-600 hover:bg-orange-700' },
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
                {/* Header */}
                <div className="flex items-start justify-between border-b border-slate-100 px-6 py-4">
                    <div>
                        <h2 className="text-base font-semibold text-gray-900">Xử lý yêu cầu hoàn tiền</h2>
                        <div className="mt-1 flex items-center gap-2">
                            <p className="text-xs text-gray-500">{guestName} — {roomType}</p>
                            <BookingStatusBadge status={booking.status} />
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 transition-colors"
                    >
                        <XCircle className="h-5 w-5" />
                    </button>
                </div>

                <div className="px-6 py-4 space-y-4">
                    {/* Booking info */}
                    <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                            <User className="h-3.5 w-3.5 text-slate-400" />
                            <span className="font-medium text-gray-800">{guestName}</span>
                            <span className="text-gray-400 text-xs">·</span>
                            <span className="text-xs text-gray-500">{booking.user?.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            <span className="text-xs">
                                {formatDateShort(booking.checkInDate)} → {formatDateShort(booking.checkOutDate)}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CreditCard className="h-3.5 w-3.5 text-slate-400" />
                            <span className="font-semibold text-gray-900">{formatCurrency(booking.totalPrice)}</span>
                            <span className={`ml-1 text-xs font-medium ${policy.color}`}>
                                → {policy.label}
                                {policy.amount > 0 && ` (${formatCurrency(policy.amount)})`}
                            </span>
                        </div>
                        {booking.refundRequest?.reason && (
                            <div className="flex items-start gap-2 text-gray-600">
                                <MessageSquare className="h-3.5 w-3.5 text-slate-400 mt-0.5" />
                                <span className="text-xs italic">"{booking.refundRequest.reason}"</span>
                            </div>
                        )}
                    </div>

                    {/* Action selector — 3 buttons */}
                    <div className="grid grid-cols-3 gap-2">
                        {/* Duyệt hoàn tiền */}
                        <button
                            onClick={() => setAction('approve')}
                            disabled={!isAlreadyCancelled}
                            title={!isAlreadyCancelled ? 'Booking chưa bị hủy — hãy hủy trước' : ''}
                            className={`flex flex-col items-center rounded-xl border-2 py-3 text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed ${action === 'approve'
                                ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                : 'border-slate-200 text-slate-500 hover:border-slate-300'
                                }`}
                        >
                            <CheckCircle className="mb-1 h-4 w-4" />
                            Duyệt hoàn tiền
                        </button>

                        {/* Từ chối */}
                        <button
                            onClick={() => setAction('reject')}
                            disabled={!isAlreadyCancelled}
                            title={!isAlreadyCancelled ? 'Booking chưa bị hủy' : ''}
                            className={`flex flex-col items-center rounded-xl border-2 py-3 text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed ${action === 'reject'
                                ? 'border-red-500 bg-red-50 text-red-700'
                                : 'border-slate-200 text-slate-500 hover:border-slate-300'
                                }`}
                        >
                            <XCircle className="mb-1 h-4 w-4" />
                            Từ chối
                        </button>

                    {/* Hủy đặt phòng */}
                        <button
                            onClick={() => setAction('cancel_booking')}
                            disabled={isAlreadyCancelled || isCompleted || isCheckedIn}
                            title={
                                isAlreadyCancelled ? 'Booking đã bị hủy rồi' :
                                isCompleted ? 'Không thể hủy — khách đã trả phòng' :
                                isCheckedIn ? 'Không thể hủy — khách đang lưu trú' : ''
                            }
                            className={`flex flex-col items-center rounded-xl border-2 py-3 text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed ${action === 'cancel_booking'
                                ? 'border-orange-500 bg-orange-50 text-orange-700'
                                : 'border-slate-200 text-slate-500 hover:border-slate-300'
                                }`}
                        >
                            <Ban className="mb-1 h-4 w-4" />
                            Hủy đặt phòng
                        </button>
                    </div>

                    {/* Hướng dẫn context */}
                    {isCompleted && (
                        <div className="flex items-start gap-2 rounded-lg bg-gray-50 border border-gray-200 px-3 py-2">
                            <AlertTriangle className="h-3.5 w-3.5 text-gray-400 mt-0.5 shrink-0" />
                            <p className="text-xs text-gray-500">
                                Khách đã <strong>trả phòng</strong> — dịch vụ đã hoàn tất. <strong>Không thể hủy hoặc hoàn tiền tự động.</strong> Nếu cần hỗ trợ, vui lòng xử lý thủ công.
                            </p>
                        </div>
                    )}
                    {isCheckedIn && (
                        <div className="flex items-start gap-2 rounded-lg bg-indigo-50 border border-indigo-200 px-3 py-2">
                            <AlertTriangle className="h-3.5 w-3.5 text-indigo-400 mt-0.5 shrink-0" />
                            <p className="text-xs text-indigo-700">
                                Khách đang <strong>lưu trú</strong>. Không thể hủy khi khách đã nhận phòng.
                            </p>
                        </div>
                    )}
                    {isAlreadyCancelled && (
                        <p className="text-xs text-gray-400 text-center">
                            Booking đã hủy — chọn <strong>Duyệt</strong> để hoàn tiền hoặc <strong>Từ chối</strong> để không hoàn.
                        </p>
                    )}
                    {!isAlreadyCancelled && !isCompleted && !isCheckedIn && (
                        <div className="flex items-start gap-2 rounded-lg bg-orange-50 border border-orange-200 px-3 py-2">
                            <AlertTriangle className="h-3.5 w-3.5 text-orange-500 mt-0.5 shrink-0" />
                            <p className="text-xs text-orange-700">
                                Booking <strong>chưa bị hủy</strong>. Sử dụng <strong>Hủy đặt phòng</strong> để cancel và xử lý hoàn tiền tự động
                                {willAutoRefund && ' (sẽ tự hoàn tiền Stripe nếu đủ điều kiện)'}.
                            </p>
                        </div>
                    )}

                    {/* ── Approve options ── */}
                    {action === 'approve' && (
                        <div className="space-y-2">
                            <label className="block text-xs font-medium text-gray-600">
                                Số tiền hoàn <span className="text-gray-400">(để trống = áp dụng policy tự động)</span>
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    placeholder={`Policy: ${formatCurrency(policy.amount)}`}
                                    value={overrideAmount}
                                    onChange={(e) => setOverrideAmount(e.target.value)}
                                    min={0}
                                    max={booking.totalPrice}
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">₫</span>
                            </div>
                            <p className="text-xs text-gray-400">
                                Tối đa: {formatCurrency(booking.totalPrice)} · Đề xuất: {formatCurrency(policy.amount)} ({policy.percent}%)
                            </p>
                        </div>
                    )}

                    {/* ── Reject reason ── */}
                    {action === 'reject' && (
                        <div className="space-y-2">
                            <label className="block text-xs font-medium text-gray-600">
                                Lý do từ chối <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                rows={3}
                                placeholder="Vd: Đã qua thời hạn hủy miễn phí, chính sách không hoàn tiền..."
                                value={rejectedReason}
                                onChange={(e) => setRejectedReason(e.target.value)}
                                className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                            />
                        </div>
                    )}

                    {/* ── Cancel booking reason ── */}
                    {action === 'cancel_booking' && (
                        <div className="space-y-2">
                            <label className="block text-xs font-medium text-gray-600">
                                Lý do hủy <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                rows={3}
                                placeholder="Vd: Phòng không còn trống trong ngày đó, sự cố kỹ thuật..."
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                                className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                            />
                            {willAutoRefund && (
                                <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2">
                                    <CheckCircle className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                                    <p className="text-xs text-emerald-700">
                                        <strong>Tự động hoàn tiền Stripe:</strong> {formatCurrency(booking.totalPrice)} sẽ được hoàn ngay sau khi hủy.
                                    </p>
                                </div>
                            )}
                            {!willAutoRefund && booking.isPaid && (
                                <div className="flex items-center gap-2 rounded-lg bg-slate-50 border border-slate-200 px-3 py-2">
                                    <AlertTriangle className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                                    <p className="text-xs text-slate-600">
                                        Thanh toán tại khách sạn — cần xử lý hoàn tiền thủ công sau khi hủy.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
                    >
                        Đóng
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className={`inline-flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-medium text-white transition-all disabled:opacity-60 ${submitConfig[action]?.cls}`}
                    >
                        {isLoading && <RotateCcw className="h-3.5 w-3.5 animate-spin" />}
                        {submitConfig[action]?.label}
                    </button>
                </div>
            </div>
        </div>
    )
}

// ═══════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════
const RefundRequests = () => {
    const { axios } = useAppContext()
    const [requests, setRequests] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [selectedBooking, setSelectedBooking] = useState(null)

    useEffect(() => {
        let cancelled = false
        const fetch = async () => {
            if (!axios) return
            try {
                setIsLoading(true)
                const { data } = await axios.get('/api/bookings/owner/refund-requests')
                if (!cancelled) setRequests(Array.isArray(data?.data) ? data.data : [])
            } catch {
                if (!cancelled) toast.error('Không thể tải danh sách yêu cầu hoàn tiền')
            } finally {
                if (!cancelled) setIsLoading(false)
            }
        }
        fetch()
        return () => { cancelled = true }
    }, [axios])

    // Xóa item khỏi danh sách sau khi xử lý
    const handleSuccess = (bookingId) => {
        setRequests(prev => prev.filter(b => b._id !== bookingId))
    }

    return (
        <div className="max-w-5xl">
            {/* Process Modal */}
            {selectedBooking && (
                <ProcessModal
                    booking={selectedBooking}
                    onClose={() => setSelectedBooking(null)}
                    onSuccess={handleSuccess}
                    axios={axios}
                />
            )}

            <Title
                align="left"
                font="font-outfit"
                title="Yêu cầu hoàn tiền"
                subTitle="Xem xét và xử lý các yêu cầu hoàn tiền từ khách hàng."
            />

            {/* Stats bar */}
            <div className="mt-5 flex items-center gap-3">
                <div className="flex items-center gap-2 rounded-full bg-amber-50 border border-amber-200 px-3.5 py-1.5">
                    <Clock className="h-3.5 w-3.5 text-amber-600" />
                    <span className="text-xs font-semibold text-amber-700">
                        {requests.length} yêu cầu đang chờ
                    </span>
                </div>
                {requests.length === 0 && !isLoading && (
                    <span className="text-xs text-gray-400">Không có yêu cầu mới</span>
                )}
            </div>

            <div className="mt-4 space-y-3">
                {isLoading ? (
                    // Skeleton
                    Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-100" />
                    ))
                ) : requests.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-16 text-center">
                        <CheckCircle className="h-10 w-10 text-emerald-400 mb-3" />
                        <p className="text-sm font-medium text-gray-500">Không có yêu cầu hoàn tiền nào đang chờ</p>
                        <p className="mt-1 text-xs text-gray-400">Tất cả yêu cầu đã được xử lý</p>
                    </div>
                ) : (
                    requests.map((booking) => {
                        const guestName = booking.user?.username || booking.user?.email || 'Khách'
                        const roomType = booking.room?.roomType || 'Phòng'
                        const policy = calcRefundPolicy(booking.checkInDate, booking.totalPrice, booking.status)
                        const requestedAt = booking.refundRequest?.requestedAt
                            ? new Date(booking.refundRequest.requestedAt).toLocaleString('vi-VN')
                            : '—'

                        return (
                            <div
                                key={booking._id}
                                className="group rounded-2xl border border-amber-200 bg-white shadow-sm hover:shadow-md transition-all overflow-hidden"
                            >
                                {/* Top accent */}
                                <div className="h-1 bg-gradient-to-r from-amber-400 to-orange-400" />

                                <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 p-5">
                                    {/* Left: booking info */}
                                    <div className="space-y-3">
                                        {/* Guest + room */}
                                        <div className="flex flex-wrap items-center gap-3">
                                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-amber-700 font-semibold text-sm shrink-0">
                                                {guestName.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900 text-sm">{guestName}</p>
                                                <p className="text-xs text-gray-400">{booking.user?.email}</p>
                                            </div>
                                            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                                                {roomType}
                                            </span>
                                            <RefundStatusBadge status={booking.refundStatus || 'pending'} />
                                        </div>

                                        {/* Details row */}
                                        <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {formatDateShort(booking.checkInDate)} → {formatDateShort(booking.checkOutDate)}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <CreditCard className="h-3 w-3" />
                                                <strong className="text-gray-700">{formatCurrency(booking.totalPrice)}</strong>
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                Yêu cầu lúc {requestedAt}
                                            </span>
                                        </div>

                                        {/* Policy estimate */}
                                        <div className="flex items-center gap-2 rounded-lg bg-slate-50 border border-slate-100 px-3 py-2 w-fit">
                                            <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                                            <span className="text-xs text-gray-600">
                                                Policy đề xuất:{' '}
                                                <strong className={policy.color}>{policy.label}</strong>
                                                {policy.amount > 0 && (
                                                    <> — hoàn <strong>{formatCurrency(policy.amount)}</strong></>
                                                )}
                                            </span>
                                        </div>

                                        {/* Guest reason */}
                                        {booking.refundRequest?.reason && (
                                            <div className="flex items-start gap-2 text-xs text-gray-500 italic">
                                                <MessageSquare className="h-3 w-3 mt-0.5 shrink-0 text-slate-400" />
                                                <span>"{booking.refundRequest.reason}"</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Right: actions */}
                                    <div className="flex flex-col items-end justify-center gap-2 shrink-0">
                                        <button
                                            onClick={() => setSelectedBooking(booking)}
                                            className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-gray-700 transition-all active:scale-95"
                                        >
                                            <BadgeCheck className="h-3.5 w-3.5" />
                                            Xử lý yêu cầu
                                        </button>
                                        <p className="text-[10px] text-gray-400">
                                            Duyệt hoặc từ chối
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    )
}

export default RefundRequests
