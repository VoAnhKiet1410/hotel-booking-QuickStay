import React, { useEffect, useState } from 'react'
import Title from '../../components/Title'
import { useAppContext } from '../../context/appContextCore'
import { toast } from 'react-hot-toast'
import { Building2, Plus, Pencil, Trash2, MapPin, Phone, Star, X, ImagePlus } from 'lucide-react'

const THEME_OPTIONS = ['Urban Stays', 'County Stays']
const WING_OPTIONS = ['Modern Wing', 'Classic Wing']
const CITY_OPTIONS = [
    // Miền Bắc
    'Hà Nội',
    // Miền Trung
    'Đà Nẵng',
    // Miền Nam
    'TP. Hồ Chí Minh', 'Đà Lạt',
]

const emptyForm = {
    name: '', address: '', city: 'Hà Nội', contact: '', hostDescription: '',
    theme: 'Urban Stays', wing: 'Modern Wing', regionDescription: '', starRating: 4,
}

const HotelInfo = () => {
    const { axios } = useAppContext()
    const [hotels, setHotels] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [isSaving, setIsSaving] = useState(false)
    const [formData, setFormData] = useState(emptyForm)
    const [images, setImages] = useState([])
    const [previewUrls, setPreviewUrls] = useState([])
    const [existingImages, setExistingImages] = useState([])

    const fetchHotels = async () => {
        if (!axios) return
        try {
            setIsLoading(true)
            const { data } = await axios.get('/api/hotels/my')
            if (data?.success) setHotels(data.data || [])
        } catch (error) {
            if (error?.response?.status !== 404) toast.error('Không thể tải danh sách khách sạn')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => { fetchHotels() }, [axios])

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const openCreate = () => {
        setEditingId(null)
        setFormData(emptyForm)
        setImages([])
        setPreviewUrls([])
        setExistingImages([])
        setShowForm(true)
    }

    const openEdit = (hotel) => {
        setEditingId(hotel._id)
        setFormData({
            name: hotel.name || '',
            address: hotel.address || '',
            city: hotel.city || 'Hà Nội',
            contact: hotel.contact || '',
            hostDescription: hotel.hostDescription || '',
            theme: hotel.theme || 'Urban Stays',
            wing: hotel.wing || 'Modern Wing',
            regionDescription: hotel.regionDescription || '',
            starRating: hotel.starRating || 4,
        })
        setImages([])
        setPreviewUrls([])
        setExistingImages(hotel.images || [])
        setShowForm(true)
    }

    const handleFilesChange = (e) => {
        const newFiles = Array.from(e.target.files || [])
        if (newFiles.length === 0) return

        const MAX_IMAGES = 5
        const totalCount = images.length + existingImages.length + newFiles.length
        if (totalCount > MAX_IMAGES) {
            toast.error(`Tối đa ${MAX_IMAGES} ảnh tổng cộng.`)
            return
        }

        const addedFiles = [...images, ...newFiles].slice(0, MAX_IMAGES - existingImages.length)
        setImages(addedFiles)

        const urls = addedFiles.map((file) => URL.createObjectURL(file))
        setPreviewUrls(urls)

        e.target.value = ''
    }

    const removeImage = (indexToRemove) => {
        setImages((prev) => prev.filter((_, index) => index !== indexToRemove))
        setPreviewUrls((prev) => prev.filter((_, index) => index !== indexToRemove))
    }

    const removeExistingImage = (indexToRemove) => {
        setExistingImages((prev) => prev.filter((_, index) => index !== indexToRemove))
    }

    const handleSave = async () => {
        if (!axios) return
        if (!formData.name.trim() || !formData.address.trim() || !formData.contact.trim()) {
            toast.error('Vui lòng điền đầy đủ: Tên, Địa chỉ, Liên hệ')
            return
        }
        setIsSaving(true)
        try {
            const formDataToSend = new FormData();
            Object.keys(formData).forEach(key => {
                formDataToSend.append(key, formData[key]);
            });
            formDataToSend.append('existingImages', JSON.stringify(existingImages));
            images.forEach(file => formDataToSend.append('images', file));

            if (editingId) {
                const { data } = await axios.patch(`/api/hotels/my/${editingId}`, formDataToSend)
                if (data?.success) {
                    toast.success('Cập nhật thành công')
                    setShowForm(false)
                    fetchHotels()
                }
            } else {
                const { data } = await axios.post('/api/hotels/', formDataToSend)
                if (data?.success) {
                    toast.success('Tạo khách sạn thành công')
                    setShowForm(false)
                    fetchHotels()
                }
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Không thể lưu')
        } finally {
            setIsSaving(false)
        }
    }

    const handleDelete = async (hotelId, hotelName) => {
        if (!confirm(`Bạn có chắc muốn xóa "${hotelName}"?`)) return
        try {
            const { data } = await axios.delete(`/api/hotels/my/${hotelId}`)
            if (data?.success) {
                toast.success('Đã xóa khách sạn')
                fetchHotels()
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Không thể xóa')
        }
    }

    if (isLoading) {
        return (
            <div className="max-w-5xl">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 w-56 bg-slate-200 rounded" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[1, 2, 3, 4].map(i => <div key={i} className="h-48 bg-slate-200 rounded-2xl" />)}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-5xl">
            <div className="flex items-center justify-between mb-6">
                <Title align="left" font="font-outfit" title="Quản lý khách sạn"
                    subTitle={`${hotels.length} khách sạn — 3 vùng · 12 thành phố`} />
                <button onClick={openCreate}
                    className="flex items-center gap-2 rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors">
                    <Plus className="h-4 w-4" /> Thêm khách sạn
                </button>
            </div>

            {/* Hotel Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {hotels.map(hotel => (
                    <div key={hotel._id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
                        {/* Cover Image */}
                        {hotel.images && hotel.images.length > 0 ? (
                            <div className="h-40 w-full mb-4 rounded-xl overflow-hidden bg-slate-100">
                                <img src={hotel.images[0]} alt={hotel.name} className="w-full h-full object-cover" />
                            </div>
                        ) : (
                            <div className="h-40 w-full mb-4 rounded-xl bg-slate-100 flex items-center justify-center border border-slate-200">
                                <Building2 className="h-10 w-10 text-slate-300" />
                            </div>
                        )}

                        {/* Header */}
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 text-lg font-bold text-indigo-600">
                                    <Building2 className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-semibold text-slate-900">{hotel.name}</h3>
                                    <p className="text-xs text-slate-500">{hotel.city}</p>
                                </div>
                            </div>
                            <div className="flex gap-1.5">
                                <button onClick={() => openEdit(hotel)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
                                    <Pencil className="h-4 w-4" />
                                </button>
                                <button onClick={() => handleDelete(hotel._id, hotel.name)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors">
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        {/* Badges */}
                        <div className="flex flex-wrap gap-1.5 mb-3">
                            <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-[11px] font-medium text-violet-700">
                                {hotel.theme || 'Urban Stays'}
                            </span>
                            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-medium text-amber-700">
                                {hotel.wing || 'Modern Wing'}
                            </span>
                            <span className="flex items-center gap-0.5 rounded-full bg-yellow-50 px-2.5 py-0.5 text-[11px] font-medium text-yellow-700">
                                <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" /> {hotel.starRating || 4}
                            </span>
                        </div>

                        {/* Info */}
                        <div className="space-y-1.5 text-[13px] text-slate-600">
                            <p className="flex items-center gap-1.5">
                                <MapPin className="h-3.5 w-3.5 text-slate-400" /> {hotel.address}
                            </p>
                            <p className="flex items-center gap-1.5">
                                <Phone className="h-3.5 w-3.5 text-slate-400" /> {hotel.contact}
                            </p>
                        </div>

                        {hotel.regionDescription && (
                            <p className="mt-2 text-xs text-slate-500 line-clamp-2">{hotel.regionDescription}</p>
                        )}
                    </div>
                ))}

                {hotels.length === 0 && (
                    <div className="col-span-full rounded-2xl border border-dashed border-slate-300 p-8 text-center">
                        <Building2 className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-slate-500 text-sm">Chưa có khách sạn nào. Bấm "Thêm khách sạn" để bắt đầu.</p>
                    </div>
                )}
            </div>

            {/* Create / Edit Modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-lg font-semibold text-slate-900">
                                {editingId ? 'Chỉnh sửa khách sạn' : 'Thêm khách sạn mới'}
                            </h3>
                            <button onClick={() => setShowForm(false)} className="p-1 rounded-lg hover:bg-slate-100">
                                <X className="h-5 w-5 text-slate-400" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-semibold text-slate-700">Tên khách sạn *</label>
                                <input type="text" name="name" value={formData.name} onChange={handleChange}
                                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500" />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-sm font-semibold text-slate-700">Thành phố *</label>
                                    <select name="city" value={formData.city} onChange={handleChange}
                                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500">
                                        {CITY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm font-semibold text-slate-700">Đánh giá sao</label>
                                    <input type="number" name="starRating" min="1" max="5" step="0.1"
                                        value={formData.starRating} onChange={handleChange}
                                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500" />
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-semibold text-slate-700">Địa chỉ *</label>
                                <input type="text" name="address" value={formData.address} onChange={handleChange}
                                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500" />
                            </div>

                            <div>
                                <label className="text-sm font-semibold text-slate-700">Liên hệ *</label>
                                <input type="text" name="contact" value={formData.contact} onChange={handleChange}
                                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500" />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-sm font-semibold text-slate-700">Theme</label>
                                    <select name="theme" value={formData.theme} onChange={handleChange}
                                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500">
                                        {THEME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm font-semibold text-slate-700">Wing</label>
                                    <select name="wing" value={formData.wing} onChange={handleChange}
                                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500">
                                        {WING_OPTIONS.map(w => <option key={w} value={w}>{w}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-semibold text-slate-700">Mô tả khu vực</label>
                                <textarea name="regionDescription" value={formData.regionDescription} onChange={handleChange} rows="2"
                                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                                    placeholder="Mô tả ngắn về khu vực khách sạn..." />
                            </div>

                            <div>
                                <label className="text-sm font-semibold text-slate-700">Thông tin chủ nhà</label>
                                <textarea name="hostDescription" value={formData.hostDescription} onChange={handleChange} rows="2"
                                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                                    placeholder="Ví dụ: Đã xác minh trên QuickStay · Phản hồi nhanh" />
                            </div>

                            {/* Images Section */}
                            <div className="space-y-3 pt-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-semibold text-slate-700">Hình ảnh khách sạn (Tối đa 5)</label>
                                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                        {existingImages.length + images.length}/5
                                    </span>
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    {/* Existing Images */}
                                    {existingImages.map((url, idx) => (
                                        <div key={`exist-${idx}`} className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 bg-slate-50 group">
                                            <img src={url} alt="Hotel" className="w-full h-full object-cover" />
                                            <button onClick={() => removeExistingImage(idx)}
                                                className="absolute top-1.5 right-1.5 p-1.5 bg-white/90 rounded-lg text-slate-600 opacity-0 group-hover:opacity-100 hover:text-red-600 hover:bg-white transition-all">
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                    {/* New Preview Images */}
                                    {previewUrls.map((url, idx) => (
                                        <div key={`new-${idx}`} className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 bg-slate-50 group">
                                            <img src={url} alt="Preview" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 ring-2 ring-inset ring-indigo-500/50 rounded-xl pointer-events-none" />
                                            <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-indigo-500 text-white text-[10px] font-bold rounded shadow-sm">MỚI</div>
                                            <button onClick={() => removeImage(idx)}
                                                className="absolute top-1.5 right-1.5 p-1.5 bg-white/90 rounded-lg text-slate-600 opacity-0 group-hover:opacity-100 hover:text-red-600 hover:bg-white transition-all">
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                    {/* Upload Button */}
                                    {(images.length + existingImages.length) < 5 && (
                                        <label className="relative aspect-video rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100/50 transition-colors cursor-pointer flex flex-col items-center justify-center gap-2 group">
                                            <input type="file" multiple accept="image/*" onChange={handleFilesChange} className="hidden" />
                                            <div className="h-8 w-8 rounded-full bg-white shadow-sm flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-transform">
                                                <ImagePlus className="h-4 w-4" />
                                            </div>
                                            <span className="text-[11px] font-medium text-slate-500">Thêm ảnh</span>
                                        </label>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-slate-100">
                                <button onClick={() => setShowForm(false)}
                                    className="flex-1 rounded-full border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                                    Hủy
                                </button>
                                <button onClick={handleSave} disabled={isSaving}
                                    className="flex-1 rounded-full bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:bg-indigo-400">
                                    {isSaving ? 'Đang lưu...' : (editingId ? 'Cập nhật' : 'Tạo mới')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default HotelInfo
