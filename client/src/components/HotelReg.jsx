import React, { useState } from 'react'
import { assets, cities } from '../assets/assets'
import { useAppContext } from '../context/appContextCore'
import { toast } from 'react-hot-toast'

const HotelReg = () => {
  const { setShowHotelReg, axios, setIsOwner } = useAppContext()
  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [address, setAddress] = useState('')
  const [selectedCity, setSelectedCity] = useState('')
  const [isCityOpen, setIsCityOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    const trimmedName = name.trim()
    const trimmedContact = contact.trim()
    const trimmedAddress = address.trim()

    if (!trimmedName || !trimmedContact || !trimmedAddress || !selectedCity) {
      toast.error('Vui lòng điền đầy đủ thông tin và chọn thành phố')
      return
    }

    try {
      setIsSubmitting(true)

      const { data } = await axios.post('/api/hotels', {
        name: trimmedName,
        contact: trimmedContact,
        address: trimmedAddress,
        city: selectedCity,
      })

      if (data?.success) {
        toast.success('Đăng ký khách sạn thành công')
        setIsOwner(true)
        setShowHotelReg(false)
      } else {
        toast.error(data?.message || 'Đăng ký khách sạn không thành công')
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70">
      <form
        className="flex w-full max-w-4xl overflow-hidden rounded-2xl bg-white max-md:mx-4"
        onSubmit={handleSubmit}
      >
        <img
          src={assets.regImage}
          alt="reg-image"
          className="hidden h-full w-1/2 object-cover md:block"
        />
        <div className="relative flex flex-1 flex-col items-center justify-start p-8 md:p-10 text-center">
          <img
            src={assets.closeIcon}
            alt="close-icon"
            className="absolute right-6 top-6 h-4 w-4 cursor-pointer"
            onClick={() => setShowHotelReg(false)}
          />
          <p className="mt-6 text-center text-2xl font-semibold tracking-tight text-gray-900 md:text-3xl">
            Đăng ký khách sạn trên QuickStay
          </p>
          <div className="mt-8 flex w-full max-w-md items-center gap-4">
            <label
              htmlFor="name"
              className="w-32 text-sm font-semibold text-gray-600"
            >
              Tên khách sạn
            </label>
            <input
              id="name"
              type="text"
              placeholder="Nhập tên khách sạn"
              className="flex-1 rounded-lg border border-indigo-500 px-3 py-2.5 text-sm font-normal text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-indigo-500/70"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="mt-4 flex w-full max-w-md items-center gap-4">
            <label
              htmlFor="contact"
              className="w-32 text-sm font-semibold text-gray-600">
              Số điện thoại
            </label>
            <input
              id="contact"
              type="tel"
              placeholder="Nhập số điện thoại liên hệ"
              className="flex-1 rounded-lg border border-indigo-500 px-3 py-2.5 text-sm font-normal text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-indigo-500/70"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              required
            />
          </div>
          <div className="mt-4 flex w-full max-w-md items-center gap-4">
            <label
              htmlFor="address"
              className="w-32 text-sm font-semibold text-gray-600">
              Địa chỉ
            </label>
            <input
              id="address"
              type="text"
              placeholder="Nhập địa chỉ khách sạn"
              className="flex-1 rounded-lg border border-indigo-500 px-3 py-2.5 text-sm font-normal text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-indigo-500/70"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
            />
          </div>
          <div className="mt-4 flex w-full max-w-md items-center gap-4">
            <label
              htmlFor="city"
              className="w-32 text-sm font-semibold text-gray-600">
              Thành phố
            </label>
            <div className="relative flex-1">
              <button
                type="button"
                id="city"
                className="flex w-full items-center justify-between rounded-lg border border-indigo-500 px-3 py-2.5 text-left text-sm font-normal text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500/70"
                onClick={() => setIsCityOpen((prev) => !prev)}
              >
                <span className={selectedCity ? '' : 'text-gray-400'}>
                  {selectedCity || 'Chọn thành phố'}
                </span>
                <span className="ml-2 text-xs text-gray-500">▼</span>
              </button>
              {isCityOpen && (
                <div className="absolute left-0 top-full z-10 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-indigo-500 bg-white shadow-md">
                  {cities.map((city) => (
                    <button
                      key={city}
                      type="button"
                      className="block w-full px-3 py-2 text-left text-sm text-gray-900 hover:bg-indigo-50"
                      onClick={() => {
                        setSelectedCity(city)
                        setIsCityOpen(false)
                      }}
                    >
                      {city}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-8 w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-400"
          >
            {isSubmitting ? 'Đang đăng ký...' : 'Đăng ký'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default HotelReg
