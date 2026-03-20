import React, { useMemo } from 'react'
import { X, AlertCircle, RotateCcw, CheckCircle2, Copy, ExternalLink } from 'lucide-react'
import { toast } from 'react-hot-toast'

/**
 * Tính chính sách hoàn tiền theo ngày (mirror logic từ backend)
 * @param {string} checkInDate
 * @param {number} totalPrice
 */
const calculateRefundPolicy = (checkInDate, totalPrice) => {
  if (!checkInDate || !totalPrice) return null
  const now = new Date()
  const checkIn = new Date(checkInDate)
  const msPerDay = 1000 * 60 * 60 * 24
  const daysBeforeCheckIn = Math.ceil((checkIn - now) / msPerDay)

  if (daysBeforeCheckIn <= 0) {
    return { percent: 0, amount: 0, label: 'Đã qua ngày nhận phòng', color: 'red', days: daysBeforeCheckIn }
  } else if (daysBeforeCheckIn > 7) {
    return { percent: 100, amount: totalPrice, label: 'Hoàn tiền đầy đủ', color: 'emerald', days: daysBeforeCheckIn }
  } else if (daysBeforeCheckIn >= 3) {
    return {
      percent: 50,
      amount: Math.round(totalPrice * 0.5),
      label: 'Hoàn tiền 50%',
      color: 'amber',
      days: daysBeforeCheckIn,
    }
  } else {
    return { percent: 0, amount: 0, label: 'Không hoàn tiền', color: 'red', days: daysBeforeCheckIn }
  }
}

/**
 * Nút copy nhỏ — copy text vào clipboard
 */
const CopyButton = ({ text }) => {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Đã sao chép!', { duration: 1500 })
    } catch {
      // Fallback nếu clipboard API không khả dụng
      toast.error('Không thể sao chép')
    }
  }
  return (
    <button
      type="button"
      onClick={handleCopy}
      className="ml-1.5 inline-flex items-center rounded p-0.5 text-gray-400 hover:text-gray-600 transition-colors"
      title="Sao chép"
    >
      <Copy className="h-3 w-3" />
    </button>
  )
}

/**
 * Success view — hiển thị sau khi Stripe refund thành công
 */
