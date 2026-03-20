import React, { useEffect, useState } from 'react'
import { useAppContext } from '../../context/appContextCore'
import { toast } from 'react-hot-toast'
import { Link } from 'react-router-dom'
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts'
import {
    TrendingUp, TrendingDown, Users, CalendarCheck, DollarSign, BedDouble,
    Clock, CheckCircle, XCircle, CreditCard, Eye, ArrowRight, RotateCcw,
    LogIn, LogOut
} from 'lucide-react'

const COLORS = {
    primary: '#6366f1',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#3b82f6',
    slate: '#64748b'
}

const PIE_COLORS = ['#f59e0b', '#3b82f6', '#6366f1', '#10b981', '#ef4444']

const StatCard = ({ icon, label, value, subValue, trend, trendUp, color = 'indigo' }) => {
    const colorClasses = {
        indigo: 'bg-indigo-50 text-indigo-600',
        emerald: 'bg-emerald-50 text-emerald-600',
        amber: 'bg-amber-50 text-amber-600',
        slate: 'bg-slate-100 text-slate-600'
    }
    const IconEl = icon

    return (
        <div className="relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 transition-all hover:shadow-md">
            <div className="flex items-start justify-between">
                <div className={`rounded-xl p-2.5 ${colorClasses[color]}`}>
                    <IconEl className="h-5 w-5" />
                </div>
                {trend !== undefined && (
                    <div className={`flex items-center gap-1 text-xs font-medium ${trendUp ? 'text-emerald-600' : 'text-red-500'}`}>
                        {trendUp ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                        {trend}%
                    </div>
                )}
            </div>
            <div className="mt-4">
                <p className="text-2xl font-bold text-slate-900">{value}</p>
                <p className="mt-1 text-sm text-slate-500">{label}</p>
                {subValue && <p className="mt-0.5 text-xs text-slate-400">{subValue}</p>}
            </div>
        </div>
    )
}

const StatusBadge = ({ status }) => {
    const config = {
        pending: { bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-200', label: 'Chờ xác nhận', icon: Clock },
        confirmed: { bg: 'bg-blue-50', text: 'text-blue-700', ring: 'ring-blue-200', label: 'Đã xác nhận', icon: CheckCircle },
        checked_in: { bg: 'bg-indigo-50', text: 'text-indigo-700', ring: 'ring-indigo-200', label: 'Đang ở', icon: BedDouble },
        completed: { bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-200', label: 'Đã trả phòng', icon: CheckCircle },
        cancelled: { bg: 'bg-red-50', text: 'text-red-600', ring: 'ring-red-200', label: 'Đã hủy', icon: XCircle },
        canceled: { bg: 'bg-red-50', text: 'text-red-600', ring: 'ring-red-200', label: 'Đã hủy', icon: XCircle },
    }

    const cfg = config[status] || config.pending
    const Icon = cfg.icon

    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${cfg.bg} ${cfg.text} ${cfg.ring}`}>
            <Icon className="h-3 w-3" />
            {cfg.label}
        </span>
    )
}

const PaymentBadge = ({ isPaid }) => (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${isPaid
        ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
        : 'bg-slate-50 text-slate-600 ring-slate-200'
        }`}>
        <CreditCard className="h-3 w-3" />
        {isPaid ? 'Đã thanh toán' : 'Chưa thanh toán'}
    </span>
)

const SkeletonCard = () => (
    <div className="animate-pulse rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
        <div className="flex items-start justify-between">
            <div className="h-10 w-10 rounded-xl bg-slate-200" />
            <div className="h-4 w-12 rounded bg-slate-200" />
        </div>
        <div className="mt-4 space-y-2">
            <div className="h-7 w-24 rounded bg-slate-200" />
            <div className="h-4 w-32 rounded bg-slate-200" />
        </div>
    </div>
)

const SkeletonChart = () => (
    <div className="animate-pulse rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
        <div className="h-5 w-40 rounded bg-slate-200" />
        <div className="mt-4 h-64 rounded-xl bg-slate-100" />
    </div>
)

const Dashboard = () => {
    const { axios } = useAppContext()
    const [summary, setSummary] = useState(null)
    const [todayActivity, setTodayActivity] = useState(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        let cancelled = false
        const fetchSummary = async () => {
            if (!axios) {
                if (!cancelled) { setSummary(null); setTodayActivity(null); setIsLoading(false) }
                return
            }
            try {
                setIsLoading(true)
                const [summaryRes, todayRes] = await Promise.all([
                    axios.get('/api/bookings/owner/summary'),
                    axios.get('/api/bookings/owner/today')
                ])
                if (cancelled) return
                if (summaryRes.data?.success) setSummary(summaryRes.data.data || null)
                if (todayRes.data?.success) setTodayActivity(todayRes.data.data || null)
                else if (!summaryRes.data?.success) toast.error(summaryRes.data?.message || 'Không thể tải dữ liệu tổng quan')
            } catch (error) {
                if (cancelled) return
                toast.error(error?.response?.data?.message || 'Không thể tải dữ liệu')
            } finally {
                if (!cancelled) setIsLoading(false)
            }
        }
        fetchSummary()
        return () => { cancelled = true }
    }, [axios])

    const totals = summary?.totals || { totalBookings: 0, totalRevenue: 0, totalCustomers: 0 }
    const adr = summary?.adr || 0
    const revpar = summary?.revpar || 0
    const statusCounts = summary?.statusCounts || { pending: 0, confirmed: 0, checked_in: 0, completed: 0, cancelled: 0 }
    const paymentCounts = summary?.paymentCounts || { paid: 0, unpaid: 0 }
    const refundStats = summary?.refundStats || { totalRefunded: 0, totalRefundAmount: 0 }
    const paymentMethodCounts = summary?.paymentMethodCounts || {}
    const recentBookings = Array.isArray(summary?.recentBookings) ? summary.recentBookings : []

    // Chart data
    const pieData = [
        { name: 'Chờ xác nhận', value: statusCounts.pending, color: COLORS.warning },
        { name: 'Đã xác nhận', value: statusCounts.confirmed, color: COLORS.info },
        { name: 'Đang ở', value: statusCounts.checked_in, color: COLORS.primary },
        { name: 'Đã trả phòng', value: statusCounts.completed, color: COLORS.success },
        { name: 'Đã hủy', value: statusCounts.cancelled, color: COLORS.danger },
    ].filter(d => d.value > 0)



    // Revenue trend from API
    const revenueTrend = Array.isArray(summary?.revenueTrend) ? summary.revenueTrend : []

    // Payment method data cho bar chart
    const paymentMethodData = [
        {
            name: 'Stripe',
            count: paymentMethodCounts['stripe']?.count || 0,
            revenue: paymentMethodCounts['stripe']?.revenue || 0,
            fill: '#6366f1'
        },
        {
            name: 'Tại khách sạn',
            count: paymentMethodCounts['payAtHotel']?.count || 0,
            revenue: paymentMethodCounts['payAtHotel']?.revenue || 0,
            fill: '#10b981'
        },
    ]

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div>
                    <div className="h-8 w-48 animate-pulse rounded bg-slate-200" />
                    <div className="mt-2 h-4 w-72 animate-pulse rounded bg-slate-200" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
                </div>
                <div className="grid gap-6 lg:grid-cols-2">
                    <SkeletonChart />
                    <SkeletonChart />
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Tổng quan</h1>
                <p className="mt-1 text-sm text-slate-500">
                    Xin chào! Đây là tổng quan hoạt động khách sạn của bạn.
                </p>
            </div>

            {/* Stats Grid — 8 cards, 4 col lg */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    icon={CalendarCheck}
                    label="Tổng đặt phòng"
                    value={totals.totalBookings}
                    subValue={`${statusCounts.pending} đang chờ xử lý`}
                    color="indigo"
                />
                <StatCard
                    icon={DollarSign}
                    label="Tổng doanh thu"
                    value={`${(totals.totalRevenue / 1000000).toFixed(1)}M ₫`}
                    subValue={`${paymentCounts.paid} đã thanh toán`}
                    color="emerald"
                />
                <StatCard
                    icon={Users}
                    label="Khách hàng"
                    value={totals.totalCustomers}
                    subValue="Khách đã đặt phòng"
                    color="amber"
                />
                <StatCard
                    icon={BedDouble}
                    label="Tỷ lệ hoàn thành"
                    value={totals.totalBookings > 0
                        ? `${Math.round(((statusCounts.confirmed + statusCounts.checked_in + statusCounts.completed) / totals.totalBookings) * 100)}%`
                        : '0%'}
                    subValue={`${statusCounts.confirmed + statusCounts.checked_in + statusCounts.completed}/${totals.totalBookings} đơn thành công`}
                    color="slate"
                />
                <StatCard
                    icon={RotateCcw}
                    label="Đã hoàn tiền"
                    value={refundStats.totalRefunded}
                    subValue={refundStats.totalRefundAmount > 0
                        ? `${(refundStats.totalRefundAmount / 1000000).toFixed(2)}M ₫ đã hoàn`
                        : 'Chưa có hoàn tiền'}
                    color="indigo"
                />
                <StatCard
                    icon={CreditCard}
                    label="Thanh toán Stripe"
                    value={paymentMethodData[0].count}
                    subValue={`${paymentMethodData[1].count} đơn trả tại quầy`}
                    color="emerald"
                />
                <StatCard
                    icon={DollarSign}
                    label="ADR"
                    value={`${(adr).toLocaleString('vi-VN')} ₫`}
                    subValue="Giá trung bình hằng ngày"
                    color="indigo"
                />
                <StatCard
                    icon={TrendingUp}
                    label="RevPAR"
                    value={`${(revpar).toLocaleString('vi-VN')} ₫`}
                    subValue="DT / Phòng có sẵn"
                    color="emerald"
                />
            </div>

            {/* Charts Row */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Revenue Chart */}
                <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
                    <h3 className="font-semibold text-slate-900">Doanh thu theo tháng</h3>
                    <div className="mt-4 h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={revenueTrend}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.2} />
                                        <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" tickFormatter={v => `${(v / 1000000).toFixed(0)}M`} />
                                <Tooltip
                                    formatter={(value) => [`${value.toLocaleString('vi-VN')} ₫`, 'Doanh thu']}
                                    contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }}
                                />
                                <Area type="monotone" dataKey="revenue" stroke={COLORS.primary} strokeWidth={2} fill="url(#colorRevenue)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Status Pie Chart */}
                <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
                    <h3 className="font-semibold text-slate-900">Trạng thái đặt phòng</h3>
                    <div className="mt-4 h-64">
                        {pieData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={90}
                                        paddingAngle={4}
                                        dataKey="value"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color || PIE_COLORS[index % PIE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => [value, 'Số đơn']} />
                                    <Legend
                                        verticalAlign="bottom"
                                        height={36}
                                        formatter={(value) => <span className="text-sm text-slate-600">{value}</span>}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex h-full items-center justify-center text-slate-400">
                                Chưa có dữ liệu
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Payment Method Analysis */}
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-slate-900">Phương thức thanh toán</h3>
                    {refundStats.totalRefunded > 0 && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-3 py-1 text-xs font-medium text-violet-600 ring-1 ring-violet-200">
                            <RotateCcw className="h-3 w-3" />
                            {refundStats.totalRefunded} hoàn tiền
                        </span>
                    )}
                </div>
                <div className="h-32">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={paymentMethodData} layout="vertical" barSize={20}>
                            <XAxis type="number" hide />
                            <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={100} />
                            <Tooltip
                                formatter={(value) => [value, 'Số đơn']}
                                contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }}
                            />
                            <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                                {paymentMethodData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                {/* Revenue by method */}
                <div className="mt-3 grid grid-cols-2 gap-3 border-t border-slate-100 pt-3">
                    {paymentMethodData.map((m) => (
                        <div key={m.name} className="text-center">
                            <p className="text-xs text-slate-500">{m.name}</p>
                            <p className="mt-0.5 text-sm font-semibold text-slate-900">
                                {(m.revenue / 1000000).toFixed(1)}M ₫
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Bottom Row */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Recent Bookings */}
                <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 overflow-hidden">
                    <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                        <h3 className="font-semibold text-slate-900">Đặt phòng gần đây</h3>
                        <Link to="/owner/bookings" className="flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700">
                            Xem tất cả <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>

                    {recentBookings.length === 0 ? (
                        <div className="px-5 py-12 text-center text-slate-400">
                            <CalendarCheck className="mx-auto h-10 w-10 text-slate-300" />
                            <p className="mt-2">Chưa có đặt phòng nào</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-50">
                            {recentBookings.slice(0, 5).map((booking) => (
                                <div key={booking._id} className="flex items-center justify-between px-5 py-4 hover:bg-slate-50/50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-sm font-semibold text-indigo-600">
                                            {(booking?.user?.username || booking?.user?.email || 'U')[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-900">
                                                {booking?.user?.username || booking?.user?.email || 'Khách'}
                                            </p>
                                            <p className="text-sm text-slate-500">
                                                {booking?.room?.roomType || 'Phòng'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <p className="font-semibold text-slate-900">
                                                {Number(booking?.totalPrice || 0).toLocaleString('vi-VN')} ₫
                                            </p>
                                            <div className="mt-1 flex gap-2 justify-end">
                                                <StatusBadge status={booking.status} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Today's Activity */}
                <div className="space-y-6">
                    {/* Arrivals */}
                    <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 overflow-hidden flex flex-col justify-start">
                        <div className="flex items-center justify-between border-b border-indigo-100 px-5 py-3 bg-indigo-50/50">
                            <div className="flex items-center gap-2">
                                <LogIn className="h-4 w-4 text-indigo-600" />
                                <h3 className="font-semibold text-indigo-900 text-sm">Khách đến hôm nay</h3>
                            </div>
                            <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700">
                                {todayActivity?.arrivals?.length || 0}
                            </span>
                        </div>
                        <div className="divide-y divide-slate-50 max-h-[250px] overflow-y-auto">
                            {!todayActivity?.arrivals?.length ? (
                                <p className="px-5 py-6 text-center text-sm text-slate-400">Không có khách đến dự kiến</p>
                            ) : (
                                todayActivity.arrivals.map(booking => (
                                    <div key={booking._id} className="px-5 py-3 hover:bg-slate-50/50 transition-colors">
                                        <p className="font-medium text-slate-900 text-sm">
                                            {booking?.user?.name || booking?.user?.username || booking?.user?.email || 'Khách'}
                                        </p>
                                        <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                                            <span className="font-medium">{booking?.room?.roomType || 'Phòng'}</span>
                                            <span className={booking.status === 'checked_in' ? 'text-indigo-600 font-medium' : ''}>
                                                {booking.status === 'checked_in' ? 'Đã đến' : 'Sắp đến'}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Departures */}
                    <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 overflow-hidden flex flex-col justify-start">
                        <div className="flex items-center justify-between border-b border-orange-100 px-5 py-3 bg-amber-50/50">
                            <div className="flex items-center gap-2">
                                <LogOut className="h-4 w-4 text-amber-600" />
                                <h3 className="font-semibold text-amber-900 text-sm">Khách đi hôm nay</h3>
                            </div>
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                                {todayActivity?.departures?.length || 0}
                            </span>
                        </div>
                        <div className="divide-y divide-slate-50 max-h-[250px] overflow-y-auto">
                            {!todayActivity?.departures?.length ? (
                                <p className="px-5 py-6 text-center text-sm text-slate-400">Không có khách trả phòng dự kiến</p>
                            ) : (
                                todayActivity.departures.map(booking => (
                                    <div key={booking._id} className="px-5 py-3 hover:bg-slate-50/50 transition-colors">
                                        <p className="font-medium text-slate-900 text-sm">
                                            {booking?.user?.name || booking?.user?.username || booking?.user?.email || 'Khách'}
                                        </p>
                                        <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                                            <span className="font-medium">{booking?.room?.roomType || 'Phòng'}</span>
                                            <span>Chưa thanh toán/trả phòng</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Dashboard
