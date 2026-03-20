import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Title from '../../components/Title'
import { assets } from '../../assets/assets'
import { useAppContext } from '../../context/appContextCore'
import { toast } from 'react-hot-toast'

const ListRoom = () => {
  const navigate = useNavigate()
  const { axios } = useAppContext()
  const [rooms, setRooms] = useState([])
  const [hotels, setHotels] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [hotelFilter, setHotelFilter] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  const [updatingRoomIds, setUpdatingRoomIds] = useState({})
  const [deletingRoomIds, setDeletingRoomIds] = useState({})
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

  // Fetch owner's hotels for the filter dropdown
  useEffect(() => {
    if (!axios) return
    const fetchHotels = async () => {
      try {
        const { data } = await axios.get('/api/hotels/my')
        if (data?.success) setHotels(data.data || [])
      } catch (err) {
        console.log('Failed to fetch hotels:', err)
      }
    }
    fetchHotels()
  }, [axios])

  // Fetch rooms (all or filtered by hotel)
  useEffect(() => {
    if (!axios) return
    let cancelled = false
    const fetchRooms = async () => {
      setIsLoading(true)
      try {
        const url = hotelFilter !== 'all'
          ? `/api/rooms/owner?hotelId=${hotelFilter}`
          : '/api/rooms/owner'
        const { data } = await axios.get(url)
        if (cancelled) return
        setRooms(Array.isArray(data?.data) ? data.data : [])
      } catch (error) {
        if (cancelled) return
        toast.error(error?.response?.data?.message || 'Không thể tải danh sách phòng')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    fetchRooms()
    return () => { cancelled = true }
  }, [axios, hotelFilter])

  const filteredRooms = useMemo(() => {
    const text = searchTerm.trim().toLowerCase()

    let result = rooms.filter((room) => {
      const roomStatus = room.status || 'open'
      const roomTypeText = room.roomType?.toLowerCase() || ''
      const hotelNameText = room.hotel?.name?.toLowerCase() || ''
      const cityText = room.hotel?.city?.toLowerCase() || ''

      const matchText =
        !text ||
        roomTypeText.includes(text) ||
        hotelNameText.includes(text) ||
        cityText.includes(text)

      if (!matchText) return false

      if (statusFilter === 'available') return roomStatus === 'open'
      if (statusFilter === 'unavailable') return roomStatus !== 'open'

      return true
    })

    result = [...result].sort((a, b) => {
      if (sortBy === 'priceAsc') return a.pricePerNight - b.pricePerNight
      if (sortBy === 'priceDesc') return b.pricePerNight - a.pricePerNight
      const dateA = new Date(a.createdAt)
      const dateB = new Date(b.createdAt)
      return dateB - dateA
    })

    return result
  }, [rooms, searchTerm, statusFilter, sortBy])

  const setBusyFlag = (setter, roomId, value) => {
    setter((prev) => {
      const next = { ...prev }
      if (value) { next[roomId] = true; return next }
      delete next[roomId]
      return next
    })
  }

  const updateRoomStatus = async (roomId, nextStatus) => {
    if (!axios) { toast.error('Không thể kết nối máy chủ'); return }
    setBusyFlag(setUpdatingRoomIds, roomId, true)
    try {
      const { data } = await axios.patch(`/api/rooms/owner/${roomId}/status`, { status: nextStatus })
      if (data?.success) {
        setRooms((prev) => prev.map((room) => (room._id === roomId ? { ...room, ...data.data } : room)))
        toast.success('Cập nhật trạng thái thành công')
      } else {
        toast.error(data?.message || 'Không thể cập nhật')
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Không thể cập nhật trạng thái')
    } finally {
      setBusyFlag(setUpdatingRoomIds, roomId, false)
    }
  }

  const handleDeleteClick = (roomId) => {
    if (confirmDeleteId === roomId) {
      // Second click — proceed with delete
      deleteRoom(roomId)
    } else {
      // First click — show confirmation
      setConfirmDeleteId(roomId)
      // Auto-reset after 3 seconds if user doesn't confirm
      setTimeout(() => setConfirmDeleteId((prev) => prev === roomId ? null : prev), 3000)
    }
  }

  const deleteRoom = async (roomId) => {
    if (!axios) { toast.error('Không thể kết nối máy chủ'); return }
    setConfirmDeleteId(null)
    setBusyFlag(setDeletingRoomIds, roomId, true)
    try {
      const { data } = await axios.delete(`/api/rooms/owner/${roomId}`)
      if (data?.success) {
        setRooms((prev) => prev.filter((room) => room._id !== roomId))
        toast.success('Đã xóa phòng thành công')
      } else {
        toast.error(data?.message || 'Không thể xóa phòng')
      }
    } catch (error) {
      const msg = error?.response?.data?.message || ''
      if (msg.toLowerCase().includes('booking')) {
        toast.error('Không thể xóa phòng đã có lượt đặt. Hãy chuyển sang trạng thái "Hết phòng" thay vì xóa.')
      } else {
        toast.error(msg || 'Không thể xóa phòng')
      }
    } finally {
      setBusyFlag(setDeletingRoomIds, roomId, false)
    }
  }

  const totalRooms = rooms.length

  return (
    <div className="max-w-6xl">
      <Title
        align="left"
        font="font-outfit"
        title="Danh sách phòng"
        subTitle="Theo dõi và quản lý các phòng đang mở bán trên QuickStay."
      />

      <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <p className="text-xs text-gray-500">
          {isLoading && <span>Đang tải danh sách phòng...</span>}
          {!isLoading && filteredRooms.length === totalRooms && (
            <span>{totalRooms} phòng đang có.</span>
          )}
          {!isLoading && filteredRooms.length !== totalRooms && (
            <span>
              {filteredRooms.length} / {totalRooms} phòng phù hợp với bộ lọc hiện tại.
            </span>
          )}
        </p>

        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative w-full md:w-60">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo loại phòng, khách sạn..."
              className="w-full rounded-full border border-slate-200 px-9 py-2 text-xs text-gray-900 placeholder:text-gray-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
            />
            <img
              src={assets.searchIcon}
              alt="search"
              className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 opacity-60"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {/* Hotel Filter */}
            <select
              value={hotelFilter}
              onChange={(e) => setHotelFilter(e.target.value)}
              className="w-44 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs text-gray-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
            >
              <option value="all">Tất cả khách sạn</option>
              {hotels.map(h => (
                <option key={h._id} value={h._id}>{h.name}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-32 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs text-gray-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="available">Đang mở</option>
              <option value="unavailable">Đã đóng</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-32 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs text-gray-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
            >
              <option value="newest">Mới nhất</option>
              <option value="priceAsc">Giá tăng dần</option>
              <option value="priceDesc">Giá giảm dần</option>
            </select>
          </div>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="grid grid-cols-[minmax(0,2.1fr)_minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,0.9fr)] gap-4 border-b border-slate-100 bg-slate-50 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
          <span>Phòng</span>
          <span>Giá mỗi đêm</span>
          <span>Trạng thái</span>
          <span className="text-right">Hành động</span>
        </div>

        {!isLoading &&
          filteredRooms.map((room) => {
            const hotel = room.hotel
            const priceText = `${room.pricePerNight.toLocaleString('vi-VN')} ₫/đêm`
            const currentStatus = room.status || 'open'
            const isUpdating = Boolean(updatingRoomIds[room._id])
            const isDeleting = Boolean(deletingRoomIds[room._id])
            const thumbUrl = room.images?.[0]

            return (
              <div
                key={room._id}
                className="grid grid-cols-1 gap-4 border-t border-slate-100 px-5 py-4 text-sm text-slate-800 md:grid-cols-[minmax(0,2.1fr)_minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,0.9fr)] md:items-center"
              >
                {/* Room info with thumbnail */}
                <div className="flex items-center gap-3 min-w-0">
                  {thumbUrl ? (
                    <img
                      src={thumbUrl}
                      alt={room.roomType}
                      className="h-14 w-14 shrink-0 rounded-lg object-cover border border-slate-200"
                    />
                  ) : (
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-slate-100 border border-slate-200">
                      <svg className="h-6 w-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}

                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-gray-900">
                      {room.roomType}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-gray-500">
                      {hotel?.name}
                      {room.bed ? ` · ${room.bed}` : ''}
                      {room.area ? ` · ${room.area}m²` : ''}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-gray-400">
                      {hotel?.city && (
                        <span className="inline-flex items-center gap-1">
                          <img src={assets.locationIcon} alt="city" className="h-3 w-3 opacity-60" />
                          <span>{hotel.city}</span>
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1">
                        <img src={assets.guestsIcon} alt="guests" className="h-3 w-3 opacity-60" />
                        <span>Tối đa {room.capacity || 2} khách</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-sm font-semibold text-gray-900">
                  {priceText}
                </div>

                <div>
                  <select
                    value={currentStatus}
                    disabled={isUpdating || isDeleting}
                    onChange={(e) => updateRoomStatus(room._id, e.target.value)}
                    className={`w-full max-w-[160px] rounded-lg border px-3 py-2 text-xs font-medium outline-none transition-all disabled:cursor-not-allowed disabled:opacity-60
                      ${currentStatus === 'open'
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200'
                        : currentStatus === 'paused'
                          ? 'border-amber-200 bg-amber-50 text-amber-700 focus:border-amber-400 focus:ring-2 focus:ring-amber-200'
                          : 'border-red-200 bg-red-50 text-red-700 focus:border-red-400 focus:ring-2 focus:ring-red-200'
                      }`}
                  >
                    <option value="open">🟢 Đang mở</option>
                    <option value="paused">🟡 Tạm dừng</option>
                    <option value="soldout">🔴 Hết phòng</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 justify-start md:justify-end">
                  <button
                    type="button"
                    onClick={() => navigate(`/rooms/${room._id}`, { state: { ownerRoom: room } })}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-xs font-medium text-slate-700 transition-all hover:bg-slate-200"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Xem
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate(`/owner/edit-room/${room._id}`)}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-2 text-xs font-medium text-indigo-600 transition-all hover:bg-indigo-100"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Sửa
                  </button>

                  <button
                    type="button"
                    disabled={isDeleting || isUpdating}
                    onClick={() => handleDeleteClick(room._id)}
                    onBlur={() => setConfirmDeleteId((prev) => prev === room._id ? null : prev)}
                    className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all disabled:cursor-not-allowed disabled:opacity-60 ${confirmDeleteId === room._id
                      ? 'bg-red-600 text-white animate-pulse'
                      : 'bg-red-50 text-red-600 hover:bg-red-100'
                      }`}
                  >
                    {isDeleting ? (
                      <>
                        <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Đang xóa...
                      </>
                    ) : confirmDeleteId === room._id ? (
                      <>
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3a9 9 0 100 18 9 9 0 000-18z" />
                        </svg>
                        Xác nhận xóa?
                      </>
                    ) : (
                      <>
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Xóa
                      </>
                    )}
                  </button>
                </div>
              </div>
            )
          })}

        {isLoading && (
          <div className="px-5 py-8 text-center text-sm text-slate-400 animate-pulse">
            Đang tải danh sách phòng...
          </div>
        )}

        {!isLoading && filteredRooms.length === 0 && (
          <div className="px-5 py-8 text-sm text-slate-500">
            Không tìm thấy phòng nào phù hợp với bộ lọc hiện tại. Hãy thử thay đổi từ khóa hoặc trạng thái.
          </div>
        )}
      </div>
    </div>
  )
}

export default ListRoom
