/**
 * RevenueManagement — Trang phân tích doanh thu chuyên sâu cho Owner.
 *
 * KPIs: Total Revenue, ADR, RevPAR, Occupancy Rate, Nights Sold, Cancellation Rate
 * Charts: Monthly Revenue (Area), Daily Trend (Line), Revenue by Room Type (Bar),
 *         Payment Breakdown (Pie), Occupancy by Room Type (Bar)
 * Table:  Top performing room types
 */
import React, { useEffect, useState, useCallback } from 'react'
import { useAppContext } from '../../context/appContextCore'
import { toast } from 'react-hot-toast'
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, Legend
} from 'recharts'
import {
    DollarSign, TrendingUp, BarChart3, Percent, BedDouble, XCircle,
    Loader2, ChevronDown
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const MONTHS = [
    { value: '', label: 'Cả năm' },
    { value: '1', label: 'Tháng 1' }, { value: '2', label: 'Tháng 2' },
    { value: '3', label: 'Tháng 3' }, { value: '4', label: 'Tháng 4' },
    { value: '5', label: 'Tháng 5' }, { value: '6', label: 'Tháng 6' },
    { value: '7', label: 'Tháng 7' }, { value: '8', label: 'Tháng 8' },
    { value: '9', label: 'Tháng 9' }, { value: '10', label: 'Tháng 10' },
    { value: '11', label: 'Tháng 11' }, { value: '12', label: 'Tháng 12' },
]

const CHART_COLORS = [
    '#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6',
    '#06b6d4', '#f97316', '#ec4899', '#14b8a6', '#64748b'
]
const PIE_COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444']

/**
 * Format currency VND
 */
const fmtVND = (value) => {
    if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)} tỷ`
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)} tr`
    return value?.toLocaleString('vi-VN') ?? '0'
}

// ---------------------------------------------------------------------------
// Skeleton / Loading
// ---------------------------------------------------------------------------
const SkeletonCard = () => (
    <div className="animate-pulse rounded-xl border border-slate-100 bg-white p-5">
        <div className="mb-3 h-3 w-20 rounded bg-slate-200" />
        <div className="h-7 w-28 rounded bg-slate-200" />
    </div>
)

const SkeletonChart = () => (
    <div className="animate-pulse rounded-xl border border-slate-100 bg-white p-5">
        <div className="mb-4 h-4 w-36 rounded bg-slate-200" />
        <div className="h-56 w-full rounded bg-slate-100" />
    </div>
)

// ---------------------------------------------------------------------------
// KPI Card Component
// ---------------------------------------------------------------------------
// eslint-disable-next-line no-unused-vars -- KPIIcon is used as JSX component below
const KPICard = ({ label, value, icon: KPIIcon, color, suffix }) => {
    const colorMap = {
        emerald: 'bg-emerald-50 text-emerald-600',
        indigo: 'bg-indigo-50 text-indigo-600',
        blue: 'bg-blue-50 text-blue-600',
        amber: 'bg-amber-50 text-amber-600',
        violet: 'bg-violet-50 text-violet-600',
        red: 'bg-red-50 text-red-600',
    }
    return (
        <div className="group rounded-xl border border-slate-100 bg-white p-5
                        shadow-sm transition hover:shadow-md">
            <div className="flex items-start justify-between">
                <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-500 mb-1">{label}</p>
                    <p className="text-xl font-bold text-slate-900 truncate">
                        {value}{suffix && <span className="ml-0.5 text-sm font-normal text-slate-500">{suffix}</span>}
                    </p>
                </div>
                <div className={`rounded-lg p-2.5 ${colorMap[color]}`}>
                    <KPIIcon className="h-5 w-5" />
                </div>
            </div>
        </div>
    )
}

// ---------------------------------------------------------------------------
// Chart Card Wrapper
// ---------------------------------------------------------------------------
const ChartCard = ({ title, children, className = '' }) => (
    <div className={`rounded-xl border border-slate-100 bg-white p-5 shadow-sm ${className}`}>
        <h3 className="mb-4 text-sm font-semibold text-slate-700">{title}</h3>
        {children}
    </div>
)

