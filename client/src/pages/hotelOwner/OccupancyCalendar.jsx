import React, { useState, useEffect, useCallback } from 'react'
import { useAppContext } from '../../context/appContextCore'
import {
    ChevronLeft, ChevronRight, Calendar, Users, CreditCard,
    Clock, CheckCircle, Star, AlertCircle, ClipboardList,
    Info, RefreshCw
} from 'lucide-react'

/* ─── Helpers ─────────────────────────────────────────────────── */

const pad = (n) => String(n).padStart(2, '0')

const toYMD = (date) =>
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

const addDays = (date, n) => {
    const d = new Date(date)
    d.setDate(d.getDate() + n)
    return d
}

const getDaysInRange = (start, end) => {
    const days = []
    let cur = new Date(start)
    while (cur <= end) {
        days.push(new Date(cur))
        cur = addDays(cur, 1)
    }
    return days
}

const STATUS_CONFIG = {
    pending: {
        label: 'Chờ xác nhận',
        bg: 'bg-amber-400',
        text: 'text-amber-900',
        border: 'border-amber-500',
        icon: Clock,
        dot: 'bg-amber-400',
    },
    confirmed: {
        label: 'Đã xác nhận',
        bg: 'bg-blue-500',
        text: 'text-white',
        border: 'border-blue-600',
        icon: CheckCircle,
        dot: 'bg-blue-500',
    },
    checked_in: {
        label: 'Đang lưu trú',
        bg: 'bg-emerald-500',
        text: 'text-white',
        border: 'border-emerald-600',
        icon: Users,
        dot: 'bg-emerald-500',
    },
    completed: {
        label: 'Hoàn thành',
        bg: 'bg-violet-500',
        text: 'text-white',
        border: 'border-violet-600',
        icon: Star,
        dot: 'bg-violet-500',
    },
}

const getStatusCfg = (status) => STATUS_CONFIG[status] || {
    label: status,
    bg: 'bg-slate-400',
    text: 'text-white',
    border: 'border-slate-500',
    icon: AlertCircle,
    dot: 'bg-slate-400',
}

/* ─── Event Tooltip ────────────────────────────────────────────── */
const EventTooltip = ({ event }) => {
    const cfg = getStatusCfg(event.status)
    const Icon = cfg.icon
    const nights = Math.ceil(
        (new Date(event.checkOut) - new Date(event.checkIn)) / (1000 * 60 * 60 * 24)
    )

    return (
        <div
            className="absolute z-50 w-64 rounded-xl border border-slate-200 bg-white shadow-2xl
                        ring-1 ring-black/5 overflow-hidden"
            style={{ top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: 6 }}
        >
            {/* Header */}
            <div className={`${cfg.bg} px-4 py-3 flex items-center gap-2`}>
                <Icon className={`w-4 h-4 ${cfg.text}`} />
                <span className={`text-xs font-bold uppercase tracking-wide ${cfg.text}`}>
                    {cfg.label}
                </span>
            </div>

            {/* Body */}
            <div className="p-4 space-y-2.5 text-sm">
                <div className="flex items-center gap-2 font-semibold text-slate-900">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    {event.guestName} ({event.guests} khách)
                </div>
                <div className="text-slate-500 text-xs space-y-1">
                    <p>📅 {new Date(event.checkIn).toLocaleDateString('vi-VN')} →{' '}
                        {new Date(event.checkOut).toLocaleDateString('vi-VN')} ({nights} đêm)</p>
                    <p>💰 {event.totalPrice?.toLocaleString('vi-VN')}₫{' '}
                        <span className={event.isPaid ? 'text-emerald-600 font-medium' : 'text-amber-600'}>
                            ({event.isPaid ? 'Đã thanh toán' : 'Chưa thanh toán'})
                        </span>
                    </p>
                    {event.specialRequests && (
                        <p className="flex items-start gap-1">
                            <ClipboardList className="w-3 h-3 mt-0.5 shrink-0 text-amber-500" />
                            <span className="text-amber-700">{event.specialRequests}</span>
                        </p>
                    )}
                </div>
            </div>
        </div>
    )
}

