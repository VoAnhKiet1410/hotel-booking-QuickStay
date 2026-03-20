import React, { useEffect, useState } from 'react'
import RefundModal from '../components/RefundModal'
import { assets } from '../assets/assets'
import { useClerk, useUser } from '@clerk/clerk-react'
import { useNavigate } from 'react-router-dom'
import { useAppContext } from '../context/appContextCore'
import { toast } from 'react-hot-toast'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const MyBookings = () => {
  const navigate = useNavigate()
  const { openSignIn } = useClerk()
  const { user } = useUser()
  const { axios } = useAppContext()
  const [bookings, setBookings] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [payingBookingId, setPayingBookingId] = useState(null)
  const [refundingBookingId, setRefundingBookingId] = useState(null)
  const [showRefundModal, setShowRefundModal] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [refundResult, setRefundResult] = useState(null)
  const listRef = React.useRef(null)

  React.useLayoutEffect(() => {
    if (isLoading || bookings.length === 0) return;

    let ctx = gsap.context(() => {
      if (!listRef.current) return;
      const items = listRef.current.children;
      if (items.length === 0) return;

      gsap.fromTo(items, {
        y: 30,
        opacity: 0
      }, {
        y: 0,
        opacity: 1,
        duration: 0.6,
        stagger: 0.1,
        ease: "power2.out",
        scrollTrigger: {
          trigger: listRef.current,
          start: "top 95%",
          toggleActions: "play none none none"
        }
      });
    });
    return () => ctx.revert();
  }, [bookings, isLoading]);

  useEffect(() => {
    let cancelled = false
    const fetchBookings = async () => {
      try {
        if (!user) { if (!cancelled) setBookings([]); return }
        if (!axios) { if (!cancelled) setBookings([]); return }
        if (!cancelled) setIsLoading(true)
        const { data } = await axios.get('/api/bookings/my')
        if (cancelled) return
        if (data?.success) {
          setBookings(Array.isArray(data.data) ? data.data : [])
        } else {
          setBookings([])
          toast.error(data?.message || 'Không thể tải danh sách đặt phòng')
        }
      } catch (error) {
        if (cancelled) return
        setBookings([])
        toast.error(error?.response?.data?.message || 'Không thể tải danh sách đặt phòng')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    fetchBookings()
    return () => { cancelled = true }
  }, [axios, user])

  const handlePayment = async (bookingId) => {
    if (!axios) { toast.error('Không thể kết nối server'); return }
    setPayingBookingId(bookingId)
    try {
      const { data } = await axios.post('/api/payments/create-checkout-session', { bookingId })
      if (data?.success && data.data?.url) {
        window.location.href = data.data.url
      } else {
        toast.error(data?.message || 'Không thể tạo phiên thanh toán')
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Không thể xử lý thanh toán')
    } finally {
      setPayingBookingId(null)
    }
  }

  const handleRefund = async (booking) => {
    if (!axios) { toast.error('Không thể kết nối server'); return }
    setSelectedBooking({
      id: booking._id,
      hotelName: booking.hotel?.name || booking.room?.hotel?.name || 'Khách sạn',
      amount: booking.totalPrice || 0,
      checkInDate: booking.checkInDate,   // để RefundModal tính policy
    })
    setShowRefundModal(true)
  }

  const confirmRefund = async () => {
    if (!selectedBooking || !axios) return
    setRefundingBookingId(selectedBooking.id)
    try {
      const { data } = await axios.post('/api/payments/refund', {
        bookingId: selectedBooking.id,
        reason: 'Customer requested cancellation',
      })
      if (data?.success) {
        // Lưu kết quả refund để hiển thị trong modal thay vì toast ngay
        setRefundResult({
          refundAmount: data.data?.booking?.refundAmount ?? data.data?.refund?.amount ?? 0,
          refundType: data.data?.refundType || 'full',
          stripeRefundId: data.data?.refund?.id || '',
          stripeRefundStatus: data.data?.refund?.status || 'succeeded',
          policy: data.data?.policy || null,
        })
        // Re-fetch tách biệt — lỗi data refresh không che lỗi refund thật
        try {
          const { data: bookingsData } = await axios.get('/api/bookings/my')
          if (bookingsData?.success) {
            setBookings(Array.isArray(bookingsData.data) ? bookingsData.data : [])
          }
        } catch {
          // Re-fetch fail chỉ ảnh hưởng hiển thị, refund đã thành công
        }
      } else {
        toast.error(data?.message || 'Không thể hoàn tiền')
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Không thể xử lý hoàn tiền')
    } finally {
      setRefundingBookingId(null)
    }
  }

  const handleCloseRefundModal = () => {
    if (refundResult) {
      toast.success('Hoàn tiền thành công! Tiền sẽ được hoàn lại trong 5-10 ngày làm việc.')
    }
    setShowRefundModal(false)
    setSelectedBooking(null)
    setRefundResult(null)
  }

  const formatDate = (value) => {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ''
    return date.toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: '2-digit' })
  }

  return (
    <div className="bg-[#f5f3ef] min-h-screen pt-28 md:pt-32 pb-24 px-4 md:px-16 lg:px-24 xl:px-32">
      <div className="mx-auto max-w-6xl">

        {/* Drake-style header */}
        <div data-scroll data-scroll-speed="0.1">
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-gray-400 mb-4 block">
            Quản lý đặt phòng
          </span>
          <div className="flex flex-wrap gap-2 mb-4">
            {['Đặt', 'Chỗ', 'Của', 'Tôi'].map((word) => (
              <span key={word} className="inline-block border-2 border-gray-800 rounded-lg px-3.5 py-1.5 text-2xl md:text-3xl lg:text-4xl font-playfair font-semibold text-gray-900 tracking-tight">
                {word}
              </span>
            ))}
          </div>
          <p className="text-sm text-gray-500 font-light max-w-lg">
            Theo dõi các phòng đã đặt, hiện tại và sắp tới. Quản lý lịch trình dễ dàng.
          </p>
        </div>

        <div className="border-t border-gray-300 mt-8 mb-8" />

        <RefundModal
          isOpen={showRefundModal}
          onClose={handleCloseRefundModal}
          onConfirm={confirmRefund}
          isLoading={refundingBookingId === selectedBooking?.id}
          bookingDetails={selectedBooking}
          refundResult={refundResult}
        />

        {!user ? (
          <div className="border border-gray-300 bg-white p-8">
            <p className="text-sm text-gray-600">Vui lòng đăng nhập để xem danh sách đặt phòng.</p>
            <button
              type="button"
              onClick={openSignIn}
              className="mt-4 font-mono text-[10px] uppercase tracking-[0.15em] border border-gray-800 px-5 py-2.5 text-gray-900 hover:bg-gray-900 hover:text-white transition-all cursor-pointer"
            >
              Đăng nhập
            </button>
          </div>
        ) : isLoading ? (
          <div className="border border-gray-300 bg-white p-8">
            <p className="text-sm text-gray-500 font-mono text-[10px] uppercase tracking-wider">Đang tải...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="border border-gray-300 bg-white p-8 text-center">
            <p className="text-sm text-gray-600">Bạn chưa có đặt phòng nào.</p>
            <button
              type="button"
              onClick={() => navigate('/rooms')}
              className="mt-4 group inline-flex items-center gap-3 border border-gray-800 px-5 py-2.5 hover:bg-gray-900 hover:text-white transition-all cursor-pointer"
            >
              <span className="font-mono text-[10px] uppercase tracking-[0.15em]">Xem khách sạn</span>
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full border border-current transition-all">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </span>
            </button>
          </div>
        ) : (
          <div className="border border-gray-300 bg-white overflow-hidden">
            {/* Table header */}
            <div className="hidden md:grid grid-cols-[minmax(0,1.7fr)_minmax(0,1.1fr)_minmax(0,0.7fr)] gap-6 px-6 py-4 border-b border-gray-200">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-gray-400">Khách sạn</p>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-gray-400">Ngày & thời gian</p>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-gray-400">Thanh toán</p>
            </div>

            <div ref={listRef} className="divide-y divide-gray-200">
              {bookings.map((booking) => {
                const room = booking.room
                const hotel = room?.hotel || booking.hotel
                const isPaid = Boolean(booking.isPaid)
                const isRefunded = Boolean(booking.isRefunded)
                const isCancelled = booking.status === 'cancelled'
                const priceText = `${(booking.totalPrice ?? 0).toLocaleString('vi-VN')}₫`
                const roomTypeText = room?.roomType ? `(${room.roomType})` : ''
                const isProcessing = payingBookingId === booking._id
                const isRefunding = refundingBookingId === booking._id

                return (
                  <div
                    key={booking._id}
                    className="grid grid-cols-1 gap-5 px-5 py-6 md:grid-cols-[minmax(0,1.7fr)_minmax(0,1.1fr)_minmax(0,0.7fr)] md:gap-6 md:px-6 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={() => { if (room?._id) navigate(`/rooms/${room._id}`); scrollTo(0, 0) }}
                        className="group relative h-20 w-32 shrink-0 overflow-hidden border border-gray-200 bg-gray-100"
                      >
                        <img
                          src={room?.images?.[0]}
                          alt={hotel?.name || 'Ảnh phòng'}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </button>

                      <div className="min-w-0">
                        <p className="font-playfair text-base font-semibold text-gray-900 truncate">
                          {hotel?.name}
                          {roomTypeText && (
                            <span className="ml-2 font-mono text-[10px] uppercase tracking-wider text-gray-400">
                              {roomTypeText}
                            </span>
                          )}
                        </p>

                        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                          <span className="inline-flex items-center gap-1">
                            <img src={assets.locationIcon} alt="" className="h-3 w-3" />
                            <span className="truncate">{hotel?.address}</span>
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <img src={assets.guestsIcon} alt="" className="h-3 w-3" />
                            <span>{booking.guests} khách</span>
                          </span>
                        </div>

                        {/* Yêu cầu đặc biệt (nếu có) */}
                        {booking.specialRequests && (
                          <div className="mt-2 flex items-start gap-1.5 rounded bg-amber-50 border border-amber-100 px-2 py-1.5 max-w-xs">
                            <span className="text-amber-400 text-[10px] shrink-0">📋</span>
                            <p className="text-[10px] text-amber-700 leading-snug line-clamp-2">
                              <span className="font-semibold">Y/c: </span>
                              {booking.specialRequests}
                            </p>
                          </div>
                        )}

                        <p className="mt-2 text-xs text-gray-600">
                          <span className="font-semibold text-gray-900">Tổng:</span>{' '}
                          <span className="font-semibold">{priceText}</span>
                          {booking.paymentMethod && (
                            <span className="ml-2 text-gray-400">· {booking.paymentMethod === 'stripe' ? 'Thanh toán online' : 'Tại khách sạn'}</span>
                          )}
                        </p>

                        {/* Lịch sử giao dịch — expandable info */}
                        <div className="mt-2.5 space-y-1">
                          {/* Booking status */}
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[9px] uppercase tracking-wider text-gray-400 w-[68px] shrink-0">Trạng thái</span>
                            <span className={`text-[10px] font-medium ${booking.status === 'confirmed' ? 'text-emerald-600' :
                              booking.status === 'checked_in' ? 'text-teal-600' :
                                booking.status === 'completed' ? 'text-amber-600' :
                                  booking.status === 'cancelled' ? 'text-red-500' : 'text-gray-500'
                              }`}>
                              {{
                                pending: 'Chờ xác nhận',
                                confirmed: 'Đã xác nhận',
                                checked_in: 'Đang ở',
                                completed: 'Đã trả phòng',
                                cancelled: 'Đã hủy',
                              }[booking.status] || booking.status}
                            </span>
                          </div>

                          {/* Ngày thanh toán */}
                          {booking.isPaid && booking.paidAt && (
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-[9px] uppercase tracking-wider text-gray-400 w-[68px] shrink-0">Đã thanh toán</span>
                              <span className="text-[10px] text-gray-600">
                                {new Date(booking.paidAt).toLocaleDateString('vi-VN', {
                                  day: '2-digit', month: '2-digit', year: 'numeric'
                                })}
                              </span>
                            </div>
                          )}

                          {/* Ngày hoàn tiền */}
                          {booking.isRefunded && booking.refundedAt && (
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-[9px] uppercase tracking-wider text-violet-400 w-[68px] shrink-0">Hoàn tiền</span>
                              <span className="text-[10px] text-violet-600 font-medium">
                                {booking.refundAmount
                                  ? `${booking.refundAmount.toLocaleString('vi-VN')}₫ — `
                                  : ''
                                }
                                {new Date(booking.refundedAt).toLocaleDateString('vi-VN', {
                                  day: '2-digit', month: '2-digit', year: 'numeric'
                                })}
                              </span>
                            </div>
                          )}

                          {/* Discount info */}
                          {booking.discountAmount > 0 && (
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-[9px] uppercase tracking-wider text-gray-400 w-[68px] shrink-0">Giảm giá</span>
                              <span className="text-[10px] text-emerald-600 font-medium">
                                -{booking.discountAmount.toLocaleString('vi-VN')}₫
                                {booking.couponCode && (
                                  <span className="ml-1 text-gray-400">({booking.couponCode})</span>
                                )}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs md:grid-cols-1 md:gap-3">
                      <div>
                        <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-gray-400">Nhận phòng</p>
                        <p className="mt-1 text-gray-700 text-sm">{formatDate(booking.checkInDate)}</p>
                      </div>
                      <div>
                        <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-gray-400">Trả phòng</p>
                        <p className="mt-1 text-gray-700 text-sm">{formatDate(booking.checkOutDate)}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:flex-col md:items-start md:justify-center md:gap-3">
                      <div className="flex items-center gap-2 text-xs font-medium">
                        <span className={`h-2 w-2 rounded-full ${isCancelled ? 'bg-gray-400' : isPaid ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        <span className={isCancelled ? 'text-gray-500' : isPaid ? 'text-emerald-700' : 'text-red-600'}>
                          {isCancelled ? (isRefunded ? 'Đã hoàn tiền' : 'Đã hủy') : isPaid ? 'Đã thanh toán' : 'Chưa thanh toán'}
                        </span>
                      </div>

                      <div className="flex flex-col gap-2 w-full md:w-auto">
                        {/* Nút thanh toán Stripe — CHỈ cho booking online chưa trả tiền */}
                        {!isPaid && !isCancelled && booking.paymentMethod === 'stripe' && (
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => handlePayment(booking._id)}
                            className="font-mono text-[10px] uppercase tracking-[0.15em] border border-gray-800 px-4 py-2 text-gray-900 hover:bg-gray-900 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                          >
                            {isProcessing ? 'Đang xử lý...' : 'Thanh toán online'}
                          </button>
                        )}

                        {/* payAtHotel chưa trả → hướng dẫn thanh toán tại quầy */}
                        {!isPaid && !isCancelled && booking.paymentMethod !== 'stripe' && (
                          <p className="text-[10px] text-amber-600 font-medium max-w-[160px] leading-relaxed">
                            Thanh toán tiền mặt khi nhận phòng
                          </p>
                        )}

                        {/* Nút hoàn tiền — CHỈ khi status=confirmed (chưa check-in) */}
                        {isPaid && !isRefunded && !isCancelled && booking.status === 'confirmed' && (
                          <button
                            type="button"
                            disabled={isRefunding}
                            onClick={() => handleRefund(booking)}
                            className="font-mono text-[10px] uppercase tracking-[0.15em] border border-red-300 text-red-600 px-4 py-2 hover:border-red-600 hover:bg-red-600 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                          >
                            {isRefunding ? 'Đang xử lý...' : 'Hủy & Hoàn tiền'}
                          </button>
                        )}

                        {/* Đã check-in: không hoàn tiền cho đêm đã ở */}
                        {isPaid && !isCancelled && booking.status === 'checked_in' && (
                          <p className="text-[10px] text-gray-400 max-w-[120px] leading-relaxed">
                            Đang lưu trú — liên hệ khách sạn để hỗ trợ
                          </p>
                        )}

                        {/* Đã trả phòng: dịch vụ hoàn tất, không hoàn tiền */}
                        {isPaid && !isCancelled && booking.status === 'completed' && (
                          <p className="text-[10px] text-gray-400 max-w-[120px] leading-relaxed">
                            Đã sử dụng dịch vụ
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MyBookings
