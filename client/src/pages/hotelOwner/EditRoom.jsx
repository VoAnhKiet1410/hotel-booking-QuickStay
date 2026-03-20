import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Title from '../../components/Title'

import { useAppContext } from '../../context/appContextCore'
import { toast } from 'react-hot-toast'
import { AMENITY_OPTIONS, ROOM_TYPE_OPTIONS, CAPACITY_OPTIONS, MAX_IMAGES_PER_ROOM, ROOM_TEMPLATES } from '../../utils/constants'

const EditRoom = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const { axios } = useAppContext()

    const [formData, setFormData] = useState({
        roomType: '',
        pricePerNight: '',
        capacity: '',
        amenities: [],
        status: 'open',
        bed: '',
        area: '',
        description: '',
    })
    const [hotelName, setHotelName] = useState('')
    const [existingImages, setExistingImages] = useState([])
    const [newImages, setNewImages] = useState([])
    const [newPreviewUrls, setNewPreviewUrls] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [errors, setErrors] = useState({})
    const [showTypeDropdown, setShowTypeDropdown] = useState(false)

    useEffect(() => {
        let cancelled = false
        const fetchRoom = async () => {
            if (!axios || !id) return
            try {
                setIsLoading(true)
                const { data } = await axios.get(`/api/rooms/${id}`)
                if (cancelled) return
                if (data?.success && data.data) {
                    const room = data.data
                    setFormData({
                        roomType: room.roomType || '',
                        pricePerNight: String(room.pricePerNight || ''),
                        capacity: String(room.capacity || ''),
                        amenities: room.amenities || [],
                        status: room.status || 'open',
                        bed: room.bed || '',
                        area: room.area || '',
                        description: room.description || '',
                    })
                    setExistingImages(room.images || [])
                    if (room.hotel?.name) setHotelName(`${room.hotel.name} — ${room.hotel.city || ''}`)
                }
            } catch {
                if (cancelled) return
                toast.error('Không thể tải thông tin phòng')
                navigate('/owner/list-rooms')
            } finally {
                if (!cancelled) setIsLoading(false)
            }
        }
        fetchRoom()
        return () => { cancelled = true }
    }, [axios, id, navigate])

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handlePriceChange = (e) => {
        const numericValue = e.target.value.replace(/[^\d]/g, '')
        setFormData(prev => ({ ...prev, pricePerNight: numericValue }))
    }

    const handleAmenityToggle = (value) => {
        setFormData(prev => ({
            ...prev,
            amenities: prev.amenities.includes(value)
                ? prev.amenities.filter(item => item !== value)
                : [...prev.amenities, value],
        }))
    }

    const handleFilesChange = (e) => {
        const files = Array.from(e.target.files || [])
        const totalAllowed = MAX_IMAGES_PER_ROOM - existingImages.length
        const newFiles = [...newImages, ...files].slice(0, totalAllowed)
        setNewImages(newFiles)
        setNewPreviewUrls(newFiles.map(f => URL.createObjectURL(f)))
        e.target.value = ''
    }

    const removeExistingImage = (index) => {
        setExistingImages(prev => prev.filter((_, i) => i !== index))
    }

    const removeNewImage = (index) => {
        setNewImages(prev => prev.filter((_, i) => i !== index))
        setNewPreviewUrls(prev => prev.filter((_, i) => i !== index))
    }

    const validate = () => {
        const newErrors = {}
        if (!formData.roomType.trim()) newErrors.roomType = 'Vui lòng chọn loại phòng'
        const price = Number(formData.pricePerNight)
        if (!formData.pricePerNight || Number.isNaN(price) || price <= 0) {
            newErrors.pricePerNight = 'Giá phải lớn hơn 0'
        }
        if (!formData.capacity) newErrors.capacity = 'Vui lòng chọn số khách'
        if (existingImages.length + newImages.length === 0) {
            newErrors.images = 'Cần ít nhất 1 ảnh'
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
                            resolve(file)
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
        if (!validate() || !axios) return

        setIsSubmitting(true)
        try {
            // Compress ảnh mới song song trước khi gửi
            const compressedImages = await Promise.all(
                newImages.map((file) => compressImage(file))
            )

            const formDataToSend = new FormData()
            formDataToSend.append('roomType', formData.roomType)
            formDataToSend.append('pricePerNight', formData.pricePerNight)
            formDataToSend.append('capacity', formData.capacity)
            formDataToSend.append('status', formData.status)
            formDataToSend.append('amenities', JSON.stringify(formData.amenities))
            formDataToSend.append('existingImages', JSON.stringify(existingImages))
            if (formData.bed) formDataToSend.append('bed', formData.bed)
            if (formData.area) formDataToSend.append('area', formData.area)
            if (typeof formData.description === 'string') formDataToSend.append('description', formData.description)
            compressedImages.forEach(file => formDataToSend.append('images', file))

            const { data } = await axios.patch(`/api/rooms/owner/${id}`, formDataToSend)
            if (data?.success) {
                toast.success('Cập nhật phòng thành công')
                navigate('/owner/list-rooms')
            } else {
                toast.error(data?.message || 'Cập nhật thất bại')
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Không thể cập nhật phòng')
        } finally {
            setIsSubmitting(false)
        }
    }

    if (isLoading) {
        return (
            <div className="max-w-4xl">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 w-48 bg-slate-200 rounded" />
                    <div className="h-4 w-72 bg-slate-200 rounded" />
                    <div className="h-96 bg-slate-200 rounded-2xl" />
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-4xl">
            <Title align="left" font="font-outfit" title="Chỉnh sửa phòng" subTitle="Cập nhật thông tin phòng của bạn." />

            <form className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6" onSubmit={onSubmitHandler}>
                {hotelName && (
                    <p className="mb-4 text-sm text-slate-500">Khách sạn: <span className="font-semibold text-slate-700">{hotelName}</span></p>
                )}
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <div className="space-y-1.5 relative">
                        <label className="text-sm font-semibold text-gray-700">Loại phòng</label>
                        <input type="text" name="roomType" value={formData.roomType} onChange={handleInputChange}
                            onFocus={() => setShowTypeDropdown(true)}
                            onBlur={() => setTimeout(() => setShowTypeDropdown(false), 200)}
                            placeholder="Ví dụ: Urban Suite, Phòng Đôi..."
                            autoComplete="off"
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/40" />

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

                        {errors.roomType && <p className="text-xs text-red-500">{errors.roomType}</p>}
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-gray-700">Giá mỗi đêm (VND)</label>
                        <input type="text" inputMode="numeric" value={formData.pricePerNight ? Number(formData.pricePerNight).toLocaleString('vi-VN') : ''}
                            onChange={handlePriceChange} placeholder="1.200.000"
                            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500" />
                        {errors.pricePerNight && <p className="text-xs text-red-500">{errors.pricePerNight}</p>}
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-gray-700">Số khách tối đa</label>
                        <select name="capacity" value={formData.capacity} onChange={handleInputChange}
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500">
                            <option value="">Chọn số khách</option>
                            {CAPACITY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt} khách</option>)}
                        </select>
                        {errors.capacity && <p className="text-xs text-red-500">{errors.capacity}</p>}
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-gray-700">Trạng thái</label>
                        <select name="status" value={formData.status} onChange={handleInputChange}
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500">
                            <option value="open">🟢 Đang mở</option>
                            <option value="paused">🟡 Tạm dừng</option>
                            <option value="soldout">🔴 Hết phòng</option>
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-gray-700">Loại giường</label>
                        <input type="text" name="bed" value={formData.bed} onChange={handleInputChange}
                            placeholder="Ví dụ: Giường King" className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500" />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-gray-700">Diện tích (m²)</label>
                        <input type="text" name="area" value={formData.area} onChange={handleInputChange}
                            placeholder="Ví dụ: 25" className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500" />
                    </div>

                    <div className="space-y-1.5 md:col-span-2">
                        <label className="text-sm font-semibold text-gray-700">Mô tả phòng</label>
                        <textarea name="description" value={formData.description} onChange={handleInputChange}
                            rows="3" placeholder="Mô tả chi tiết về phòng..."
                            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500" />
                    </div>
                </div>

                <div className="mt-6">
                    <p className="text-sm font-semibold text-gray-700">Tiện nghi</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                        {AMENITY_OPTIONS.map(item => (
                            <button key={item.value} type="button" onClick={() => handleAmenityToggle(item.value)}
                                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${formData.amenities.includes(item.value)
                                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-indigo-300'
                                    }`}>
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mt-6">
                    <p className="text-sm font-semibold text-gray-700">Ảnh phòng</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                        {existingImages.map((url, index) => (
                            <div key={url} className="group relative h-20 w-20 rounded-lg border border-slate-200 overflow-hidden">
                                <img src={url} alt="" className="h-full w-full object-cover" />
                                <button type="button" onClick={() => removeExistingImage(index)}
                                    className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100">
                                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        ))}
                        {newPreviewUrls.map((url, index) => (
                            <div key={url} className="group relative h-20 w-20 rounded-lg border-2 border-dashed border-indigo-300 overflow-hidden">
                                <img src={url} alt="" className="h-full w-full object-cover" />
                                <button type="button" onClick={() => removeNewImage(index)}
                                    className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100">
                                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        ))}
                        {existingImages.length + newImages.length < MAX_IMAGES_PER_ROOM && (
                            <label className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 text-slate-400 hover:border-indigo-400 hover:text-indigo-500">
                                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                <input type="file" accept="image/*" multiple className="hidden" onChange={handleFilesChange} />
                            </label>
                        )}
                    </div>
                    {errors.images && <p className="mt-2 text-xs text-red-500">{errors.images}</p>}
                </div>

                <div className="mt-8 flex gap-3 border-t border-slate-100 pt-5">
                    <button type="button" onClick={() => navigate('/owner/list-rooms')}
                        className="rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                        Hủy
                    </button>
                    <button type="submit" disabled={isSubmitting}
                        className="rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:bg-indigo-400">
                        {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </button>
                </div>
            </form>
        </div>
    )
}

export default EditRoom
