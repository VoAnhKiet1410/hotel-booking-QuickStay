import React, { useRef, useLayoutEffect, useState, useEffect, useMemo } from 'react'
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion'
import { assets } from '../assets/assets'
import { useSearchParams } from 'react-router-dom'

import HotelCard from '../components/HotelCard'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'
import axios from 'axios'

gsap.registerPlugin(ScrollTrigger)

const AllRooms = () => {

  const heroRef = useRef(null)
  const urbanRef = useRef(null)
  const countyRef = useRef(null)

  const [allHotels, setAllHotels] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // Đọc search params từ URL (do Hero.jsx navigate với params)
  const [searchParams] = useSearchParams()
  const cityParam = searchParams.get('city') || ''
  const checkInParam = searchParams.get('checkIn') || ''
  const checkOutParam = searchParams.get('checkOut') || ''
  const guestsParam = searchParams.get('guests') || ''

  const isSearchMode = !!cityParam || !!checkInParam

  // Fetch hotels từ API
  useEffect(() => {
    const fetchHotels = async () => {
      try {
        setIsLoading(true)
        const backendUrl = import.meta.env.VITE_BACKEND_URL || ''
        const { data } = await axios.get(`${backendUrl}/api/hotels/`)
        if (data?.success) setAllHotels(data.data || [])
      } catch (err) {
        console.log('Failed to fetch hotels:', err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchHotels()
  }, [])

  // Filter theo city (case-insensitive, partial match)
  const filteredHotels = useMemo(() => {
    if (!cityParam) return allHotels
    const q = cityParam.trim().toLowerCase()
    return allHotels.filter(h =>
      (h.city || '').toLowerCase().includes(q) ||
      (h.address || '').toLowerCase().includes(q) ||
      (h.name || '').toLowerCase().includes(q)
    )
  }, [allHotels, cityParam])

  // Build query string để truyền sang RoomDetails (checkIn, checkOut, guests)
  const searchQueryString = useMemo(() => {
    const params = new URLSearchParams()
    if (checkInParam) params.set('checkIn', checkInParam)
    if (checkOutParam) params.set('checkOut', checkOutParam)
    if (guestsParam) params.set('guests', guestsParam)
    return params.toString() ? `?${params.toString()}` : ''
  }, [checkInParam, checkOutParam, guestsParam])

  // Split hotels by theme (dùng khi không search)
  const urbanHotels = useMemo(() => allHotels.filter(h => h.theme === 'Urban Stays'), [allHotels])
  const countyHotels = useMemo(() => allHotels.filter(h => h.theme === 'County Stays'), [allHotels])

  // GSAP Animations
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const heroImg = heroRef.current?.querySelector('.hero-img')
      if (heroImg) {
        gsap.to(heroImg, {
          yPercent: 15,
          ease: 'none',
          scrollTrigger: {
            trigger: heroRef.current,
            start: 'top top',
            end: 'bottom top',
            scrub: true,
          },
        })
      }
    })
    return () => ctx.revert()
  }, [])

  // Animation variants
  const easeCustom = [0.16, 1, 0.3, 1]
  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 1, ease: easeCustom } },
  }
  const wordContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
  }
  const wordItem = {
    hidden: { opacity: 0, scale: 0.95, y: 30 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.8, ease: easeCustom } },
  }
  const staggerCards = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.2 } },
  }
  const lineReveal = {
    hidden: { scaleX: 0, originX: 0 },
    visible: { scaleX: 1, transition: { duration: 1.2, ease: easeCustom } },
  }

  return (
    <div className="bg-[#f0eeea] min-h-screen">

      {/* ═══ HERO SECTION ═══ */}
      <section ref={heroRef} className="relative h-[60vh] md:h-[75vh] overflow-hidden">
        <img
          src={assets.heroImage}
          alt="QuickStay Hotels"
          className="hero-img w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-16 lg:p-24">
          <div className="max-w-7xl mx-auto">
            <motion.span
              initial="hidden" animate="visible" variants={fadeInUp}
              className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/70 mb-4 block"
            >
              {isSearchMode
                ? `${filteredHotels.length} kết quả${cityParam ? ` tại "${cityParam}"` : ''}`
                : '4 Khu vực · 4 Câu chuyện'}
            </motion.span>
            <motion.h1
              initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, ease: easeCustom }}
              className="font-playfair text-3xl md:text-5xl lg:text-7xl text-white font-normal tracking-tight leading-[1.1]"
            >
              {isSearchMode ? (
                <>Kết quả<br /><span className="italic">tìm kiếm</span></>
              ) : (
                <>Khám phá<br /><span className="italic">Khách sạn</span> của chúng tôi</>
              )}
            </motion.h1>
          </div>
        </div>
      </section>

      {/* ═══ SEARCH INFO BAR ═══ */}
      {isSearchMode && (
        <div className="bg-gray-900 text-white py-3 px-6 md:px-16 lg:px-24">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-4 text-xs font-mono uppercase tracking-[0.15em]">
            {cityParam && (
              <span className="flex items-center gap-1.5">
                <span className="text-white/40">Điểm đến:</span>
                <span className="text-amber-400">{cityParam}</span>
              </span>
            )}
            {checkInParam && (
              <span className="flex items-center gap-1.5">
                <span className="text-white/40">Nhận phòng:</span>
                <span>{new Date(checkInParam).toLocaleDateString('vi-VN')}</span>
              </span>
            )}
            {checkOutParam && (
              <span className="flex items-center gap-1.5">
                <span className="text-white/40">Trả phòng:</span>
                <span>{new Date(checkOutParam).toLocaleDateString('vi-VN')}</span>
              </span>
            )}
            {guestsParam && (
              <span className="flex items-center gap-1.5">
                <span className="text-white/40">Số khách:</span>
                <span>{guestsParam}</span>
              </span>
            )}
          </div>
        </div>
      )}

      {/* ═══ SEARCH RESULTS ═══ */}
      {isSearchMode && (
        <section className="bg-[#f0eeea] py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-6 md:px-16 lg:px-24">
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse bg-gray-200 h-80 rounded" />
                ))}
              </div>
            ) : filteredHotels.length === 0 ? (
              <div className="text-center py-20">
                <p className="font-playfair text-3xl text-gray-700 mb-4">Không tìm thấy khách sạn</p>
                <p className="font-mono text-xs text-gray-400 uppercase tracking-[0.2em]">
                  Không có khách sạn nào tại &ldquo;{cityParam}&rdquo;. Hãy thử thành phố khác.
                </p>
              </div>
            ) : (
              <motion.div
                initial="hidden" animate="visible" variants={staggerCards}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
              >
                {filteredHotels.map((hotel, index) => (
                  <HotelCard
                    hotel={hotel}
                    key={hotel._id}
                    index={index}
                    searchQuery={searchQueryString}
                  />
                ))}
              </motion.div>
            )}
          </div>
        </section>
      )}

      {/* ═══ BROWSE MODE: Urban Stays + County Stays ═══ */}
      {!isSearchMode && (
        <>
          {/* URBAN STAYS */}
          <section ref={urbanRef} className="bg-[#f0eeea] py-16 md:py-24">
            <div className="max-w-7xl mx-auto px-6 md:px-16 lg:px-24">
              <motion.div
                initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }}
                variants={wordContainer} className="flex flex-wrap gap-2 mb-4"
              >
                {['Urban', 'Stays'].map((word) => (
                  <motion.span key={word} variants={wordItem}
                    className="inline-block border-[2.5px] border-gray-900 px-4 py-1.5 text-3xl md:text-5xl lg:text-6xl font-playfair text-gray-900 tracking-tight leading-none uppercase"
                  >
                    {word}
                  </motion.span>
                ))}
              </motion.div>
              <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}
                className="font-mono text-[11px] uppercase tracking-[0.2em] text-gray-500 mb-4"
              >
                Kỳ nghỉ Đô thị · Modern Wing
              </motion.p>
              <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}
                className="text-gray-600 leading-relaxed max-w-2xl mb-12"
              >
                Đặt tại trung tâm thành phố — nơi mang &ldquo;năng lượng điện&rdquo; của phố thị, kết nối trực tiếp với âm nhạc, phòng tranh độc lập và nhịp sống về đêm sôi động.
              </motion.p>
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={lineReveal}
                className="h-[1px] bg-gray-300 w-full mb-12"
              />
              <motion.div
                initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }} variants={staggerCards}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
              >
                {urbanHotels.map((hotel, index) => (
                  <HotelCard hotel={hotel} key={hotel._id} index={index} />
                ))}
              </motion.div>
            </div>
          </section>

          {/* COUNTY STAYS */}
          <section ref={countyRef} className="bg-[#e8e4de] py-16 md:py-24">
            <div className="max-w-7xl mx-auto px-6 md:px-16 lg:px-24">
              <motion.div
                initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }}
                variants={wordContainer} className="flex flex-wrap gap-2 mb-4"
              >
                {['County', 'Stays'].map((word) => (
                  <motion.span key={word} variants={wordItem}
                    className="inline-block border-[2.5px] border-gray-900 px-4 py-1.5 text-3xl md:text-5xl lg:text-6xl font-playfair text-gray-900 tracking-tight leading-none uppercase"
                  >
                    {word}
                  </motion.span>
                ))}
              </motion.div>
              <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}
                className="font-mono text-[11px] uppercase tracking-[0.2em] text-gray-500 mb-4"
              >
                Kỳ nghỉ Vùng quê · Classic Wing
              </motion.p>
              <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}
                className="text-gray-600 leading-relaxed max-w-2xl mb-12"
              >
                Khu vực ngoại ô có cảnh quan đẹp — tập trung vào sự quyến rũ bình dị (bucolic charm), ẩm thực địa phương farm-to-table và tầm nhìn thiên nhiên để thư giãn.
              </motion.p>
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={lineReveal}
                className="h-[1px] bg-gray-300 w-full mb-12"
              />
              <motion.div
                initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }} variants={staggerCards}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
              >
                {countyHotels.map((hotel, index) => (
                  <HotelCard hotel={hotel} key={hotel._id} index={index} />
                ))}
              </motion.div>
            </div>
          </section>

          {/* EDITORIAL QUOTE */}
          <section className="bg-[#f0eeea] py-20 md:py-28">
            <div className="max-w-7xl mx-auto px-6 md:px-16 lg:px-24 text-center">
              <motion.blockquote
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}
                className="font-playfair text-xl md:text-3xl lg:text-4xl text-gray-800 leading-relaxed max-w-4xl mx-auto italic"
              >
                &ldquo;Mỗi QuickStay là một câu chuyện — từ năng lượng đô thị sôi động đến sự bình yên của vùng quê. Hãy chọn trải nghiệm của bạn.&rdquo;
              </motion.blockquote>
              <motion.p
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}
                className="font-mono text-[10px] uppercase tracking-[0.3em] text-gray-400 mt-8"
              >
                — QuickStay Collection
              </motion.p>
            </div>
          </section>
        </>
      )}
    </div>
  )
}

export default AllRooms
