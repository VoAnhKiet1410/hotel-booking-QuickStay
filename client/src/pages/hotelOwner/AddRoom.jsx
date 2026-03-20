import React, { useState, useEffect } from 'react'
import Title from '../../components/Title'
import { assets } from '../../assets/assets'
import { useAppContext } from '../../context/appContextCore'
import { toast } from 'react-hot-toast'
import {
  AMENITY_OPTIONS,
  ROOM_TYPE_OPTIONS,
  CAPACITY_OPTIONS,
  MAX_IMAGES_PER_ROOM,
  ROOM_TEMPLATES
} from '../../utils/constants'

const AddRoom = () => {
  const { axios } = useAppContext()

  const [hotels, setHotels] = useState([])
  const [formData, setFormData] = useState({
    hotelId: '',
    roomType: '',
    pricePerNight: '',
    capacity: '',
    amenities: [],
    status: 'open',
    bed: '',
    area: '',
    description: '',
  })

  const [images, setImages] = useState([])
  const [previewUrls, setPreviewUrls] = useState([])
  const [errors, setErrors] = useState({})
  const [submitStatus, setSubmitStatus] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showTypeDropdown, setShowTypeDropdown] = useState(false)

  // Fetch owner's hotels for the dropdown
  useEffect(() => {
    if (!axios) return
    const fetchHotels = async () => {
      try {
        const { data } = await axios.get('/api/hotels/my')
        if (data?.success && data.data?.length > 0) {
          setHotels(data.data)
          setFormData(prev => ({ ...prev, hotelId: data.data[0]._id }))
        }
      } catch (err) {
        console.log('Failed to fetch hotels:', err)
      }
    }
    fetchHotels()
  }, [axios])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handlePriceChange = (e) => {
    const rawValue = e.target.value
    const numericValue = rawValue.replace(/[^\d]/g, '')

    setFormData((prev) => ({
      ...prev,
      pricePerNight: numericValue,
    }))
  }

  const handleStatusChange = (status) => {
    setFormData((prev) => ({
      ...prev,
      status,
    }))
  }

  const handleAmenityToggle = (value) => {
    setFormData((prev) => {
      const exists = prev.amenities.includes(value)
      return {
        ...prev,
        amenities: exists
          ? prev.amenities.filter((item) => item !== value)
          : [...prev.amenities, value],
      }
    })
  }

  const handleFilesChange = (e) => {
    const newFiles = Array.from(e.target.files || [])
    if (newFiles.length === 0) return

    // Thêm ảnh mới vào danh sách hiện tại (tối đa MAX_IMAGES_PER_ROOM ảnh)
    const totalFiles = [...images, ...newFiles].slice(0, MAX_IMAGES_PER_ROOM)
    setImages(totalFiles)

    // Tạo preview URLs cho tất cả ảnh
    const urls = totalFiles.map((file) => URL.createObjectURL(file))
    setPreviewUrls(urls)

    // Reset input để có thể chọn lại cùng file
    e.target.value = ''
  }

  const removeImage = (indexToRemove) => {
    setImages((prev) => prev.filter((_, index) => index !== indexToRemove))
    setPreviewUrls((prev) => prev.filter((_, index) => index !== indexToRemove))
  }

  const validate = () => {
    const newErrors = {}

    if (!formData.hotelId) {
      newErrors.hotelId = 'Vui lòng chọn khách sạn'
    }

    if (!formData.roomType.trim()) {
      newErrors.roomType = 'Vui lòng chọn loại phòng'
    }

    const priceNumber = Number(formData.pricePerNight)
    if (!formData.pricePerNight || Number.isNaN(priceNumber) || priceNumber <= 0) {
      newErrors.pricePerNight = 'Giá mỗi đêm phải lớn hơn 0'
    }

    const capacityNumber = Number(formData.capacity)
    if (!formData.capacity || Number.isNaN(capacityNumber) || capacityNumber <= 0) {
      newErrors.capacity = 'Vui lòng chọn số khách tối đa'
    }

    if (images.length === 0) {
      newErrors.images = 'Vui lòng chọn ít nhất 1 ảnh phòng'
    }

    if (images.length > MAX_IMAGES_PER_ROOM) {
      newErrors.images = `Tối đa ${MAX_IMAGES_PER_ROOM} ảnh mỗi lần`
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  /**
   * Compress ảnh phía client trước khi upload.
   * Resize xuống max 1200px, quality 0.8 → giảm 5-10MB về ~200-300KB.
   */
  const compressImage = (file, maxWidth = 1200, quality = 0.8) => {
    return new Promise((resolve) => {
      // Nếu file đã nhỏ (< 300KB), không cần compress
      if (file.size < 300 * 1024) {
        resolve(file)
        return
      }

      const img = new Image()
      const url = URL.createObjectURL(file)
      img.onload = () => {
        URL.revokeObjectURL(url)
        const canvas = document.createElement('canvas')
        let { width, height } = img

        // Resize nếu quá lớn
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width)
          width = maxWidth
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(new File([blob], file.name, { type: 'image/jpeg' }))
            } else {
              resolve(file) // fallback
            }
          },
          'image/jpeg',
          quality
        )
      }
      img.onerror = () => {
        URL.revokeObjectURL(url)
        resolve(file)
      }
      img.src = url
    })
  }

  const onSubmitHandler = async (e) => {
    e.preventDefault()
    setSubmitStatus(null)

    const isValid = validate()
    if (!isValid) return

    if (!axios) {
      toast.error('Không thể kết nối máy chủ, vui lòng thử lại')
      return
    }

    try {
      setIsSubmitting(true)

      // Compress ảnh song song trước khi gửi
      const compressedImages = await Promise.all(
        images.map((file) => compressImage(file))
      )

      const formDataToSend = new FormData()
      formDataToSend.append('hotelId', formData.hotelId)
      formDataToSend.append('roomType', formData.roomType)
      formDataToSend.append('pricePerNight', String(Number(formData.pricePerNight)))
      formDataToSend.append('capacity', String(Number(formData.capacity)))
      formDataToSend.append('status', formData.status)
      formDataToSend.append('amenities', JSON.stringify(formData.amenities))
      if (formData.bed) formDataToSend.append('bed', formData.bed)
      if (formData.area) formDataToSend.append('area', formData.area)
      if (formData.description) formDataToSend.append('description', formData.description)

      compressedImages.forEach((file) => {
        formDataToSend.append('images', file)
      })

      const { data } = await axios.post(`/api/rooms/owner?hotelId=${formData.hotelId}`, formDataToSend)

      if (data?.success) {
        setSubmitStatus('success')
        toast.success('Tạo phòng thành công')
        setFormData({
          hotelId: hotels[0]?._id || '',
          roomType: '',
          pricePerNight: '',
          capacity: '',
          amenities: [],
          status: 'open',
          bed: '',
          area: '',
          description: '',
        })
        setImages([])
        setPreviewUrls([])
      } else {
        toast.error(data?.message || 'Tạo phòng không thành công')
      }
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        'Không thể kết nối máy chủ, vui lòng thử lại'
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl">
      <Title
        align="left"
        font="font-outfit"
        title="Thêm phòng mới"
        subTitle="Tạo phòng mới cho khách sạn của bạn trên QuickStay."
      />

      <form
        className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6"
        onSubmit={onSubmitHandler}
      >
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {/* Hotel Selector */}
          <div className="space-y-1.5 md:col-span-2">
            <label htmlFor="hotelId" className="text-sm font-semibold text-gray-700">
              Khách sạn
            </label>
            <div className="relative">
              <select
                id="hotelId"
                name="hotelId"
                value={formData.hotelId}
                onChange={handleInputChange}
                className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/40"
              >
                <option value="">Chọn khách sạn</option>
                {hotels.map((h) => (
                  <option key={h._id} value={h._id}>
                    {h.name} — {h.city}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                ▾
              </span>
            </div>
            {errors.hotelId && (
              <p className="text-xs text-red-500">{errors.hotelId}</p>
            )}
          </div>

          <div className="space-y-1.5 relative">
            <label htmlFor="roomType" className="text-sm font-semibold text-gray-700">
              Loại phòng
            </label>

            <input
              type="text"
              id="roomType"
              name="roomType"
              value={formData.roomType}
              onChange={handleInputChange}
              onFocus={() => setShowTypeDropdown(true)}
              onBlur={() => setTimeout(() => setShowTypeDropdown(false), 200)}
              autoComplete="off"
              placeholder="Ví dụ: Urban Suite, Lakeview King..."
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/40"
            />

            {/* Custom Dropdown thay thế cho datalist */}
            {showTypeDropdown && (
              <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                {ROOM_TYPE_OPTIONS.filter(opt => opt.toLowerCase().includes(formData.roomType.toLowerCase())).map(opt => (
                  <li
                    key={opt}
                    onMouseDown={(e) => {
                      // onMouseDown chạy trước onBlur của input
                      e.preventDefault()
                      const template = ROOM_TEMPLATES[opt]
                      if (template) {
                        setFormData(prev => ({
                          ...prev,
                          roomType: opt,
                          capacity: template.capacity || prev.capacity,
                          bed: template.bed || prev.bed,
                          area: template.area || prev.area,
                          description: template.description || prev.description
                        }))
                      } else {
                        setFormData(prev => ({ ...prev, roomType: opt }))
                      }
                      setShowTypeDropdown(false)
                    }}
                    className="cursor-pointer px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700"
                  >
                    {opt}
                  </li>
                ))}
                {ROOM_TYPE_OPTIONS.filter(opt => opt.toLowerCase().includes(formData.roomType.toLowerCase())).length === 0 && (
                  <li className="px-3 py-2 text-sm text-gray-500 italic">Không tìm thấy gợi ý, nhấn Enter để dùng giá trị này</li>
                )}
              </ul>
            )}

            {errors.roomType && (
              <p className="text-xs text-red-500">{errors.roomType}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="pricePerNight" className="text-sm font-semibold text-gray-700">
              Giá mỗi đêm (VND)
            </label>
            <input
              id="pricePerNight"
              name="pricePerNight"
              type="text"
              inputMode="numeric"
              value={
                formData.pricePerNight
                  ? Number(formData.pricePerNight).toLocaleString('vi-VN')
                  : ''
              }
              onChange={handlePriceChange}
              placeholder="Ví dụ: 1.200.000"
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/40"
            />
            {errors.pricePerNight && (
              <p className="text-xs text-red-500">{errors.pricePerNight}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="capacity" className="text-sm font-semibold text-gray-700">
              Số khách tối đa
            </label>
            <div className="relative">
              <select
                id="capacity"
                name="capacity"
                value={formData.capacity}
                onChange={handleInputChange}
                className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/40"
              >
                <option value="">Chọn số khách</option>
                {CAPACITY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option} khách
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                ▾
              </span>
            </div>
            {errors.capacity && (
              <p className="text-xs text-red-500">{errors.capacity}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <span className="text-sm font-semibold text-gray-700">
              Trạng thái phòng
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleStatusChange('open')}
                className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${formData.status === 'open'
                  ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                  : 'bg-slate-50 text-slate-600 ring-1 ring-slate-200'
                  }`}
              >
                <span
                  className={`mr-2 inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${formData.status === 'open'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-300 text-slate-700'
                    }`}
                >
                  ✓
                </span>
                Đang mở đặt phòng
              </button>

              <button
                type="button"
                onClick={() => handleStatusChange('paused')}
                className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${formData.status === 'paused'
                  ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
                  : 'bg-slate-50 text-slate-500 ring-1 ring-slate-200'
                  }`}
              >
                <span
                  className={`mr-2 inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${formData.status === 'paused'
                    ? 'bg-amber-500 text-white'
                    : 'bg-slate-300 text-slate-700'
                    }`}
                >
                  •
                </span>
                Tạm dừng nhận đặt phòng
              </button>

              <button
                type="button"
                onClick={() => handleStatusChange('soldout')}
                className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${formData.status === 'soldout'
                  ? 'bg-red-50 text-red-700 ring-1 ring-red-200'
                  : 'bg-slate-50 text-slate-500 ring-1 ring-slate-200'
                  }`}
              >
                <span
                  className={`mr-2 inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${formData.status === 'soldout'
                    ? 'bg-red-500 text-white'
                    : 'bg-slate-300 text-slate-700'
                    }`}
                >
                  !
                </span>
                Hết phòng
              </button>
            </div>
          </div>

          {/* Bed type */}
          <div className="space-y-1.5">
            <label htmlFor="bed" className="text-sm font-semibold text-gray-700">Loại giường</label>
            <input
              id="bed" name="bed" type="text"
              value={formData.bed} onChange={handleInputChange}
              placeholder="Ví dụ: Giường King, 2 Giường đôi"
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/40"
            />
          </div>

          {/* Area */}
          <div className="space-y-1.5">
            <label htmlFor="area" className="text-sm font-semibold text-gray-700">Diện tích (m²)</label>
            <input
              id="area" name="area" type="text"
              value={formData.area} onChange={handleInputChange}
              placeholder="Ví dụ: 25"
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/40"
            />
          </div>

          {/* Description full width */}
          <div className="space-y-1.5 md:col-span-2">
            <label htmlFor="description" className="text-sm font-semibold text-gray-700">Mô tả phòng</label>
            <textarea
              id="description" name="description"
              value={formData.description} onChange={handleInputChange}
              rows="3" placeholder="Mô tả chi tiết về phòng, tầm nhìn, nội thất..."
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/40"
            />
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1.2fr)]">
          <div>
            <p className="text-sm font-semibold text-gray-700">Tiện nghi nổi bật</p>
            <p className="mt-1 text-xs text-gray-500">
              Chọn các tiện nghi có sẵn trong phòng để khách dễ hình dung trải nghiệm.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {AMENITY_OPTIONS.map((item) => {
                const active = formData.amenities.includes(item.value)
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => handleAmenityToggle(item.value)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${active
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-indigo-300 hover:bg-indigo-50/60 hover:text-indigo-700'
                      }`}
                  >
                    {item.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-700">Ảnh phòng</p>
            <p className="mt-1 text-xs text-gray-500">
              Tải lên vài ảnh rõ nét về phòng, tiện nghi và tầm nhìn.
            </p>

            <label
              htmlFor="roomImages"
              className="mt-3 flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50/60 px-4 py-6 text-center hover:border-indigo-400 hover:bg-indigo-50/40"
            >
              <img
                src={assets.uploadArea}
                alt="upload"
                className="h-12 w-12 opacity-80"
              />
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-800">
                  Bấm để chọn ảnh hoặc kéo thả vào đây
                </p>
                <p className="text-xs text-gray-500">
                  Hỗ trợ định dạng JPG, PNG. Tối đa {MAX_IMAGES_PER_ROOM} ảnh mỗi lần.
                </p>
              </div>
              <input
                id="roomImages"
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFilesChange}
              />
            </label>

            {errors.images && (
              <p className="mt-2 text-xs text-red-500">{errors.images}</p>
            )}

            {previewUrls.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {previewUrls.map((url, index) => (
                  <div
                    key={url}
                    className="group relative h-20 w-20 overflow-hidden rounded-lg border border-slate-200 bg-slate-100"
                  >
                    <img
                      src={url}
                      alt={`preview-${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-600"
                    >
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
                {previewUrls.length < MAX_IMAGES_PER_ROOM && (
                  <label
                    htmlFor="roomImages"
                    className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 text-slate-400 transition-colors hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-500"
                  >
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </label>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-slate-100 pt-5 md:flex-row md:items-center md:justify-between">
          {submitStatus === 'success' && (
            <p className="text-xs text-emerald-600">
              Phòng mới đã được tạo thành công.
            </p>
          )}

          <div className="flex gap-3 md:justify-end">
            <button
              type="button"
              onClick={() => {
                setFormData({
                  hotelId: hotels[0]?._id || '',
                  roomType: '',
                  pricePerNight: '',
                  capacity: '',
                  amenities: [],
                  status: 'open',
                  bed: '',
                  area: '',
                  description: '',
                })
                setImages([])
                setPreviewUrls([])
                setErrors({})
                setSubmitStatus(null)
              }}
              className="inline-flex items-center justify-center rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 active:scale-[0.98]"
            >
              Xóa phòng
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-indigo-400"
            >
              {isSubmitting ? 'Đang lưu...' : 'Lưu phòng'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

export default AddRoom
