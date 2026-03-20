import React, { useRef, useLayoutEffect, useState, useEffect } from 'react'
// eslint-disable-next-line no-unused-vars -- motion is used as <motion.div> in JSX
import { motion } from 'framer-motion'
import axios from 'axios'
import HotelCard from './HotelCard'
import { useNavigate } from 'react-router-dom'

import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const FeaturedDestination = () => {
  const navigate = useNavigate()
  const [hotels, setHotels] = useState([])

  useEffect(() => {
    const fetchHotels = async () => {
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || ''
        const { data } = await axios.get(`${backendUrl}/api/hotels/`)
        if (data?.success) setHotels(data.data || [])
      } catch (err) {
        console.log('Failed to fetch hotels:', err)
      }
    }
    fetchHotels()
  }, [])

  const sectionRef = useRef(null)
  const headerRef = useRef(null)

  useLayoutEffect(() => {
    let ctx = gsap.context(() => {
      // Subtle header scrub movement
      gsap.fromTo(headerRef.current, {
        y: 40
      }, {
        y: -20,
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: 1
        }
      });
    });
    return () => ctx.revert();
  }, []);

  // --- ANIMATION VARIANTS (Adapted from AboutUs) ---
  const easeCustom = [0.16, 1, 0.3, 1]

  const lineReveal = {
    hidden: { scaleX: 0, originX: 0 },
    visible: {
      scaleX: 1,
      transition: { duration: 1.2, ease: easeCustom }
    }
  }

  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 1, ease: easeCustom } }
  }

  const wordContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 }
    }
  }

  const wordItem = {
    hidden: { opacity: 0, scale: 0.95, y: 30 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.8, ease: easeCustom } }
  }

  const staggerCards = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2
      }
    }
  }

  return (
    <section ref={sectionRef} className="relative bg-[#f5f3ef] overflow-hidden">
      {/* Top border */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        variants={lineReveal}
        className="h-[1px] bg-gray-300 w-full"
      />

      <div className="px-6 md:px-16 lg:px-24 xl:px-32 py-20 md:py-24">
        <div className="max-w-6xl mx-auto">

          {/* Header row */}
          <div ref={headerRef} className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14" data-scroll data-scroll-speed="0.1">
            {/* Word-in-box title */}
            <div>
              <motion.span
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                variants={fadeInUp}
                className="font-mono text-[10px] uppercase tracking-[0.25em] text-gray-400 mb-4 block"
              >
                Được yêu thích nhất
              </motion.span>

              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                variants={wordContainer}
                className="flex flex-wrap gap-2"
              >
                {['Điểm', 'Đến', 'Nổi', 'Bật'].map((word) => (
                  <motion.span
                    key={word}
                    variants={wordItem}
                    className="inline-block border-2 border-gray-800 rounded-lg px-3.5 py-1.5 text-3xl md:text-4xl lg:text-5xl font-playfair font-semibold text-gray-900 tracking-tight"
                  >
                    {word}
                  </motion.span>
                ))}
              </motion.div>
            </div>

            {/* CTA — Drake style */}
            <motion.button
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={fadeInUp}
              onClick={() => { navigate('/rooms'); scrollTo(0, 0) }}
              className="group flex items-center gap-3 cursor-pointer shrink-0"
            >
              <span className="font-mono text-xs uppercase tracking-[0.15em] text-gray-700 group-hover:tracking-[0.2em] transition-all">
                Xem tất cả
              </span>
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-gray-800 text-gray-800 group-hover:bg-gray-900 group-hover:text-white group-hover:border-gray-900 transition-all duration-300">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </span>
            </motion.button>
          </div>

          {/* Thin divider */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={lineReveal}
            className="h-[1px] bg-gray-300 w-full mb-10"
          />

          {/* Cards grid */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerCards}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 justify-items-center items-stretch"
          >
            {hotels.map((hotel, index) => (
              <HotelCard hotel={hotel} key={hotel._id} index={index} />
            ))}
          </motion.div>
        </div>
      </div>

      {/* Bottom border */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={lineReveal}
        className="h-[1px] bg-gray-300 w-full"
      />
    </section>
  )
}

export default FeaturedDestination
