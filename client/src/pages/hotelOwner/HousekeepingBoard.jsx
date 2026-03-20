/**
 * HousekeepingBoard — Dashboard vệ sinh phòng cho Owner.
 *
 * Hiển thị: summary cards (Sạch / Cần dọn / Đang kiểm tra / Bảo trì),
 * grid phòng color-coded, dropdown đổi status, batch actions, filter, ghi chú.
 */
import React, { useEffect, useState, useCallback } from 'react'
import { useAppContext } from '../../context/appContextCore'
import { toast } from 'react-hot-toast'
import {
    Sparkles, AlertTriangle, Search, Wrench,
    Loader2, CheckCircle2, ChevronDown, StickyNote,
    RefreshCw,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const STATUS_CONFIG = {
    clean: {
        label: 'Sạch',
        color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dot: 'bg-emerald-500',
        cardBorder: 'border-l-emerald-500',
        icon: CheckCircle2,
    },
    dirty: {
        label: 'Cần dọn',
        color: 'bg-amber-50 text-amber-700 border-amber-200',
        dot: 'bg-amber-500',
        cardBorder: 'border-l-red-400',
        icon: AlertTriangle,
    },
    inspecting: {
        label: 'Đang kiểm tra',
        color: 'bg-blue-50 text-blue-700 border-blue-200',
        dot: 'bg-blue-500',
        cardBorder: 'border-l-blue-400',
        icon: Search,
    },
    out_of_order: {
        label: 'Bảo trì',
        color: 'bg-slate-100 text-slate-600 border-slate-300',
        dot: 'bg-slate-500',
        cardBorder: 'border-l-slate-400',
        icon: Wrench,
    },
}

const ALL_STATUSES = ['clean', 'dirty', 'inspecting', 'out_of_order']

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------
const SkeletonCard = () => (
    <div className="animate-pulse rounded-xl border border-slate-100 bg-white p-5">
        <div className="mb-3 h-3 w-20 rounded bg-slate-200" />
        <div className="h-7 w-16 rounded bg-slate-200" />
    </div>
)
const SkeletonRoom = () => (
    <div className="animate-pulse rounded-xl border border-slate-100 bg-white p-4">
        <div className="mb-2 h-4 w-24 rounded bg-slate-200" />
        <div className="mb-2 h-3 w-16 rounded bg-slate-100" />
        <div className="h-8 w-full rounded bg-slate-100" />
    </div>
)

// ---------------------------------------------------------------------------
// Summary Card
// ---------------------------------------------------------------------------
const SummaryCard = ({ status, count, total, onClick, isActive }) => {
    const cfg = STATUS_CONFIG[status]
    const Icon = cfg.icon
    const pct = total > 0 ? Math.round((count / total) * 100) : 0

    return (
        <button
            onClick={onClick}
            className={`group rounded-xl border bg-white p-5 shadow-sm transition hover:shadow-md
                text-left w-full ${isActive ? 'ring-2 ring-indigo-400 ring-offset-1' : 'border-slate-100'}`}
        >
            <div className="flex items-start justify-between">
                <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-500 mb-1">{cfg.label}</p>
                    <p className="text-2xl font-bold text-slate-900">{count}</p>
                    <p className="text-xs text-slate-400 mt-1">{pct}% tổng phòng</p>
                </div>
                <div className={`rounded-lg p-2.5 ${cfg.color}`}>
                    <Icon className="h-5 w-5" />
                </div>
            </div>
        </button>
    )
}

// ---------------------------------------------------------------------------
// Room Card
// ---------------------------------------------------------------------------
const RoomCard = ({ room, selected, onToggle, onUpdateStatus, onUpdateNote }) => {
    const status = room.housekeepingStatus || 'clean'
    const cfg = STATUS_CONFIG[status]
    const [showNote, setShowNote] = useState(false)
    const [note, setNote] = useState(room.housekeepingNote || '')

    return (
        <div
            className={`relative rounded-xl border-l-4 ${cfg.cardBorder} border border-slate-100
                        bg-white p-4 shadow-sm transition hover:shadow-md`}
        >
            {/* Checkbox for batch select */}
            <div className="absolute top-3 right-3">
                <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => onToggle(room._id)}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-500
                               focus:ring-indigo-400 cursor-pointer"
                />
            </div>

            {/* Room info */}
            <div className="mb-3">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    {room.roomType}
                    {room.isOccupied && (
                        <span className="text-[10px] font-medium bg-rose-50 text-rose-600
                                         rounded-full px-1.5 py-0.5">
                            OCC
                        </span>
                    )}
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                    {room.hotel?.name || '—'}
                </p>
            </div>

            {/* Status badge */}
            <div className="mb-3">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1
                                  text-xs font-semibold border ${cfg.color}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                    {cfg.label}
                </span>
            </div>

            {/* Status dropdown */}
            <div className="relative mb-2">
                <select
                    value={status}
                    onChange={(e) => onUpdateStatus(room._id, e.target.value)}
                    className="w-full appearance-none rounded-lg border border-slate-200 bg-slate-50
                               py-1.5 pl-3 pr-8 text-xs font-medium text-slate-700
                               focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100
                               cursor-pointer transition"
                >
                    {ALL_STATUSES.map((s) => (
                        <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                    ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            </div>

            {/* Note toggle */}
            <button
                onClick={() => setShowNote(!showNote)}
                className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-indigo-500 transition"
            >
                <StickyNote className="h-3 w-3" />
                {showNote ? 'Ẩn ghi chú' : 'Ghi chú'}
            </button>

            {showNote && (
                <div className="mt-2">
                    <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Nhập ghi chú..."
                        maxLength={500}
                        rows={2}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2
                                   text-xs text-slate-700 placeholder:text-slate-300
                                   focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100
                                   resize-none transition"
                    />
                    <button
                        onClick={() => onUpdateNote(room._id, note)}
                        className="mt-1 text-[11px] font-medium text-indigo-500 hover:text-indigo-700 transition"
                    >
                        Lưu ghi chú
                    </button>
                </div>
            )}
        </div>
    )
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
const HousekeepingBoard = () => {
    const { axios } = useAppContext()
    const [loading, setLoading] = useState(true)
    const [rooms, setRooms] = useState([])
    const [summary, setSummary] = useState({ clean: 0, dirty: 0, inspecting: 0, out_of_order: 0 })
    const [filter, setFilter] = useState(null) // null = all, 'clean' | 'dirty' etc
    const [selectedIds, setSelectedIds] = useState(new Set())
    const [search, setSearch] = useState('')
    const [updating, setUpdating] = useState(false)

    // Fetch board data
    const fetchBoard = useCallback(async () => {
        if (!axios) return
        setLoading(true)
        try {
            const { data: res } = await axios.get('/api/housekeeping/owner/board')
            if (res.success) {
                setRooms(res.data.rooms)
                setSummary(res.data.summary)
            } else {
                toast.error(res.message || 'Không tải được dữ liệu')
            }
        } catch (err) {
            console.error('Housekeeping fetch error:', err)
            toast.error('Lỗi khi tải bảng vệ sinh phòng')
        } finally {
            setLoading(false)
        }
    }, [axios])

    useEffect(() => { fetchBoard() }, [fetchBoard])

    // Update single room status
    const handleUpdateStatus = async (roomId, newStatus) => {
        try {
            const { data: res } = await axios.patch(`/api/housekeeping/owner/${roomId}`, {
                housekeepingStatus: newStatus,
            })
            if (res.success) {
                setRooms((prev) =>
                    prev.map((r) =>
                        r._id === roomId ? { ...r, housekeepingStatus: newStatus } : r,
                    ),
                )
                // Re-count summary
                recountSummary(rooms.map((r) =>
                    r._id === roomId ? { ...r, housekeepingStatus: newStatus } : r,
                ))
                toast.success('Đã cập nhật trạng thái')
            }
        } catch {
            toast.error('Không thể cập nhật')
        }
    }

    // Update note
    const handleUpdateNote = async (roomId, note) => {
        try {
            const { data: res } = await axios.patch(`/api/housekeeping/owner/${roomId}`, {
                housekeepingStatus: rooms.find((r) => r._id === roomId)?.housekeepingStatus || 'clean',
                housekeepingNote: note,
            })
            if (res.success) {
                setRooms((prev) =>
                    prev.map((r) =>
                        r._id === roomId ? { ...r, housekeepingNote: note } : r,
                    ),
                )
                toast.success('Đã lưu ghi chú')
            }
        } catch {
            toast.error('Không thể lưu ghi chú')
        }
    }

    // Batch update
    const handleBatchUpdate = async (newStatus) => {
        if (selectedIds.size === 0) return toast.error('Chọn ít nhất 1 phòng')
        setUpdating(true)
        try {
            const { data: res } = await axios.patch('/api/housekeeping/owner/batch', {
                roomIds: Array.from(selectedIds),
                housekeepingStatus: newStatus,
            })
            if (res.success) {
                setRooms((prev) =>
                    prev.map((r) =>
                        selectedIds.has(r._id) ? { ...r, housekeepingStatus: newStatus } : r,
                    ),
                )
                recountSummary(rooms.map((r) =>
                    selectedIds.has(r._id) ? { ...r, housekeepingStatus: newStatus } : r,
                ))
                setSelectedIds(new Set())
                toast.success(`Đã cập nhật ${res.data.modifiedCount} phòng`)
            }
        } catch {
            toast.error('Lỗi khi cập nhật hàng loạt')
        } finally {
            setUpdating(false)
        }
    }

    // Re-count summary helper
    const recountSummary = (roomList) => {
        const s = { clean: 0, dirty: 0, inspecting: 0, out_of_order: 0 }
        for (const r of roomList) {
            const k = r.housekeepingStatus || 'clean'
            if (s[k] !== undefined) s[k] += 1
        }
        setSummary(s)
    }

    // Toggle selection
    const toggleSelect = (id) => {
        setSelectedIds((prev) => {
            const next = new Set(prev)
            next.has(id) ? next.delete(id) : next.add(id)
            return next
        })
    }

    // Visible rooms (filter + search)
    const visibleRooms = rooms.filter((r) => {
        if (filter && (r.housekeepingStatus || 'clean') !== filter) return false
        if (search) {
            const q = search.toLowerCase()
            const matchRoom = r.roomType?.toLowerCase().includes(q)
            const matchHotel = r.hotel?.name?.toLowerCase().includes(q)
            return matchRoom || matchHotel
        }
        return true
    })

    // -----------------------------------------------------------------------
    // Skeleton loading
    // -----------------------------------------------------------------------
    if (loading && rooms.length === 0) {
        return (
            <div className="p-6 space-y-6">
                <div className="flex items-center gap-3">
                    <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />
                    <span className="text-sm text-slate-500">Đang tải bảng vệ sinh phòng…</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {[...Array(8)].map((_, i) => <SkeletonRoom key={i} />)}
                </div>
            </div>
        )
    }

    const totalRooms = rooms.length

    // -----------------------------------------------------------------------
    // Render
    // -----------------------------------------------------------------------
    return (
        <div className="p-6 space-y-6 min-h-screen">
            {/* — Header — */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-slate-900">Vệ sinh phòng</h1>
                    <p className="text-sm text-slate-500 mt-0.5">
                        Quản lý trạng thái dọn phòng &amp; bảo trì
                    </p>
                </div>
                <button
                    onClick={fetchBoard}
                    disabled={loading}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200
                               bg-white px-4 py-2 text-sm font-medium text-slate-700
                               shadow-sm hover:bg-slate-50 transition disabled:opacity-50"
                >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    Làm mới
                </button>
            </div>

            {/* — Summary Cards — */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {ALL_STATUSES.map((s) => (
                    <SummaryCard
                        key={s}
                        status={s}
                        count={summary[s]}
                        total={totalRooms}
                        isActive={filter === s}
                        onClick={() => setFilter(filter === s ? null : s)}
                    />
                ))}
            </div>

            {/* — Toolbar: Search + Batch Actions — */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                {/* Search */}
                <div className="relative flex-1 max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Tìm phòng hoặc khách sạn…"
                        className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-4
                                   text-sm text-slate-700 placeholder:text-slate-400
                                   focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition"
                    />
                </div>

                {/* Batch actions */}
                {selectedIds.size > 0 && (
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">
                            Đã chọn <span className="font-bold text-indigo-600">{selectedIds.size}</span> phòng
                        </span>
                        {ALL_STATUSES.map((s) => {
                            const cfg = STATUS_CONFIG[s]
                            return (
                                <button
                                    key={s}
                                    onClick={() => handleBatchUpdate(s)}
                                    disabled={updating}
                                    className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1.5
                                                text-xs font-semibold transition ${cfg.color}
                                                hover:opacity-80 disabled:opacity-40`}
                                >
                                    <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                                    {cfg.label}
                                </button>
                            )
                        })}
                        <button
                            onClick={() => setSelectedIds(new Set())}
                            className="text-xs text-slate-400 hover:text-slate-600 ml-1"
                        >
                            Bỏ chọn
                        </button>
                    </div>
                )}
            </div>

            {/* Active filter indicator */}
            {filter && (
                <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">
                        Đang lọc: <span className="font-semibold">{STATUS_CONFIG[filter].label}</span>
                    </span>
                    <button
                        onClick={() => setFilter(null)}
                        className="text-xs text-indigo-500 hover:text-indigo-700"
                    >
                        Xóa bộ lọc
                    </button>
                </div>
            )}

            {/* — Room Grid — */}
            {visibleRooms.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                    <Sparkles className="h-10 w-10 mb-3 text-slate-300" />
                    <p className="text-sm font-medium">Không tìm thấy phòng nào</p>
                    <p className="text-xs mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {visibleRooms.map((room) => (
                        <RoomCard
                            key={room._id}
                            room={room}
                            selected={selectedIds.has(room._id)}
                            onToggle={toggleSelect}
                            onUpdateStatus={handleUpdateStatus}
                            onUpdateNote={handleUpdateNote}
                        />
                    ))}
                </div>
            )}

            {/* Footer count */}
            <p className="text-xs text-slate-400 text-right">
                Hiển thị {visibleRooms.length} / {totalRooms} phòng
            </p>
        </div>
    )
}

export default HousekeepingBoard
