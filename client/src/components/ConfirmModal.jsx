import React from 'react'
import { X, AlertCircle, CheckCircle, LogIn, LogOut } from 'lucide-react'

const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  type = 'default', // 'default' | 'success' | 'warning' | 'danger' | 'checkin' | 'checkout'
  isLoading = false,
  extraContent = null, // Nội dung tùy chỉnh (VD: checkbox xác nhận thanh toán)
}) => {
  if (!isOpen) return null

  const typeConfig = {
    default: {
      icon: AlertCircle,
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-100',
      confirmBg: 'bg-blue-600 hover:bg-blue-700',
    },
    success: {
      icon: CheckCircle,
      iconColor: 'text-emerald-600',
      iconBg: 'bg-emerald-100',
      confirmBg: 'bg-emerald-600 hover:bg-emerald-700',
    },
    warning: {
      icon: AlertCircle,
      iconColor: 'text-amber-600',
      iconBg: 'bg-amber-100',
      confirmBg: 'bg-amber-600 hover:bg-amber-700',
    },
    danger: {
      icon: AlertCircle,
      iconColor: 'text-red-600',
      iconBg: 'bg-red-100',
      confirmBg: 'bg-red-600 hover:bg-red-700',
    },
    checkin: {
      icon: LogIn,
      iconColor: 'text-indigo-600',
      iconBg: 'bg-indigo-100',
      confirmBg: 'bg-indigo-600 hover:bg-indigo-700',
    },
    checkout: {
      icon: LogOut,
      iconColor: 'text-emerald-600',
      iconBg: 'bg-emerald-100',
      confirmBg: 'bg-emerald-600 hover:bg-emerald-700',
    },
    refund: {
      icon: AlertCircle,
      iconColor: 'text-violet-600',
      iconBg: 'bg-violet-100',
      confirmBg: 'bg-violet-600 hover:bg-violet-700',
    },
  }

  const config = typeConfig[type] || typeConfig.default
  const Icon = config.icon

  const handleConfirm = () => {
    onConfirm()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md transform overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl transition-all">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Content */}
        <div className="p-6">
          {/* Icon */}
          <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${config.iconBg}`}>
            <Icon className={`h-7 w-7 ${config.iconColor}`} />
          </div>

          {/* Title */}
          <h3 className="mt-4 text-center text-xl font-semibold text-gray-900">
            {title}
          </h3>

          {/* Message — whitespace-pre-line để hỗ trợ \n trong string */}
          <p className="mt-2 text-center text-sm leading-relaxed text-gray-600 whitespace-pre-line">
            {message}
          </p>

          {/* Extra content — VD: checkbox xác nhận thanh toán */}
          {extraContent}

          {/* Actions */}
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-2.5 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isLoading}
              className={`inline-flex items-center justify-center rounded-full px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${config.confirmBg}`}
            >
              {isLoading ? (
                <>
                  <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Đang xử lý...
                </>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConfirmModal
