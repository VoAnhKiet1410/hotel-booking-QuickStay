/**
 * NightAudit.jsx — Owner Night Audit Dashboard
 *
 * Giao diện quản lý Night Audit:
 * - Trigger audit thủ công (nút Run Night Audit)
 * - Xem audit log mới nhất (summary cards)
 * - Lịch sử audit logs (bảng phân trang)
 * - Chi tiết từng log (expandable)
 */
import React, { useEffect, useState, useCallback } from 'react'
import { useAppContext } from '../../context/appContextCore'
import { toast } from 'react-hot-toast'
import {
    Moon, Play, Clock, CheckCircle2, XCircle, AlertTriangle,
    Users, BedDouble, DollarSign, Loader2, ChevronLeft, ChevronRight,
    RefreshCw, FileText, ArrowRight, Download
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const fmtDate = (d) => {
    if (!d) return '—'
    return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false,
    }).format(new Date(d))
}

const fmtDuration = (ms) => {
    if (!ms) return '—'
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(1)}s`
}

const fmtVND = (value) => {
    if (!value) return '0 ₫'
    if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)} tỷ`
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)} tr`
    return `${value.toLocaleString('vi-VN')} ₫`
}

const statusConfig = {
    completed: { label: 'Hoàn tất', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    running: { label: 'Đang chạy', icon: Loader2, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    failed: { label: 'Thất bại', icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
}

// ---------------------------------------------------------------------------
// StatusBadge
// ---------------------------------------------------------------------------
const StatusBadge = ({ status }) => {
    const cfg = statusConfig[status] || statusConfig.failed
    const Icon = cfg.icon
    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${cfg.bg} ${cfg.color} ${cfg.border}`}>
            <Icon className={`h-3.5 w-3.5 ${status === 'running' ? 'animate-spin' : ''}`} />
            {cfg.label}
        </span>
    )
}

