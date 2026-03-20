import React, { useEffect, useState } from 'react'
import { useAppContext } from '../../context/appContextCore'
import { toast } from 'react-hot-toast'
import { assets } from '../../assets/assets'

const INITIAL_FORM = {
    title: '',
    description: '',
    discountType: 'percent',
    discountValue: '',
    minNights: 1,
    maxUses: '',
    validFrom: '',
    validTo: '',
    couponCode: '',
    category: 'other',
    image: '',
}

const CATEGORY_OPTIONS = [
    { value: 'family', label: 'Gia đình' },
    { value: 'couple', label: 'Cặp đôi' },
    { value: 'luxury', label: 'Cao cấp' },
    { value: 'earlybird', label: 'Đặt sớm' },
    { value: 'seasonal', label: 'Theo mùa' },
    { value: 'other', label: 'Khác' },
]

const ManagePromotions = () => {
    const { axios } = useAppContext()
    const [promotions, setPromotions] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [form, setForm] = useState(INITIAL_FORM)
    const [imageFile, setImageFile] = useState(null)
    const [previewUrl, setPreviewUrl] = useState(null)
    const [editingId, setEditingId] = useState(null)
    const [isSaving, setIsSaving] = useState(false)

    const fetchPromotions = async () => {
        if (!axios) return
        try {
            const { data } = await axios.get('/api/promotions/owner')
            if (data?.success) setPromotions(data.data)
        } catch {
            toast.error('Không thể tải danh sách ưu đãi')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => { fetchPromotions() }, [axios])

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!axios) return

        setIsSaving(true)
        try {
            const formDataToSend = new FormData();
            formDataToSend.append('title', form.title);
            formDataToSend.append('description', form.description);
            formDataToSend.append('discountType', form.discountType);
            formDataToSend.append('discountValue', String(Number(form.discountValue)));
            formDataToSend.append('minNights', String(Number(form.minNights) || 1));

            if (form.maxUses) {
                formDataToSend.append('maxUses', String(Number(form.maxUses)));
            }
            formDataToSend.append('validFrom', form.validFrom);
            formDataToSend.append('validTo', form.validTo);
            formDataToSend.append('couponCode', form.couponCode);
            formDataToSend.append('category', form.category);

            if (imageFile) {
                formDataToSend.append('image', imageFile);
            } else {
                formDataToSend.append('image', form.image);
            }

            if (editingId) {
                const { data } = await axios.patch(`/api/promotions/owner/${editingId}`, formDataToSend)
                if (data?.success) {
                    toast.success('Cập nhật ưu đãi thành công')
                    setPromotions(prev => prev.map(p => p._id === editingId ? data.data : p))
                }
            } else {
                const { data } = await axios.post('/api/promotions/owner', formDataToSend)
                if (data?.success) {
                    toast.success('Tạo ưu đãi thành công')
                    setPromotions(prev => [data.data, ...prev])
                }
            }

            setShowForm(false)
            setForm(INITIAL_FORM)
            setImageFile(null)
            setPreviewUrl(null)
            setEditingId(null)
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Không thể lưu ưu đãi')
        } finally {
            setIsSaving(false)
        }
    }

    const handleEdit = (promo) => {
        setForm({
            title: promo.title,
            description: promo.description,
            discountType: promo.discountType,
            discountValue: String(promo.discountValue),
            minNights: promo.minNights || 1,
            maxUses: promo.maxUses ? String(promo.maxUses) : '',
            validFrom: promo.validFrom?.slice(0, 10) || '',
            validTo: promo.validTo?.slice(0, 10) || '',
            couponCode: promo.couponCode,
            category: promo.category || 'other',
            image: promo.image || '',
        })
        setImageFile(null)
        setPreviewUrl(promo.image || null)
        setEditingId(promo._id)
        setShowForm(true)
    }

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setImageFile(file);
        setPreviewUrl(URL.createObjectURL(file));
        e.target.value = '';
    }

    const handleToggleActive = async (promo) => {
        if (!axios) return
        try {
            const { data } = await axios.patch(`/api/promotions/owner/${promo._id}`, {
                isActive: !promo.isActive,
            })
            if (data?.success) {
                setPromotions(prev => prev.map(p => p._id === promo._id ? data.data : p))
                toast.success(data.data.isActive ? 'Đã kích hoạt' : 'Đã tắt')
            }
        } catch {
            toast.error('Không thể cập nhật trạng thái')
        }
    }

    const handleDelete = async (id) => {
        if (!axios) return
        if (!window.confirm('Bạn có chắc muốn xóa ưu đãi này?')) return
        try {
            const { data } = await axios.delete(`/api/promotions/owner/${id}`)
            if (data?.success) {
                setPromotions(prev => prev.map(p => p._id === id ? { ...p, isActive: false } : p))
                toast.success('Đã xóa ưu đãi')
            }
        } catch {
            toast.error('Không thể xóa')
        }
    }

    const updateField = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

    const inputClass = 'h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-gray-900 transition-colors'
    const labelClass = 'text-xs font-medium text-gray-600'

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Quản lý ưu đãi</h1>
                    <p className="text-sm text-gray-500 mt-1">Tạo và quản lý các chương trình giảm giá</p>
                </div>
                <button
                    onClick={() => { setShowForm(!showForm); setEditingId(null); setForm(INITIAL_FORM); setImageFile(null); setPreviewUrl(null); }}
                    className="flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-black transition-colors"
                >
                    <img src={assets.addIcon} alt="add" className="w-4 h-4 invert" />
                    {showForm ? 'Đóng form' : 'Tạo ưu đãi mới'}
                </button>
            </div>

            {/* Form tạo/sửa */}
            {showForm && (
                <form onSubmit={handleSubmit} className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                        {editingId ? 'Chỉnh sửa ưu đãi' : 'Tạo ưu đãi mới'}
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className={labelClass}>Tiêu đề *</label>
                            <input value={form.title} onChange={e => updateField('title', e.target.value)} required className={inputClass} placeholder="VD: Gói nghỉ dưỡng mùa hè" />
                        </div>

                        <div className="md:col-span-2">
                            <label className={labelClass}>Mô tả *</label>
                            <textarea value={form.description} onChange={e => updateField('description', e.target.value)} required rows={2} className={`${inputClass} h-auto py-2`} placeholder="Mô tả ngắn gọn về ưu đãi" />
                        </div>

                        <div>
                            <label className={labelClass}>Loại giảm giá *</label>
                            <select value={form.discountType} onChange={e => updateField('discountType', e.target.value)} className={inputClass}>
                                <option value="percent">Phần trăm (%)</option>
                                <option value="fixed">Số tiền cố định (₫)</option>
                            </select>
                        </div>

                        <div>
                            <label className={labelClass}>Giá trị giảm *</label>
                            <input type="number" value={form.discountValue} onChange={e => updateField('discountValue', e.target.value)} required min={1} className={inputClass} placeholder={form.discountType === 'percent' ? 'VD: 25' : 'VD: 500000'} />
                        </div>

                        <div>
                            <label className={labelClass}>Mã coupon *</label>
                            <input value={form.couponCode} onChange={e => updateField('couponCode', e.target.value.toUpperCase())} required disabled={!!editingId} className={`${inputClass} uppercase tracking-wider ${editingId ? 'bg-slate-50' : ''}`} placeholder="VD: SUMMER25" />
                        </div>

                        <div>
                            <label className={labelClass}>Phân loại</label>
                            <select value={form.category} onChange={e => updateField('category', e.target.value)} className={inputClass}>
                                {CATEGORY_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className={labelClass}>Từ ngày *</label>
                            <input type="date" value={form.validFrom} onChange={e => updateField('validFrom', e.target.value)} required className={inputClass} />
                        </div>

                        <div>
                            <label className={labelClass}>Đến ngày *</label>
                            <input type="date" value={form.validTo} onChange={e => updateField('validTo', e.target.value)} required className={inputClass} />
                        </div>

                        <div>
                            <label className={labelClass}>Tối thiểu số đêm</label>
                            <input type="number" value={form.minNights} onChange={e => updateField('minNights', e.target.value)} min={1} className={inputClass} />
                        </div>

                        <div>
                            <label className={labelClass}>Tổng giới hạn (Tất cả khách)</label>
                            <input type="number" value={form.maxUses} onChange={e => updateField('maxUses', e.target.value)} min={1} className={inputClass} placeholder="Để trống = không giới hạn" />
                            <p className="text-[10px] text-gray-500 mt-1 leading-tight">Mặc định mỗi khách hàng chỉ được dùng loại mã này 1 lần duy nhất.</p>
                        </div>

                        <div className="md:col-span-2">
                            <label className={labelClass}>Ảnh bìa ưu đãi</label>
                            <div className="mt-2 flex items-start gap-4">
                                {previewUrl ? (
                                    <div className="relative h-24 w-40 shrink-0 overflow-hidden rounded-xl border border-slate-200">
                                        <img src={previewUrl} alt="preview" className="h-full w-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setImageFile(null);
                                                setPreviewUrl(null);
                                                updateField('image', '');
                                            }}
                                            className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-red-500/90 text-white shadow-sm hover:bg-red-600 transition-colors"
                                        >
                                            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                        </button>
                                    </div>
                                ) : (
                                    <label className="flex h-24 w-40 shrink-0 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 transition-colors hover:border-indigo-400 hover:bg-indigo-50/50">
                                        <img src={assets.uploadArea} alt="upload" className="h-7 w-7 opacity-75" />
                                        <span className="text-[11px] font-medium text-slate-500">Tải ảnh lên</span>
                                        <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                                    </label>
                                )}
                                <div className="flex flex-col justify-center text-xs text-gray-500 py-1">
                                    <p className="font-medium text-gray-600">Thêm hình ảnh nổi bật</p>
                                    <p className="mt-0.5">Nên thiết kế ảnh tỉ lệ 16:9, kích thước tối đa 2MB.</p>
                                    <p className="mt-1">Ảnh đẹp giúp thu hút khách đặt ưu đãi nhanh hơn.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 mt-6">
                        <button type="submit" disabled={isSaving} className="rounded-lg bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-black disabled:bg-slate-300 transition-colors">
                            {isSaving ? 'Đang lưu...' : editingId ? 'Cập nhật' : 'Tạo ưu đãi'}
                        </button>
                        <button type="button" onClick={() => { setShowForm(false); setEditingId(null); setForm(INITIAL_FORM); setImageFile(null); setPreviewUrl(null); }} className="rounded-lg border border-slate-200 px-6 py-2.5 text-sm font-medium text-gray-600 hover:bg-slate-50 transition-colors">
                            Hủy
                        </button>
                    </div>
                </form>
            )}

            {/* Danh sách promotions */}
            {isLoading ? (
                <div className="grid gap-4">
                    {[1, 2, 3].map(i => <div key={i} className="h-24 rounded-xl bg-slate-100 animate-pulse" />)}
                </div>
            ) : promotions.length === 0 ? (
                <div className="text-center py-16 rounded-xl border border-slate-200 bg-white">
                    <p className="text-gray-500 text-sm">Chưa có ưu đãi nào</p>
                    <p className="text-gray-400 text-xs mt-1">Nhấn "Tạo ưu đãi mới" để bắt đầu</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {promotions.map(promo => {
                        const isExpired = new Date(promo.validTo) < new Date()
                        const usagePercent = promo.maxUses ? Math.round((promo.usedCount / promo.maxUses) * 100) : null

                        return (
                            <div key={promo._id} className={`rounded-xl border bg-white p-5 shadow-sm transition-all ${promo.isActive ? 'border-slate-200' : 'border-red-100 bg-red-50/30'}`}>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                    {promo.image && (
                                        <img src={promo.image} alt={promo.title} className="w-20 h-14 rounded-lg object-cover shrink-0" />
                                    )}

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h3 className="font-semibold text-gray-900 text-sm">{promo.title}</h3>
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${promo.isActive && !isExpired ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                                                {!promo.isActive ? 'Đã tắt' : isExpired ? 'Hết hạn' : 'Đang hoạt động'}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-0.5">{promo.description}</p>
                                        <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-gray-500">
                                            <span className="font-semibold text-gray-700">
                                                {promo.discountValue}{promo.discountType === 'percent' ? '%' : '₫'} OFF
                                            </span>
                                            <span>Mã: <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-gray-700">{promo.couponCode}</code></span>
                                            <span>Min {promo.minNights} đêm</span>
                                            <span>Dùng: {promo.usedCount}{promo.maxUses ? `/${promo.maxUses}` : ''}</span>
                                            {usagePercent !== null && (
                                                <div className="flex items-center gap-1">
                                                    <div className="w-16 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                                                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${usagePercent}%` }} />
                                                    </div>
                                                    <span>{usagePercent}%</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                        <button onClick={() => window.open(`/promotions/${promo._id}`, '_blank')} className="rounded-lg border border-indigo-200 px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 transition-colors">
                                            Xem
                                        </button>
                                        <button onClick={() => handleEdit(promo)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-slate-50 transition-colors">
                                            Sửa
                                        </button>
                                        <button onClick={() => handleToggleActive(promo)} className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${promo.isActive ? 'border border-amber-200 text-amber-600 hover:bg-amber-50' : 'border border-emerald-200 text-emerald-600 hover:bg-emerald-50'}`}>
                                            {promo.isActive ? 'Tắt' : 'Bật'}
                                        </button>
                                        <button onClick={() => handleDelete(promo._id)} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors">
                                            Xóa
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

export default ManagePromotions
