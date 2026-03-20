import React, { useRef, useLayoutEffect, useState, useEffect } from 'react'
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion'
import { assets } from '../assets/assets'

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

  // Fetch hotels from API
  useEffect(() => {
    const fetchHotels = async () => {
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || ''
        const { data } = await axios.get(`${backendUrl}/api/hotels/`)
        if (data?.success) setAllHotels(data.data || [])
      } catch (err) {
        console.log('Failed to fetch hotels:', err)
      }
    }
    fetchHotels()
  }, [])

  // Split hotels by theme
  const urbanHotels = allHotels.filter(h => h.theme === 'Urban Stays')
  const countyHotels = allHotels.filter(h => h.theme === 'County Stays')

  // GSAP Animations
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // Hero parallax
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
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 },
    },
  }

  const wordItem = {
    hidden: { opacity: 0, scale: 0.95, y: 30 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.8, ease: easeCustom } },
  }

  const staggerCards = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.2 },
    },
  }

  const lineReveal = {
    hidden: { scaleX: 0, originX: 0 },
    visible: { scaleX: 1, transition: { duration: 1.2, ease: easeCustom } },
  }

  return (
    <div className="bg-[#f0eeea] min-h-screen">
      {/* ═══════════════════════════════════════════════════════
          HERO SECTION
          ═══════════════════════════════════════════════════════ */}
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
              initial="hidden"
              animate="visible"
              variants={fadeInUp}
              className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/70 mb-4 block"
            >
              4 Khu vực · 4 Câu chuyện
            </motion.span>
            <motion.h1
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, ease: easeCustom }}
              className="font-playfair text-3xl md:text-5xl lg:text-7xl text-white font-normal tracking-tight leading-[1.1]"
            >
              Khám phá
              <br />
              <span className="italic">Khách sạn</span> của chúng tôi
            </motion.h1>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          URBAN STAYS SECTION
          ═══════════════════════════════════════════════════════ */}
      <section ref={urbanRef} className="bg-[#f0eeea] py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6 md:px-16 lg:px-24">
          {/* Section Title — Drake bordered words */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={wordContainer}
            className="flex flex-wrap gap-2 mb-4"
          >
            {['Urban', 'Stays'].map((word) => (
              <motion.span
                key={word}
                variants={wordItem}
                className="inline-block border-[2.5px] border-gray-900 px-4 py-1.5 text-3xl md:text-5xl lg:text-6xl font-playfair text-gray-900 tracking-tight leading-none uppercase"
              >
                {word}
              </motion.span>
            ))}
          </motion.div>

          <motion.p
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="font-mono text-[11px] uppercase tracking-[0.2em] text-gray-500 mb-4"
          >
            Kỳ nghỉ Đô thị · Modern Wing
          </motion.p>

          <motion.p
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-gray-600 leading-relaxed max-w-2xl mb-12"
          >
            Đặt tại trung tâm thành phố — nơi mang "năng lượng điện" của phố thị, kết nối trực tiếp với âm nhạc, phòng tranh độc lập và nhịp sống về đêm sôi động.
          </motion.p>

          {/* Thin Divider */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={lineReveal}
            className="h-[1px] bg-gray-300 w-full mb-12"
          />

          {/* Hotel Cards Grid */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={staggerCards}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
          >
            {urbanHotels.map((hotel, index) => (
              <HotelCard hotel={hotel} key={hotel._id} index={index} />
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          COUNTY STAYS SECTION
          ═══════════════════════════════════════════════════════ */}
      <section ref={countyRef} className="bg-[#e8e4de] py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6 md:px-16 lg:px-24">
          {/* Section Title */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={wordContainer}
            className="flex flex-wrap gap-2 mb-4"
          >
            {['County', 'Stays'].map((word) => (
              <motion.span
                key={word}
                variants={wordItem}
                className="inline-block border-[2.5px] border-gray-900 px-4 py-1.5 text-3xl md:text-5xl lg:text-6xl font-playfair text-gray-900 tracking-tight leading-none uppercase"
              >
                {word}
              </motion.span>
            ))}
          </motion.div>

          <motion.p
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="font-mono text-[11px] uppercase tracking-[0.2em] text-gray-500 mb-4"
          >
            Kỳ nghỉ Vùng quê · Classic Wing
          </motion.p>

          <motion.p
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-gray-600 leading-relaxed max-w-2xl mb-12"
          >
            Khu vực ngoại ô có cảnh quan đẹp — tập trung vào sự quyến rũ bình dị (bucolic charm), ẩm thực địa phương farm-to-table và tầm nhìn thiên nhiên để thư giãn.
          </motion.p>

          {/* Thin Divider */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={lineReveal}
            className="h-[1px] bg-gray-300 w-full mb-12"
          />

          {/* Hotel Cards */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={staggerCards}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
          >
            {countyHotels.map((hotel, index) => (
              <HotelCard hotel={hotel} key={hotel._id} index={index} />
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          EDITORIAL QUOTE SECTION
          ═══════════════════════════════════════════════════════ */}
      <section className="bg-[#f0eeea] py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-6 md:px-16 lg:px-24 text-center">
          <motion.blockquote
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="font-playfair text-xl md:text-3xl lg:text-4xl text-gray-800 leading-relaxed max-w-4xl mx-auto italic"
          >
            "Mỗi QuickStay là một câu chuyện — từ năng lượng đô thị sôi động đến sự bình yên của vùng quê. Hãy chọn trải nghiệm của bạn."
          </motion.blockquote>
          <motion.p
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="font-mono text-[10px] uppercase tracking-[0.3em] text-gray-400 mt-8"
          >
            — QuickStay Collection
          </motion.p>
        </div>
      </section>
    </div>
  )
}

export default AllRooms