/* ─── Main Component ────────────────────────────────────────────── */
const OccupancyCalendar = () => {
    const { axios } = useAppContext()

    // State: ngày bắt đầu hiển thị (mặc định đầu tháng hiện tại)
    const [viewStart, setViewStart] = useState(() => {
        const d = new Date()
        d.setDate(1)
        return d
    })
    const [events, setEvents] = useState([])
    const [roomsMeta, setRoomsMeta] = useState([])
    const [isLoading, setIsLoading] = useState(false)
    const [activeTooltip, setActiveTooltip] = useState(null) // { eventId, roomId }
    const [selectedStatus, setSelectedStatus] = useState('all')

    // 28 ngày hiển thị (4 tuần)
    const DAYS_SHOWN = 28
    const viewEnd = addDays(viewStart, DAYS_SHOWN - 1)
    const days = getDaysInRange(viewStart, viewEnd)

    /* Fetch data */
    const fetchCalendar = useCallback(async () => {
        if (!axios) return
        setIsLoading(true)
        try {
            const { data } = await axios.get('/api/bookings/owner/calendar', {
                params: { start: toYMD(viewStart), end: toYMD(viewEnd) },
            })
            if (data?.success) {
                setEvents(data.data.events || [])
                setRoomsMeta(data.data.roomsMeta || [])
            }
        } catch (err) {
            console.error('[Calendar] fetch error:', err.message)
        } finally {
            setIsLoading(false)
        }
    }, [axios, viewStart]) // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => { fetchCalendar() }, [fetchCalendar])

    /* Navigation */
    const goBack = () => setViewStart((d) => addDays(d, -7))
    const goForward = () => setViewStart((d) => addDays(d, 7))
    const goToday = () => {
        const d = new Date()
        d.setDate(1)
        setViewStart(d)
    }

    const today = toYMD(new Date())

    /* Filter events theo status */
    const filteredEvents = selectedStatus === 'all'
        ? events
        : events.filter((e) => e.status === selectedStatus)

    /* Tính ô event cho mỗi room + day */
    const getEventForCell = (roomId, dayDate) => {
        const dayStr = toYMD(dayDate)
        return filteredEvents.find((e) => {
            if (String(e.roomId) !== String(roomId)) return false
            const ci = toYMD(new Date(e.checkIn))
            const co = toYMD(new Date(e.checkOut))
            return dayStr >= ci && dayStr < co
        })
    }

    const isEventStart = (event, dayDate) =>
        toYMD(new Date(event.checkIn)) === toYMD(dayDate)

    /* Stats tổng hợp */
    const totalBooked = events.filter((e) => ['confirmed', 'checked_in'].includes(e.status)).length
    const totalRooms = roomsMeta.length
    const occupancyRate = totalRooms > 0
        ? Math.round((totalBooked / totalRooms) * 100)
        : 0

    /* ─── Render ─────────────────────────────────────────────── */
    return (
        <div className="min-h-screen bg-slate-50 pb-16">
            {/* ── Page Header ── */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <Calendar className="w-6 h-6 text-indigo-600" />
                    Lịch phòng
                </h1>
                <p className="text-sm text-slate-500 mt-1">Xem tình trạng phòng trống và đặt phòng theo ngày</p>
            </div>

            {/* ── Stats bar ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {[
                    { label: 'Tổng phòng', value: totalRooms, color: 'text-slate-700', bg: 'bg-white' },
                    { label: 'Đang sử dụng', value: totalBooked, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                    { label: 'Tỉ lệ lấp đầy', value: `${occupancyRate}%`, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Sự kiện kỳ này', value: filteredEvents.length, color: 'text-amber-600', bg: 'bg-amber-50' },
                ].map((s) => (
                    <div key={s.label} className={`${s.bg} rounded-xl border border-slate-200 p-4`}>
                        <p className="text-xs text-slate-500 font-medium">{s.label}</p>
                        <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
                    </div>
                ))}
            </div>

            {/* ── Controls ── */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                {/* Date nav */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={goBack}
                        className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <div className="text-sm font-semibold text-slate-800 px-2 min-w-[180px] text-center">
                        {viewStart.toLocaleDateString('vi-VN', { day: '2-digit', month: 'long', year: 'numeric' })}
                        {' '}&rarr;{' '}
                        {viewEnd.toLocaleDateString('vi-VN', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </div>
                    <button
                        onClick={goForward}
                        className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                    <button
                        onClick={goToday}
                        className="text-xs font-medium px-3 py-2 rounded-lg border border-slate-200 bg-white
                                   hover:bg-slate-50 text-slate-600 transition-colors"
                    >
                        Hôm nay
                    </button>
                    <button
                        onClick={fetchCalendar}
                        disabled={isLoading}
                        className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                {/* Status filter */}
                <div className="flex items-center gap-1.5 flex-wrap">
                    {[
                        { key: 'all', label: 'Tất cả' },
                        ...Object.entries(STATUS_CONFIG).map(([k, v]) => ({ key: k, label: v.label })),
                    ].map(({ key, label }) => (
                        <button
                            key={key}
                            onClick={() => setSelectedStatus(key)}
                            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all ${selectedStatus === key
                                    ? 'bg-indigo-600 text-white shadow-sm'
                                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                                }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Legend ── */}
            <div className="flex flex-wrap items-center gap-4 mb-4">
                {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                    <div key={k} className="flex items-center gap-1.5">
                        <div className={`w-2.5 h-2.5 rounded-full ${v.dot}`} />
                        <span className="text-xs text-slate-500">{v.label}</span>
                    </div>
                ))}
                <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-100 border border-slate-300" />
                    <span className="text-xs text-slate-500">Trống</span>
                </div>
            </div>

            {/* ── Calendar Grid ── */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center py-24">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-8 h-8 rounded-full border-2 border-slate-200 border-t-indigo-600 animate-spin" />
                            <p className="text-sm text-slate-400">Đang tải lịch phòng...</p>
                        </div>
                    </div>
                ) : roomsMeta.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-3">
                        <Calendar className="w-12 h-12 text-slate-200" />
                        <p className="text-slate-400 text-sm">Chưa có phòng nào</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse" style={{ minWidth: `${DAYS_SHOWN * 36 + 140}px` }}>
                            {/* Column headers — dates */}
                            <thead>
                                <tr>
                                    {/* Room col header */}
                                    <th className="sticky left-0 z-20 bg-slate-50 border-b border-r border-slate-200
                                                   px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-36">
                                        Phòng
                                    </th>
                                    {days.map((day) => {
                                        const ymd = toYMD(day)
                                        const isToday = ymd === today
                                        const isWeekend = day.getDay() === 0 || day.getDay() === 6
                                        return (
                                            <th
                                                key={ymd}
                                                className={`border-b border-slate-200 px-1 py-2 text-center
                                                            text-[10px] font-semibold uppercase tracking-wider w-9
                                                            ${isToday ? 'bg-indigo-50 text-indigo-700' : isWeekend ? 'bg-slate-50/80 text-slate-400' : 'bg-white text-slate-400'}`}
                                            >
                                                <div>{['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][day.getDay()]}</div>
                                                <div className={`text-[11px] font-bold mt-0.5 w-6 h-6 rounded-full mx-auto flex items-center justify-center
                                                                ${isToday ? 'bg-indigo-600 text-white' : 'text-slate-700'}`}>
                                                    {day.getDate()}
                                                </div>
                                            </th>
                                        )
                                    })}
                                </tr>
                            </thead>

                            {/* Rows — one per room */}
                            <tbody>
                                {roomsMeta.map((room, rowIdx) => (
                                    <tr key={room.id} className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}>
                                        {/* Room label */}
                                        <td className="sticky left-0 z-10 border-r border-slate-200 px-4 py-2
                                                        bg-inherit text-sm">
                                            <p className="font-medium text-slate-800 truncate max-w-[120px]">{room.roomType}</p>
                                            <p className="text-[10px] text-slate-400 mt-0.5">
                                                {room.pricePerNight?.toLocaleString('vi-VN')}₫/đêm
                                            </p>
                                        </td>

                                        {/* Day cells */}
                                        {days.map((day) => {
                                            const ymd = toYMD(day)
                                            const isToday = ymd === today
                                            const event = getEventForCell(room.id, day)
                                            const cfg = event ? getStatusCfg(event.status) : null
                                            const isStart = event ? isEventStart(event, day) : false
                                            const tooltipKey = `${event?.id}-${room.id}`
                                            const showTip = activeTooltip === tooltipKey

                                            return (
                                                <td
                                                    key={ymd}
                                                    className={`relative border-r border-slate-100 p-0 h-12
                                                                ${isToday ? 'bg-indigo-50/50' : ''}`}
                                                >
                                                    {event ? (
                                                        <div
                                                            className={`absolute inset-y-1 left-0 right-0 mx-px
                                                                        ${cfg.bg} cursor-pointer
                                                                        ${isStart ? 'rounded-l-lg ml-1' : ''}
                                                                        flex items-center overflow-hidden
                                                                        transition-opacity hover:opacity-90`}
                                                            onMouseEnter={() => setActiveTooltip(tooltipKey)}
                                                            onMouseLeave={() => setActiveTooltip(null)}
                                                        >
                                                            {isStart && (
                                                                <span className={`text-[10px] font-semibold px-2 truncate ${cfg.text} select-none whitespace-nowrap`}>
                                                                    {event.guestName}
                                                                </span>
                                                            )}

                                                            {/* Tooltip */}
                                                            {showTip && (
                                                                <EventTooltip
                                                                    event={event}
                                                                    onClose={() => setActiveTooltip(null)}
                                                                />
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="w-full h-full" />
                                                    )}
                                                </td>
                                            )
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ── Info note ── */}
            <div className="mt-4 flex items-start gap-2 text-xs text-slate-500">
                <Info className="w-3.5 h-3.5 mt-0.5 shrink-0 text-slate-400" />
                <p>Di chuột lên thanh đặt phòng để xem chi tiết. Cuộn ngang để xem thêm ngày.</p>
            </div>
        </div>
    )
}

export default OccupancyCalendar