// ---------------------------------------------------------------------------
// Custom Recharts Tooltip
// ---------------------------------------------------------------------------
const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
        <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg">
            <p className="text-xs font-medium text-slate-600 mb-1">{label}</p>
            {payload.map((entry, idx) => (
                <p key={idx} className="text-xs" style={{ color: entry.color }}>
                    {entry.name}: <span className="font-semibold">
                        {typeof entry.value === 'number'
                            ? `${entry.value.toLocaleString('vi-VN')} ₫`
                            : entry.value}
                    </span>
                </p>
            ))}
        </div>
    )
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
const RevenueManagement = () => {
    const { axios } = useAppContext()
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState(null)
    const [year, setYear] = useState(new Date().getFullYear())
    const [month, setMonth] = useState('')

    // Build year options: current year + 4 previous
    const currentYear = new Date().getFullYear()
    const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i)

    // Fetch analytics
    const fetchAnalytics = useCallback(async () => {
        if (!axios) return
        setLoading(true)
        try {
            const params = new URLSearchParams({ year })
            if (month) params.set('month', month)
            const { data: res } = await axios.get(`/api/revenue/owner/analytics?${params}`)
            if (res.success) {
                setData(res.data)
            } else {
                toast.error(res.message || 'Không tải được dữ liệu')
            }
        } catch (err) {
            console.error('Revenue fetch error:', err)
            toast.error('Lỗi khi tải dữ liệu doanh thu')
        } finally {
            setLoading(false)
        }
    }, [axios, year, month])

    useEffect(() => { fetchAnalytics() }, [fetchAnalytics])

    // -----------------------------------------------------------------------
    // Skeleton loading
    // -----------------------------------------------------------------------
    if (loading && !data) {
        return (
            <div className="p-6 space-y-6">
                <div className="flex items-center gap-3">
                    <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />
                    <span className="text-sm text-slate-500">Đang tải dữ liệu doanh thu…</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
                </div>
                <div className="grid lg:grid-cols-2 gap-6">
                    <SkeletonChart /> <SkeletonChart />
                </div>
            </div>
        )
    }

    if (!data) return null

    const { kpis, monthlyRevenue, revenueByRoomType, paymentBreakdown, dailyRevenue } = data

    // -----------------------------------------------------------------------
    // Render
    // -----------------------------------------------------------------------
    return (
        <div className="p-6 space-y-6 min-h-screen">
            {/* — Header + Filters — */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-slate-900">Quản lý doanh thu</h1>
                    <p className="text-sm text-slate-500 mt-0.5">
                        Phân tích chi tiết hiệu suất kinh doanh khách sạn
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Year select */}
                    <div className="relative">
                        <select
                            value={year}
                            onChange={(e) => setYear(Number(e.target.value))}
                            className="appearance-none rounded-lg border border-slate-200 bg-white
                                       py-2 pl-3 pr-8 text-sm font-medium text-slate-700
                                       shadow-sm focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100
                                       cursor-pointer transition"
                        >
                            {yearOptions.map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    </div>

                    {/* Month select */}
                    <div className="relative">
                        <select
                            value={month}
                            onChange={(e) => setMonth(e.target.value)}
                            className="appearance-none rounded-lg border border-slate-200 bg-white
                                       py-2 pl-3 pr-8 text-sm font-medium text-slate-700
                                       shadow-sm focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100
                                       cursor-pointer transition"
                        >
                            {MONTHS.map(m => (
                                <option key={m.value} value={m.value}>{m.label}</option>
                            ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    </div>
                </div>
            </div>

            {/* Loading overlay when re-fetching */}
            {loading && (
                <div className="flex items-center gap-2 text-indigo-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-xs">Đang cập nhật…</span>
                </div>
            )}

            {/* — KPI Cards — */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <KPICard
                    label="Tổng doanh thu" icon={DollarSign} color="emerald"
                    value={fmtVND(kpis.totalRevenue)} suffix="₫"
                />
                <KPICard
                    label="ADR" icon={TrendingUp} color="indigo"
                    value={kpis.adr?.toLocaleString('vi-VN')} suffix="₫"
                />
                <KPICard
                    label="RevPAR" icon={BarChart3} color="blue"
                    value={kpis.revpar?.toLocaleString('vi-VN')} suffix="₫"
                />
                <KPICard
                    label="Occupancy Rate" icon={Percent} color="amber"
                    value={kpis.occupancyRate} suffix="%"
                />
                <KPICard
                    label="Đêm đã bán" icon={BedDouble} color="violet"
                    value={kpis.totalNightsSold?.toLocaleString('vi-VN')}
                />
                <KPICard
                    label="Tỷ lệ hủy" icon={XCircle} color="red"
                    value={kpis.cancellationRate} suffix="%"
                />
            </div>

            {/* — Charts Row 1: Monthly + Daily — */}
            <div className="grid lg:grid-cols-2 gap-6">
                {/* Monthly Revenue */}
                <ChartCard title="Doanh thu theo tháng">
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={monthlyRevenue}>
                                <defs>
                                    <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#6366f1" stopOpacity={0.25} />
                                        <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                                <YAxis tickFormatter={fmtVND} tick={{ fontSize: 11 }} width={60} />
                                <Tooltip content={<CustomTooltip />} />
                                <Area
                                    type="monotone" dataKey="revenue" name="Doanh thu"
                                    stroke="#6366f1" strokeWidth={2}
                                    fill="url(#gradRevenue)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </ChartCard>

                {/* Daily Revenue Trend (30 days) */}
                <ChartCard title="Xu hướng 30 ngày gần nhất">
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={dailyRevenue}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={4} />
                                <YAxis tickFormatter={fmtVND} tick={{ fontSize: 11 }} width={60} />
                                <Tooltip content={<CustomTooltip />} />
                                <Line
                                    type="monotone" dataKey="revenue" name="Doanh thu"
                                    stroke="#10b981" strokeWidth={2} dot={false}
                                    activeDot={{ r: 4, strokeWidth: 0 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </ChartCard>
            </div>

            {/* — Charts Row 2: Room Type + Payment + Occupancy — */}
            <div className="grid lg:grid-cols-3 gap-6">
                {/* Revenue by Room Type */}
                <ChartCard title="Doanh thu theo loại phòng">
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={revenueByRoomType} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis type="number" tickFormatter={fmtVND} tick={{ fontSize: 11 }} />
                                <YAxis
                                    type="category" dataKey="roomType" width={90}
                                    tick={{ fontSize: 11 }}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="revenue" name="Doanh thu" radius={[0, 4, 4, 0]}>
                                    {revenueByRoomType.map((_, idx) => (
                                        <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </ChartCard>

                {/* Payment Method Breakdown */}
                <ChartCard title="Phương thức thanh toán">
                    <div className="h-64 flex items-center justify-center">
                        {paymentBreakdown.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={paymentBreakdown}
                                        dataKey="revenue"
                                        nameKey="method"
                                        cx="50%" cy="50%"
                                        innerRadius={50} outerRadius={80}
                                        paddingAngle={3}
                                        label={({ method, percent }) =>
                                            `${method} (${(percent * 100).toFixed(0)}%)`
                                        }
                                        labelLine={{ strokeWidth: 1 }}
                                    >
                                        {paymentBreakdown.map((_, idx) => (
                                            <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(v) => [`${v.toLocaleString('vi-VN')} ₫`, 'Doanh thu']}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <p className="text-sm text-slate-400">Chưa có dữ liệu</p>
                        )}
                    </div>
                </ChartCard>

                {/* Occupancy by Room Type */}
                <ChartCard title="Tỷ lệ lấp đầy theo loại phòng">
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={revenueByRoomType}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="roomType" tick={{ fontSize: 11 }} />
                                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }}
                                    tickFormatter={(v) => `${v}%`} />
                                <Tooltip
                                    formatter={(v) => [`${v}%`, 'Occupancy']}
                                />
                                <Bar dataKey="occupancy" name="Occupancy" radius={[4, 4, 0, 0]}>
                                    {revenueByRoomType.map((entry, idx) => (
                                        <Cell
                                            key={idx}
                                            fill={entry.occupancy >= 70 ? '#10b981'
                                                : entry.occupancy >= 40 ? '#f59e0b' : '#ef4444'}
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </ChartCard>
            </div>

            {/* — Top Performing Room Types Table — */}
            {revenueByRoomType.length > 0 && (
                <ChartCard title="Hiệu suất từng loại phòng">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-100 text-left">
                                    <th className="pb-3 font-semibold text-slate-600">Loại phòng</th>
                                    <th className="pb-3 font-semibold text-slate-600 text-right">Doanh thu</th>
                                    <th className="pb-3 font-semibold text-slate-600 text-right">Đêm bán</th>
                                    <th className="pb-3 font-semibold text-slate-600 text-right">ADR</th>
                                    <th className="pb-3 font-semibold text-slate-600 text-right">Occupancy</th>
                                    <th className="pb-3 font-semibold text-slate-600 text-right">Số phòng</th>
                                </tr>
                            </thead>
                            <tbody>
                                {revenueByRoomType.map((rt, idx) => (
                                    <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/60 transition">
                                        <td className="py-3 font-medium text-slate-800">
                                            <span className="inline-block w-2 h-2 rounded-full mr-2"
                                                style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }} />
                                            {rt.roomType}
                                        </td>
                                        <td className="py-3 text-right text-slate-700">
                                            {rt.revenue?.toLocaleString('vi-VN')} ₫
                                        </td>
                                        <td className="py-3 text-right text-slate-700">
                                            {rt.nightsSold}
                                        </td>
                                        <td className="py-3 text-right text-slate-700">
                                            {rt.adr?.toLocaleString('vi-VN')} ₫
                                        </td>
                                        <td className="py-3 text-right">
                                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold
                                                ${rt.occupancy >= 70 ? 'bg-emerald-50 text-emerald-700'
                                                    : rt.occupancy >= 40 ? 'bg-amber-50 text-amber-700'
                                                        : 'bg-red-50 text-red-700'}`}>
                                                {rt.occupancy}%
                                            </span>
                                        </td>
                                        <td className="py-3 text-right text-slate-700">
                                            {rt.totalRooms}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </ChartCard>
            )}
        </div>
    )
}

export default RevenueManagement