const RefundSuccessView = ({ bookingDetails, refundResult, onClose }) => {
  const refundAmountVND = (refundResult.refundAmount ?? 0).toLocaleString('vi-VN')
  const isFullRefund = refundResult.refundType === 'full'
  const policyLabel = refundResult.policy?.policyLabel || (isFullRefund ? 'Hoàn tiền đầy đủ' : 'Hoàn tiền một phần')

  return (
    <>
      {/* Header — success */}
      <div className="relative bg-gradient-to-br from-emerald-50 to-teal-50 px-6 py-5">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1 text-gray-400 transition-colors hover:bg-white/50 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              Hoàn tiền thành công
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              Giao dịch hoàn tiền đã được xử lý qua Stripe
            </p>
          </div>
        </div>
      </div>

      {/* Content — refund details */}
      <div className="px-6 py-5">
        <div className="space-y-4">

          {/* Số tiền hoàn — nổi bật */}
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-5 text-center">
            <p className="text-xs font-medium uppercase tracking-wider text-emerald-600 mb-1">
              Số tiền hoàn trả
            </p>
            <p className="text-3xl font-bold text-emerald-700">
              {refundAmountVND}₫
            </p>
            <span className={`mt-2 inline-block rounded-full px-3 py-0.5 text-xs font-semibold ${
              isFullRefund
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-amber-100 text-amber-700'
            }`}>
              {isFullRefund ? 'Hoàn tiền toàn bộ' : 'Hoàn tiền một phần'}
            </span>
          </div>

          {/* Chi tiết giao dịch */}
          <div className="rounded-xl bg-gray-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
              Chi tiết giao dịch
            </p>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Khách sạn</span>
                <span className="font-medium text-gray-900 text-right max-w-[200px] truncate">
                  {bookingDetails?.hotelName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Tổng tiền đặt</span>
                <span className="font-medium text-gray-900">
                  {(bookingDetails?.amount ?? 0).toLocaleString('vi-VN')}₫
                </span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-2">
                <span className="text-gray-500">Đã hoàn</span>
                <span className="font-bold text-emerald-600">
                  {refundAmountVND}₫
                  {refundResult.policy && (
                    <span className="ml-1 text-xs font-normal text-gray-400">
                      ({refundResult.policy.refundPercent}%)
                    </span>
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Chính sách áp dụng</span>
                <span className="text-xs font-medium text-gray-700 text-right max-w-[200px]">
                  {policyLabel}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Trạng thái Stripe</span>
                <span className="inline-flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span className="text-xs font-medium text-emerald-600 capitalize">
                    {refundResult.stripeRefundStatus || 'succeeded'}
                  </span>
                </span>
              </div>
              {refundResult.stripeRefundId && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Mã giao dịch</span>
                  <span className="inline-flex items-center text-xs font-mono text-gray-600">
                    {refundResult.stripeRefundId.slice(0, 20)}…
                    <CopyButton text={refundResult.stripeRefundId} />
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-3">
            <div className="flex gap-2 text-xs text-blue-800">
              <ExternalLink className="h-4 w-4 mt-0.5 shrink-0 text-blue-500" />
              <div>
                <p className="font-semibold">Thời gian hoàn tiền</p>
                <p className="mt-0.5 text-blue-700">
                  Tiền sẽ được hoàn về phương thức thanh toán gốc trong <strong>5-10 ngày làm việc</strong>.
                  Bạn có thể kiểm tra trạng thái tại ngân hàng hoặc liên hệ khách sạn nếu cần hỗ trợ.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-100 bg-gray-50 px-6 py-4">
        <button
          type="button"
          onClick={onClose}
          className="w-full rounded-full bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:bg-gray-800 active:scale-[0.98]"
        >
          Đã hiểu, đóng
        </button>
      </div>
    </>
  )
}

/**
 * RefundModal — xác nhận hoàn tiền hoặc hiển thị kết quả
 *
 * @param {boolean}  isOpen          - Modal mở hay đóng
 * @param {function} onClose         - Đóng modal
 * @param {function} onConfirm       - Xác nhận hoàn tiền
 * @param {boolean}  isLoading       - Đang xử lý
 * @param {object}   bookingDetails  - { id, hotelName, amount, checkInDate }
 * @param {object|null} refundResult - Kết quả refund từ API (null = chưa refund)
 */
const RefundModal = ({ isOpen, onClose, onConfirm, isLoading, bookingDetails, refundResult }) => {
  // bookingDetails: { id, hotelName, amount (totalPrice), checkInDate }
  const policy = useMemo(
    () => calculateRefundPolicy(bookingDetails?.checkInDate, bookingDetails?.amount),
    [bookingDetails?.checkInDate, bookingDetails?.amount]
  )

  if (!isOpen) return null

  const colorMap = {
    emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700' },
    amber: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-700' },
    red: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', badge: 'bg-red-100 text-red-600' },
  }
  const c = colorMap[policy?.color ?? 'emerald']
  const canRefund = !policy || policy.percent > 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all animate-in zoom-in-95 duration-200">

        {/* === REFUND THÀNH CÔNG → hiển thị kết quả chi tiết === */}
        {refundResult ? (
          <RefundSuccessView
            bookingDetails={bookingDetails}
            refundResult={refundResult}
            onClose={onClose}
          />
        ) : (
          <>
            {/* Header */}
            <div className="relative bg-gradient-to-br from-red-50 to-orange-50 px-6 py-5">
              <button
                onClick={onClose}
                className="absolute right-4 top-4 rounded-full p-1 text-gray-400 transition-colors hover:bg-white/50 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-100">
                  <RotateCcw className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Xác nhận hoàn tiền
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Vui lòng đọc chính sách hoàn tiền trước khi xác nhận
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 py-5">
              <div className="space-y-4">
                {/* Booking info */}
                <div className="rounded-xl bg-gray-50 p-4">
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Khách sạn:</span>
                      <span className="font-semibold text-gray-900">{bookingDetails?.hotelName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tổng tiền đặt:</span>
                      <span className="font-medium text-gray-900">
                        {bookingDetails?.amount?.toLocaleString('vi-VN')}₫
                      </span>
                    </div>
                    {policy && (
                      <div className="flex justify-between border-t border-gray-200 pt-2">
                        <span className="text-gray-600">Số tiền được hoàn:</span>
                        <span className={`font-bold text-base ${policy.percent === 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                          {policy.amount.toLocaleString('vi-VN')}₫
                          {' '}
                          <span className="text-xs font-normal text-gray-400">({policy.percent}%)</span>
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Thời gian hoàn:</span>
                      <span className="font-medium text-gray-900">5-10 ngày làm việc</span>
                    </div>
                  </div>
                </div>

                {/* Cancellation policy */}
                {policy && (
                  <div className={`rounded-xl border p-4 ${c.bg} ${c.border}`}>
                    <div className="mb-2 flex items-center justify-between">
                      <p className={`text-sm font-semibold ${c.text}`}>Chính sách hủy phòng</p>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${c.badge}`}>
                        {policy.label}
                      </span>
                    </div>
                    <p className={`text-xs ${c.text} opacity-80`}>
                      Còn <strong>{policy.days}</strong> ngày trước ngày nhận phòng
                    </p>
                    {/* Policy table mini */}
                    <div className="mt-3 space-y-1 text-[11px] text-gray-600">
                      {[
                        { cond: '> 7 ngày', val: '100%', active: policy.days > 7 },
                        { cond: '3 – 7 ngày', val: '50%', active: policy.days >= 3 && policy.days <= 7 },
                        { cond: '< 3 ngày', val: '0%', active: policy.days < 3 },
                      ].map((row) => (
                        <div
                          key={row.cond}
                          className={`flex justify-between rounded px-2 py-1 ${row.active ? 'bg-white/60 font-semibold' : 'opacity-50'}`}
                        >
                          <span>Hủy trước {row.cond}</span>
                          <span>{row.val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Warning */}
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                  <div className="flex gap-2 text-xs text-amber-800">
                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-amber-600" />
                    <div>
                      <p className="font-semibold">Lưu ý:</p>
                      <ul className="mt-1 space-y-0.5 text-amber-700">
                        <li>• Hành động này không thể hoàn tác</li>
                        <li>• Đặt phòng sẽ bị hủy ngay lập tức</li>
                        {canRefund && <li>• Tiền sẽ được hoàn về tài khoản gốc trong 5-10 ngày</li>}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 border-t border-gray-100 bg-gray-50 px-6 py-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 rounded-full border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={isLoading || !canRefund}
                className={`flex-1 rounded-full px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${canRefund
                  ? 'bg-gradient-to-r from-red-600 to-red-500 shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40'
                  : 'bg-gray-400 cursor-not-allowed'
                  }`}
                title={!canRefund ? 'Không thể hoàn tiền theo chính sách hủy phòng' : undefined}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Đang xử lý...
                  </span>
                ) : canRefund ? (
                  `Xác nhận hoàn ${policy?.amount?.toLocaleString('vi-VN')}₫`
                ) : (
                  'Không đủ điều kiện hoàn tiền'
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default RefundModal