// ---------------------------------------------------------------------------
// SummaryCard
// ---------------------------------------------------------------------------
// eslint-disable-next-line no-unused-vars -- SummaryIcon is used as JSX component below
const SummaryCard = ({ icon: SummaryIcon, label, value, sublabel, iconBg }) => (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
        <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-[0.07] transition-transform group-hover:scale-110" style={{ background: iconBg || '#6366f1' }} />
        <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ background: iconBg || '#6366f1' }}>
                <SummaryIcon className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</p>
                <p className="mt-1 text-2xl font-bold text-slate-900 tracking-tight">{value}</p>
                {sublabel && <p className="mt-0.5 text-xs text-slate-400">{sublabel}</p>}
            </div>
        </div>
    </div>
)

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
const NightAudit = () => {
    const { axios } = useAppContext()
    const [logs, setLogs] = useState([])
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 })
    const [loading, setLoading] = useState(true)
    const [triggering, setTriggering] = useState(false)
    const [expandedId, setExpandedId] = useState(null)

    // Fetch audit logs
    const fetchLogs = useCallback(async (page = 1) => {
        try {
            setLoading(true)
            const { data } = await axios.get(`/api/night-audit/owner/logs?page=${page}&limit=10`)
            if (data.success) {
                setLogs(data.data.logs)
                setPagination(data.data.pagination)
            }
        } catch {
            toast.error('Không thể tải lịch sử Night Audit')
        } finally {
            setLoading(false)
        }
    }, [axios])

    useEffect(() => {
        fetchLogs(1)
    }, [fetchLogs])

    // Trigger audit thủ công
    const handleTrigger = async () => {
        try {
            setTriggering(true)
            const { data } = await axios.post('/api/night-audit/owner/trigger')
            if (data.success) {
                toast.success('Night Audit hoàn tất!')
                fetchLogs(1)
            } else {
                toast.error(data.message || 'Lỗi khi chạy Night Audit')
            }
        } catch (err) {
            const msg = err.response?.data?.message || 'Lỗi khi chạy Night Audit'
            toast.error(msg)
        } finally {
            setTriggering(false)
        }
    }

    // Export CSV
    const handleExport = async (logId) => {
        try {
            const response = await axios.get(
                `/api/night-audit/owner/logs/${logId}/export`,
                { responseType: 'blob' }
            )
            const blobType = response.headers['content-type'] || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            const blob = new Blob([response.data], { type: blobType })
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            // Lấy filename từ header hoặc default
            const disposition = response.headers['content-disposition']
            const match = disposition?.match(/filename="?([^"]+)"?/)
            link.download = match ? match[1] : `night-audit-${logId}.xlsx`
            document.body.appendChild(link)
            link.click()
            link.remove()
            window.URL.revokeObjectURL(url)
            toast.success('Đã tải báo cáo Excel')
        } catch {
            toast.error('Không thể xuất báo cáo')
        }
    }

    // Latest log summary
    const latest = logs[0] || null

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

                {/* ------- Header ------- */}
                <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-200/50">
                            <Moon className="h-7 w-7 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Chốt Sổ Cuối Ngày</h1>
                            <p className="text-sm text-slate-500">Tự động thống kê doanh thu, xử lý khách không đến và cập nhật trạng thái phòng lúc 23:55 mỗi ngày.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => fetchLogs(pagination.page)}
                            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 shadow-sm transition-all hover:bg-slate-50 hover:shadow"
                        >
                            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                            Làm mới
                        </button>
                        <button
                            onClick={handleTrigger}
                            disabled={triggering}
                            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-200/50 transition-all hover:from-indigo-700 hover:to-purple-700 hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {triggering ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Play className="h-4 w-4" />
                            )}
                            {triggering ? 'Đang chốt sổ...' : 'Chốt sổ thủ công ngay'}
                        </button>
                    </div>
                </div>

                {/* ------- Latest Summary Cards ------- */}
                {latest && (
                    <div className="mb-8">
                        <div className="mb-3 flex items-center gap-2">
                            <FileText className="h-4 w-4 text-slate-400" />
                            <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wider">Audit gần nhất</h2>
                            <StatusBadge status={latest.status} />
                            <span className="text-xs text-slate-400 ml-auto">{fmtDate(latest.startedAt)}</span>
                            <button
                                onClick={() => handleExport(latest._id)}
                                className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition-all hover:bg-slate-50 hover:shadow ml-2"
                                title="Xuất báo cáo Excel"
                            >
                                <Download className="h-3.5 w-3.5" />
                                Xuất Excel
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                            <SummaryCard
                                icon={Users}
                                label="Khách Vắng Mặt"
                                value={latest.noShow?.total ?? 0}
                                sublabel={`OK: ${latest.noShow?.succeeded ?? 0} • Lỗi: ${latest.noShow?.failed ?? 0}`}
                                iconBg="#ef4444"
                            />
                            <SummaryCard
                                icon={BedDouble}
                                label="Trả Phòng Tự Động"
                                value={latest.autoCheckout?.total ?? 0}
                                sublabel={`OK: ${latest.autoCheckout?.succeeded ?? 0} • Lỗi: ${latest.autoCheckout?.failed ?? 0}`}
                                iconBg="#f59e0b"
                            />
                            <SummaryCard
                                icon={DollarSign}
                                label="Doanh Thu Ngày"
                                value={fmtVND(latest.dailyRevenue?.totalRevenue)}
                                sublabel={`${latest.dailyRevenue?.totalBookings ?? 0} bookings • ${latest.dailyRevenue?.paidBookings ?? 0} đã trả`}
                                iconBg="#10b981"
                            />
                            <SummaryCard
                                icon={Clock}
                                label="Thời Gian & Phòng"
                                value={fmtDuration(latest.durationMs)}
                                sublabel={`Tổng: ${latest.roomStatus?.totalRooms ?? 0} • Bẩn: ${latest.roomStatus?.dirty ?? 0}`}
                                iconBg="#6366f1"
                            />
                        </div>
                    </div>
                )}

                {/* ------- Audit Log Table ------- */}
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                        <h2 className="text-lg font-bold text-slate-900">Lịch sử chốt sổ</h2>
                        <span className="text-sm text-slate-400">{pagination.total} bản ghi</span>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                            <Moon className="h-12 w-12 mb-3 opacity-30" />
                            <p className="text-sm font-medium">Chưa có dữ liệu chốt sổ nào</p>
                            <p className="text-xs mt-1">Bấm "Chốt sổ thủ công ngay" để bắt đầu</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {logs.map((log) => (
                                <div key={log._id} className="transition-colors hover:bg-slate-50/50">
                                    <button
                                        className="flex w-full items-center gap-4 px-6 py-4 text-left"
                                        onClick={() => setExpandedId(expandedId === log._id ? null : log._id)}
                                    >
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100">
                                            <Moon className="h-5 w-5 text-slate-500" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-3 flex-wrap">
                                                <span className="text-sm font-semibold text-slate-800">
                                                    {fmtDate(log.auditDate).split(',')[0]}
                                                </span>
                                                <StatusBadge status={log.status} />
                                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                                    log.triggeredBy === 'manual'
                                                        ? 'bg-purple-100 text-purple-700'
                                                        : 'bg-slate-100 text-slate-500'
                                                }`}>
                                                    {log.triggeredBy === 'manual' ? 'Thủ công' : 'Tự động'}
                                                </span>
                                            </div>
                                            <p className="mt-0.5 text-xs text-slate-400">
                                                Vắng mặt: {log.noShow?.total ?? 0}
                                                {' • '}Trả tự động: {log.autoCheckout?.total ?? 0}
                                                {' • '}{fmtDuration(log.durationMs)}
                                            </p>
                                        </div>
                                        <ArrowRight className={`h-4 w-4 text-slate-300 transition-transform ${expandedId === log._id ? 'rotate-90' : ''}`} />
                                    </button>

                                    {/* Expanded Detail */}
                                    {expandedId === log._id && (
                                        <div className="mx-6 mb-4 rounded-xl bg-slate-50 p-5 space-y-4">
                                            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Bắt đầu</p>
                                                    <p className="text-sm font-medium text-slate-700">{fmtDate(log.startedAt)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Kết thúc</p>
                                                    <p className="text-sm font-medium text-slate-700">{fmtDate(log.completedAt)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Thời gian</p>
                                                    <p className="text-sm font-medium text-slate-700">{fmtDuration(log.durationMs)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Hình thức</p>
                                                    <p className="text-sm font-medium text-slate-700">{log.triggeredBy === 'manual' ? 'Thủ công' : 'Tự động'}</p>
                                                </div>
                                            </div>

                                            {/* No-Show & Checkout Detail */}
                                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                                <div className="rounded-lg border border-red-100 bg-red-50/50 p-4">
                                                    <h4 className="flex items-center gap-1.5 text-xs font-bold text-red-700 uppercase">
                                                        <Users className="h-3.5 w-3.5" /> Khách Vắng Mặt
                                                    </h4>
                                                    <div className="mt-2 flex items-baseline gap-3">
                                                        <span className="text-2xl font-bold text-red-800">{log.noShow?.total ?? 0}</span>
                                                        <span className="text-xs text-red-500">
                                                            OK: {log.noShow?.succeeded ?? 0} • Lỗi: {log.noShow?.failed ?? 0}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="rounded-lg border border-amber-100 bg-amber-50/50 p-4">
                                                    <h4 className="flex items-center gap-1.5 text-xs font-bold text-amber-700 uppercase">
                                                        <BedDouble className="h-3.5 w-3.5" /> Trả Phòng Tự Động
                                                    </h4>
                                                    <div className="mt-2 flex items-baseline gap-3">
                                                        <span className="text-2xl font-bold text-amber-800">{log.autoCheckout?.total ?? 0}</span>
                                                        <span className="text-xs text-amber-500">
                                                            OK: {log.autoCheckout?.succeeded ?? 0} • Lỗi: {log.autoCheckout?.failed ?? 0}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Revenue & Room Detail */}
                                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                                <div className="rounded-lg border border-emerald-100 bg-emerald-50/50 p-4">
                                                    <h4 className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 uppercase">
                                                        <DollarSign className="h-3.5 w-3.5" /> Doanh thu ngày
                                                    </h4>
                                                    <p className="mt-2 text-xl font-bold text-emerald-800">
                                                        {fmtVND(log.dailyRevenue?.totalRevenue)}
                                                    </p>
                                                    <p className="mt-1 text-xs text-emerald-500">
                                                        {log.dailyRevenue?.totalBookings ?? 0} bookings
                                                        {' • '}Đã trả: {log.dailyRevenue?.paidBookings ?? 0}
                                                        {' • '}Chưa trả: {log.dailyRevenue?.unpaidBookings ?? 0}
                                                    </p>
                                                </div>
                                                <div className="rounded-lg border border-indigo-100 bg-indigo-50/50 p-4">
                                                    <h4 className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 uppercase">
                                                        <BedDouble className="h-3.5 w-3.5" /> Trạng thái phòng
                                                    </h4>
                                                    <div className="mt-2 grid grid-cols-2 gap-y-1 gap-x-4 text-xs">
                                                        <span className="text-slate-500">Tổng phòng:</span>
                                                        <span className="font-semibold text-slate-700">{log.roomStatus?.totalRooms ?? 0}</span>
                                                        <span className="text-slate-500">Đang ở:</span>
                                                        <span className="font-semibold text-slate-700">{log.roomStatus?.occupied ?? 0}</span>
                                                        <span className="text-slate-500">Sẵn sàng:</span>
                                                        <span className="font-semibold text-emerald-600">{log.roomStatus?.available ?? 0}</span>
                                                        <span className="text-slate-500">Bẩn:</span>
                                                        <span className="font-semibold text-amber-600">{log.roomStatus?.dirty ?? 0}</span>
                                                        <span className="text-slate-500">Hỏng:</span>
                                                        <span className="font-semibold text-red-600">{log.roomStatus?.outOfOrder ?? 0}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Error nếu có */}
                                            {log.error && (
                                                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
                                                    <AlertTriangle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
                                                    <p className="text-xs text-red-700 font-mono break-all">{log.error}</p>
                                                </div>
                                            )}

                                            {/* Export Button */}
                                            <div className="flex justify-end pt-2">
                                                <button
                                                    onClick={() => handleExport(log._id)}
                                                    className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition-all hover:bg-slate-50 hover:shadow"
                                                >
                                                    <Download className="h-4 w-4" />
                                                    Xuất báo cáo Excel
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="flex items-center justify-between border-t border-slate-100 px-6 py-3">
                            <button
                                onClick={() => fetchLogs(pagination.page - 1)}
                                disabled={pagination.page <= 1}
                                className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft className="h-4 w-4" /> Trước
                            </button>
                            <span className="text-sm text-slate-500">
                                Trang {pagination.page} / {pagination.totalPages}
                            </span>
                            <button
                                onClick={() => fetchLogs(pagination.page + 1)}
                                disabled={pagination.page >= pagination.totalPages}
                                className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                Sau <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default NightAudit
