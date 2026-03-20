import React, { useEffect, useRef } from 'react';
import { useAppContext } from '../context/appContextCore';
import {
    CalendarCheck, CalendarX, ClipboardCheck,
    CreditCard, MessageCircle, Bell, X, ArrowRight,
    CheckCircle2, LogIn, Star, AlertCircle, Clock, RotateCcw, AlertTriangle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

/**
 * NotificationDropdown — Luxury refined style, phù hợp với Drake UI
 * Hiển thị thông báo đặt phòng, hủy phòng, tin nhắn, thanh toán real-time.
 */
const NotificationDropdown = ({ isOpen, onClose, notifications, onClearAll }) => {
    const dropdownRef = useRef(null);
    const { navigate } = useAppContext();

    // Đóng khi click ngoài
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                onClose();
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    // Cấu hình từng loại thông báo
    const typeConfig = {
        new_booking: {
            icon: CalendarCheck,
            color: 'text-emerald-500',
            dot: 'bg-emerald-400',
            label: 'Đặt phòng mới',
            labelColor: 'text-emerald-600',
            bar: 'bg-emerald-400',
        },
        booking_cancelled: {
            icon: CalendarX,
            color: 'text-rose-400',
            dot: 'bg-rose-400',
            label: 'Hủy phòng',
            labelColor: 'text-rose-500',
            bar: 'bg-rose-400',
        },
        booking_status_updated: {
            icon: ClipboardCheck,
            color: 'text-sky-400',
            dot: 'bg-sky-400',
            label: 'Cập nhật',
            labelColor: 'text-sky-500',
            bar: 'bg-sky-400',
        },
        payment_success: {
            icon: CreditCard,
            color: 'text-teal-400',
            dot: 'bg-teal-400',
            label: 'Thanh toán',
            labelColor: 'text-teal-600',
            bar: 'bg-teal-400',
        },
        new_message: {
            icon: MessageCircle,
            color: 'text-violet-400',
            dot: 'bg-violet-400',
            label: 'Tin nhắn',
            labelColor: 'text-violet-500',
            bar: 'bg-violet-400',
        },
        // === Vòng đời booking — phân tách rõ ràng ===
        booking_pending: {
            icon: Clock,
            color: 'text-amber-500',
            dot: 'bg-amber-400',
            label: 'Chờ xác nhận',
            labelColor: 'text-amber-600',
            bar: 'bg-amber-400',
        },
        booking_confirmed: {
            icon: CheckCircle2,
            color: 'text-emerald-500',
            dot: 'bg-emerald-400',
            label: 'Đã xác nhận',
            labelColor: 'text-emerald-600',
            bar: 'bg-emerald-500',
        },
        booking_checked_in: {
            icon: LogIn,
            color: 'text-teal-500',
            dot: 'bg-teal-400',
            label: 'Nhận phòng',
            labelColor: 'text-teal-600',
            bar: 'bg-teal-500',
        },
        booking_completed: {
            icon: Star,
            color: 'text-amber-500',
            dot: 'bg-amber-400',
            label: 'Hoàn thành',
            labelColor: 'text-amber-600',
            bar: 'bg-amber-400',
        },
        booking_cancelled_by_owner: {
            icon: AlertCircle,
            color: 'text-orange-500',
            dot: 'bg-orange-400',
            label: 'Chủ hủy phòng',
            labelColor: 'text-orange-600',
            bar: 'bg-orange-400',
        },
        booking_cancelled_by_guest: {
            icon: AlertCircle,
            color: 'text-red-500',
            dot: 'bg-red-400',
            label: 'Đã hủy',
            labelColor: 'text-red-600',
            bar: 'bg-red-400',
        },
        booking_refunded: {
            icon: RotateCcw,
            color: 'text-violet-500',
            dot: 'bg-violet-400',
            label: 'Đã hoàn tiền',
            labelColor: 'text-violet-600',
            bar: 'bg-violet-400',
        },
        // Owner nhận: guest yêu cầu hoàn tiền sau khi tự hủy
        booking_refund_requested: {
            icon: AlertTriangle,
            color: 'text-red-600',
            dot: 'bg-red-500',
            label: '➡️ Yêu cầu hoàn tiền',
            labelColor: 'text-red-700',
            bar: 'bg-red-500',
        },
    };

    const getConfig = (type) => typeConfig[type] || {
        icon: Bell,
        color: 'text-slate-400',
        dot: 'bg-slate-400',
        label: 'Thông báo',
        labelColor: 'text-slate-500',
        bar: 'bg-slate-400',
    };

    const handleNotifClick = (notif) => {
        if (notif.type === 'booking_refund_requested') {
            // Owner nhận thông báo → đến thẳng trang xử lý hoàn tiền
            navigate('/owner/refund-requests');
        } else if (notif.type === 'new_booking' || notif.type === 'booking_cancelled') {
            navigate('/owner/bookings');
        } else if (notif.bookingId && notif.type !== 'new_message') {
            navigate('/my-bookings');
        }
        onClose();
    };

    return (
        <div
            ref={dropdownRef}
            onClick={(e) => e.stopPropagation()}
            style={{
                animation: 'notifSlideIn 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            }}
            className="absolute right-0 top-14 w-[360px] z-50 overflow-hidden
                        rounded-2xl border border-white/60
                        bg-white/80 backdrop-blur-2xl
                        shadow-[0_20px_60px_-10px_rgba(0,0,0,0.18),0_0_0_1px_rgba(255,255,255,0.8)]"
        >
            <style>{`
                @keyframes notifSlideIn {
                    from { opacity: 0; transform: translateY(-8px) scale(0.97); }
                    to   { opacity: 1; transform: translateY(0)   scale(1); }
                }
                @keyframes notifItemIn {
                    from { opacity: 0; transform: translateX(-6px); }
                    to   { opacity: 1; transform: translateX(0); }
                }
                .notif-item {
                    animation: notifItemIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) both;
                }
            `}</style>

            {/* ── Header ── */}
            <div className="flex items-center justify-between px-5 py-4
                            border-b border-black/5 bg-white/50">
                <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-slate-900 flex items-center justify-center">
                        <Bell className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div>
                        <p className="font-semibold text-[13px] text-slate-900 leading-none">
                            Thông báo
                        </p>
                        {notifications.length > 0 && (
                            <p className="text-[10px] text-slate-400 mt-0.5 leading-none">
                                {notifications.length} chưa đọc
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {notifications.length > 0 && (
                        <button
                            onClick={onClearAll}
                            className="flex items-center gap-1 text-[11px] font-medium
                                       text-slate-400 hover:text-slate-700
                                       transition-colors duration-200 cursor-pointer"
                        >
                            <X className="w-3 h-3" />
                            Xóa tất cả
                        </button>
                    )}
                </div>
            </div>

            {/* ── Body ── */}
            <div className="max-h-[400px] overflow-y-auto overscroll-contain
                            scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-200">
                {notifications.length === 0 ? (
                    /* Empty state */
                    <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
                        {/* Animated ring */}
                        <div className="relative w-14 h-14 mb-4">
                            <div className="absolute inset-0 rounded-full bg-slate-100" />
                            <div className="absolute inset-0 rounded-full border-2 border-dashed
                                            border-slate-200 animate-spin"
                                style={{ animationDuration: '8s' }} />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Bell className="w-5 h-5 text-slate-300" />
                            </div>
                        </div>
                        <p className="text-[13px] font-semibold text-slate-500">
                            Chưa có thông báo
                        </p>
                        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed max-w-[200px]">
                            Thông báo đặt phòng và tin nhắn sẽ xuất hiện tại đây
                        </p>
                    </div>
                ) : (
                    <div className="p-2 space-y-1">
                        {notifications.map((notif, index) => {
                            const cfg = getConfig(notif.type);
                            const Icon = cfg.icon;
                            const timeStr = notif.createdAt
                                ? formatDistanceToNow(new Date(notif.createdAt), {
                                    addSuffix: true, locale: vi,
                                })
                                : '';

                            return (
                                <button
                                    key={notif.id || index}
                                    onClick={() => handleNotifClick(notif)}
                                    className="notif-item w-full text-left group relative overflow-hidden
                                               flex items-start gap-3 p-3.5 rounded-xl
                                               hover:bg-white/90 transition-all duration-200
                                               border border-transparent hover:border-black/5
                                               hover:shadow-[0_2px_12px_rgba(0,0,0,0.06)]
                                               cursor-pointer"
                                    style={{ animationDelay: `${index * 40}ms` }}
                                >
                                    {/* Left accent bar */}
                                    <div className={`absolute left-0 top-3 bottom-3 w-[2px] rounded-r-full ${cfg.bar}
                                                     opacity-60 group-hover:opacity-100 transition-opacity`} />

                                    {/* Icon */}
                                    <div className={`mt-0.5 shrink-0 w-8 h-8 rounded-xl
                                                     bg-slate-50 group-hover:bg-white
                                                     flex items-center justify-center
                                                     transition-colors duration-200 border border-black/5`}>
                                        <Icon className={`w-4 h-4 ${cfg.color}`} />
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0 pl-0.5">
                                        {/* Type badge + time */}
                                        <div className="flex items-center justify-between gap-2 mb-0.5">
                                            <span className={`text-[10px] font-semibold uppercase tracking-wide
                                                             ${cfg.labelColor}`}>
                                                {cfg.label}
                                            </span>
                                            <span className="text-[9px] text-slate-400 shrink-0">{timeStr}</span>
                                        </div>

                                        {/* Message */}
                                        <p className="text-[12px] text-slate-700 font-medium leading-snug
                                                       line-clamp-2 group-hover:text-slate-900 transition-colors">
                                            {notif.message}
                                        </p>

                                        {/* Meta: guest + price */}
                                        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                                            {notif.guestName && (
                                                <span className="text-[10px] text-slate-400">
                                                    👤 {notif.guestName}
                                                </span>
                                            )}
                                            {notif.totalPrice && (
                                                <span className="text-[10px] font-semibold text-emerald-600
                                                                   bg-emerald-50 px-1.5 py-0.5 rounded-md">
                                                    {notif.totalPrice.toLocaleString('vi-VN')}đ
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Arrow on hover */}
                                    <ArrowRight className="w-3.5 h-3.5 text-slate-300 shrink-0 mt-1
                                                           group-hover:text-slate-500 group-hover:translate-x-0.5
                                                           transition-all duration-200 self-center" />
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ── Footer ── */}
            {notifications.length > 0 && (
                <div className="px-4 py-3 border-t border-black/5 bg-slate-50/60">
                    <button
                        onClick={() => { navigate('/my-bookings'); onClose(); }}
                        className="w-full flex items-center justify-center gap-2
                                   text-[11px] font-medium
                                   text-slate-500 hover:text-slate-900
                                   transition-colors duration-200 py-1 cursor-pointer"
                    >
                        Xem tất cả lịch sử đặt phòng
                        <ArrowRight className="w-3 h-3" />
                    </button>
                </div>
            )}
        </div>
    );
};

export default NotificationDropdown;
