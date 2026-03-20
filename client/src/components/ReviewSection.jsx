import React, { useState, useEffect } from 'react'
import { useUser } from '@clerk/clerk-react'
import { useAppContext } from '../context/appContextCore'
import { assets } from '../assets/assets'
import { toast } from 'react-hot-toast'

const ReviewSection = ({ roomId }) => {
  const { axios } = useAppContext()
  const { isSignedIn } = useUser()

  const [reviews, setReviews] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({ average: 0, total: 0, distribution: {} })
  const [eligibleBooking, setEligibleBooking] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    rating: 5,
    comment: '',
    cleanliness: 5,
    service: 5,
    location: 5,
    valueForMoney: 5,
  })

  const fetchReviews = async () => {
    try {
      setIsLoading(true)
      const { data } = await axios.get(`/api/reviews/room/${roomId}`)
      if (data?.success) {
        const reviewsList = Array.isArray(data.data?.reviews) 
          ? data.data.reviews 
          : Array.isArray(data.data) 
            ? data.data 
            : []
        setReviews(reviewsList)
        
        if (data.data?.stats) {
          setStats({
            average: data.data.stats.avgRating || 0,
            total: data.data.pagination?.total || reviewsList.length,
            distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
          })
        } else {
          calculateStats(reviewsList)
        }
      }
    } catch {
      // Silent fail
    } finally {
      setIsLoading(false)
    }
  }

  const checkEligibility = async () => {
    if (!isSignedIn || !axios) {
      setEligibleBooking(null)
      return
    }
    
    try {
      const { data } = await axios.get('/api/bookings/my')
      
      if (data?.success && Array.isArray(data.data)) {
        const now = new Date()
        
        // Find eligible booking: completed/confirmed/checked_in AND checkout date passed
        const eligible = data.data.find((b) => {
          const checkOutDate = new Date(b.checkOutDate)
          const isRoomMatch = b.room?._id === roomId
          const isEligibleStatus = ['completed', 'confirmed', 'checked_in'].includes(b.status)
          const isCheckoutPassed = checkOutDate < now
          
          return isRoomMatch && isEligibleStatus && isCheckoutPassed
        })
        
        setEligibleBooking(eligible || null)
      } else {
        setEligibleBooking(null)
      }
    } catch {
      setEligibleBooking(null)
    }
  }

  useEffect(() => {
    if (!axios || !roomId) return
    fetchReviews()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [axios, roomId])

  useEffect(() => {
    if (isSignedIn && axios && roomId) {
      checkEligibility()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn, axios, roomId])

  const calculateStats = (reviewsList) => {
    if (!reviewsList.length) {
      setStats({ average: 0, total: 0, distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } })
      return
    }

    const total = reviewsList.length
    const sum = reviewsList.reduce((acc, r) => acc + r.rating, 0)
    const average = (sum / total).toFixed(1)

    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    reviewsList.forEach((r) => {
      distribution[r.rating] = (distribution[r.rating] || 0) + 1
    })

    setStats({ average: parseFloat(average), total, distribution })
  }

  const renderStars = (rating, size = 'w-4 h-4') => {
    return Array.from({ length: 5 }, (_, index) => (
      <img
        key={index}
        src={index < rating ? assets.starIconFilled : assets.starIconOutlined}
        alt="star"
        className={size}
      />
    ))
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const handleMarkHelpful = async (reviewId) => {
    if (!axios) return
    try {
      const { data } = await axios.post(`/api/reviews/${reviewId}/helpful`)
      if (data?.success) {
        setReviews((prev) =>
          prev.map((r) =>
            r._id === reviewId ? { ...r, helpfulCount: (r.helpfulCount || 0) + 1 } : r
          )
        )
        toast.success('Cảm ơn phản hồi của bạn!')
      }
    } catch {
      toast.error('Không thể đánh dấu hữu ích')
    }
  }

  const getRatingLabel = (rating) => {
    if (rating >= 4.5) return 'Xuất sắc'
    if (rating >= 4) return 'Rất tốt'
    if (rating >= 3.5) return 'Tốt'
    if (rating >= 3) return 'Khá'
    return 'Trung bình'
  }

  const handleSubmitReview = async (e) => {
    e.preventDefault()
    if (!eligibleBooking || !axios) return

    if (!formData.comment.trim()) {
      toast.error('Vui lòng nhập nhận xét')
      return
    }

    setIsSubmitting(true)
    try {
      const { data } = await axios.post('/api/reviews', {
        bookingId: eligibleBooking._id,
        rating: formData.rating,
        comment: formData.comment.trim(),
        cleanliness: formData.cleanliness,
        service: formData.service,
        location: formData.location,
        valueForMoney: formData.valueForMoney,
      })

      if (data?.success) {
        toast.success('Đánh giá của bạn đã được gửi!')
        setShowForm(false)
        setEligibleBooking(null)
        setFormData({
          rating: 5,
          comment: '',
          cleanliness: 5,
          service: 5,
          location: 5,
          valueForMoney: 5,
        })
        fetchReviews()
      }
    } catch (err) {
      const message = err?.response?.data?.message || 'Không thể gửi đánh giá'
      toast.error(message)
      
      // If already reviewed, hide the form
      if (message.includes('already reviewed') || message.includes('đã đánh giá')) {
        setEligibleBooking(null)
        setShowForm(false)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const StarRatingInput = ({ value, onChange, label }) => (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-600">{label}</span>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="p-0.5 transition-transform hover:scale-110"
          >
            <img
              src={star <= value ? assets.starIconFilled : assets.starIconOutlined}
              alt={`${star} star`}
              className="w-5 h-5"
            />
          </button>
        ))}
      </div>
    </div>
  )

  if (isLoading) {
    return (
      <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="animate-pulse">
          <div className="h-6 w-48 bg-slate-200 rounded mb-4"></div>
          <div className="h-4 w-full bg-slate-100 rounded mb-2"></div>
          <div className="h-4 w-3/4 bg-slate-100 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
            Đánh giá & Nhận xét
          </p>
          <p className="mt-2 text-xl font-semibold text-gray-900">
            Khách hàng nói gì về chỗ nghỉ này
          </p>
        </div>
        {stats.total > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 border border-amber-200">
            <img src={assets.starIconFilled} alt="star" className="w-5 h-5" />
            <span className="text-lg font-bold text-amber-700">{stats.average}</span>
            <span className="text-sm text-amber-600">/ 5</span>
          </div>
        )}
      </div>

      {stats.total > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 mb-8 pb-8 border-b border-slate-100">
          <div className="flex flex-col items-center justify-center p-6 rounded-xl bg-gradient-to-br from-slate-50 to-white border border-slate-100">
            <div className="text-5xl font-bold text-gray-900">{stats.average}</div>
            <div className="flex items-center gap-1 mt-2">{renderStars(Math.round(stats.average), 'w-5 h-5')}</div>
            <p className="mt-2 text-sm font-medium text-gray-700">{getRatingLabel(stats.average)}</p>
            <p className="mt-1 text-xs text-gray-500">{stats.total} đánh giá</p>
          </div>

          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = stats.distribution[star] || 0
              const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0
              return (
                <div key={`star-${star}`} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-16">
                    <span className="text-sm font-medium text-gray-700">{star}</span>
                    <img src={assets.starIconFilled} alt="star" className="w-4 h-4" />
                  </div>
                  <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 w-12 text-right">{count} đánh giá</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {eligibleBooking && (
        <div className="mb-6 p-5 rounded-xl border border-emerald-200 bg-emerald-50">
          {!showForm ? (
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-emerald-800">
                  Bạn đã hoàn thành kỳ nghỉ tại đây!
                </p>
                <p className="mt-1 text-xs text-emerald-600">
                  Chia sẻ trải nghiệm của bạn để giúp những khách hàng khác.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-[0.98]"
              >
                Viết đánh giá
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmitReview} className="space-y-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-emerald-800">Đánh giá của bạn</p>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Hủy
                </button>
              </div>

              <div className="space-y-3 p-4 rounded-lg bg-white border border-emerald-100">
                <StarRatingInput
                  label="Đánh giá chung"
                  value={formData.rating}
                  onChange={(v) => setFormData((p) => ({ ...p, rating: v }))}
                />
                <StarRatingInput
                  label="Sạch sẽ"
                  value={formData.cleanliness}
                  onChange={(v) => setFormData((p) => ({ ...p, cleanliness: v }))}
                />
                <StarRatingInput
                  label="Dịch vụ"
                  value={formData.service}
                  onChange={(v) => setFormData((p) => ({ ...p, service: v }))}
                />
                <StarRatingInput
                  label="Vị trí"
                  value={formData.location}
                  onChange={(v) => setFormData((p) => ({ ...p, location: v }))}
                />
                <StarRatingInput
                  label="Đáng tiền"
                  value={formData.valueForMoney}
                  onChange={(v) => setFormData((p) => ({ ...p, valueForMoney: v }))}
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">Nhận xét của bạn</label>
                <textarea
                  value={formData.comment}
                  onChange={(e) => setFormData((p) => ({ ...p, comment: e.target.value }))}
                  placeholder="Chia sẻ trải nghiệm của bạn về phòng, dịch vụ, tiện nghi..."
                  rows={4}
                  maxLength={1000}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-gray-700 placeholder:text-gray-400 outline-none transition-colors focus:border-emerald-500 resize-none"
                />
                <p className="mt-1 text-xs text-gray-400 text-right">
                  {formData.comment.length}/1000
                </p>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex items-center justify-center rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Đang gửi...' : 'Gửi đánh giá'}
              </button>
            </form>
          )}
        </div>
      )}

      {reviews.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-900">Chưa có đánh giá nào</p>
          <p className="mt-1 text-xs text-gray-500">
            Hãy là người đầu tiên đánh giá sau khi trải nghiệm!
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {reviews.map((review) => (
            <div
              key={review._id}
              className="p-5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-slate-200 transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center overflow-hidden">
                    {review.user?.imageUrl ? (
                      <img
                        src={review.user.imageUrl}
                        alt={review.user.username || 'User'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-sm font-semibold text-slate-600">
                        {(review.user?.username || 'U').charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {review.user?.username || 'Khách hàng'}
                    </p>
                    <p className="text-xs text-gray-500">{formatDate(review.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-0.5">{renderStars(review.rating)}</div>
                  {review.isVerified && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-semibold text-emerald-700">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Đã xác minh
                    </span>
                  )}
                </div>
              </div>

              <p className="mt-4 text-sm leading-relaxed text-gray-700">{review.comment}</p>

              {(review.cleanliness || review.service || review.location || review.valueForMoney) && (
                <div className="mt-4 flex flex-wrap gap-3">
                  {review.cleanliness && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs">
                      <span className="text-gray-500">Sạch sẽ:</span>
                      <span className="font-semibold text-gray-900">{review.cleanliness}/5</span>
                    </div>
                  )}
                  {review.service && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs">
                      <span className="text-gray-500">Dịch vụ:</span>
                      <span className="font-semibold text-gray-900">{review.service}/5</span>
                    </div>
                  )}
                  {review.location && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs">
                      <span className="text-gray-500">Vị trí:</span>
                      <span className="font-semibold text-gray-900">{review.location}/5</span>
                    </div>
                  )}
                  {review.valueForMoney && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs">
                      <span className="text-gray-500">Đáng tiền:</span>
                      <span className="font-semibold text-gray-900">{review.valueForMoney}/5</span>
                    </div>
                  )}
                </div>
              )}

              {review.response?.comment && (
                <div className="mt-4 ml-6 p-4 rounded-lg bg-blue-50 border border-blue-100">
                  <p className="text-xs font-semibold text-blue-700 mb-1">Phản hồi từ chủ nhà:</p>
                  <p className="text-sm text-blue-900">{review.response.comment}</p>
                  {review.response.respondedAt && (
                    <p className="mt-2 text-[10px] text-blue-500">
                      {formatDate(review.response.respondedAt)}
                    </p>
                  )}
                </div>
              )}

              <div className="mt-4 flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => handleMarkHelpful(review._id)}
                  className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                  </svg>
                  Hữu ích {review.helpfulCount > 0 && `(${review.helpfulCount})`}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ReviewSection
