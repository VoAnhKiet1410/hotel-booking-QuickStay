import React, { useState, useMemo, useRef, useEffect, useLayoutEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { cities } from '../assets/assets'
import { toast } from 'react-hot-toast'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const Hero = () => {
  const navigate = useNavigate()
  const [destination, setDestination] = useState('')
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [guests, setGuests] = useState('')
  const [isDestinationOpen, setIsDestinationOpen] = useState(false)
  const [activeDestinationIndex, setActiveDestinationIndex] = useState(-1)
  const dropdownRef = useRef(null)

  const heroRef = useRef(null)
  const videoRef = useRef(null)
  const contentRef = useRef(null)

  const filteredCities = useMemo(() => {
    const query = destination.trim().toLowerCase()
    if (!query) return cities
    return cities.filter((city) => city.toLowerCase().includes(query))
  }, [destination])

  const destinationOptionRefs = useRef({})

  useEffect(() => {
    if (!isDestinationOpen) return
    if (activeDestinationIndex < 0) return
    const activeEl = destinationOptionRefs.current[activeDestinationIndex]
    activeEl?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [activeDestinationIndex, isDestinationOpen])

  // Chặn Locomotive/Lenis scroll khi cuộn trong dropdown
  // Dùng callback ref để attach native non-passive listener ngay khi element mount
  const setDropdownRef = (el) => {
    // Cleanup listener cũ nếu có
    if (dropdownRef.current && dropdownRef.current._wheelHandler) {
      dropdownRef.current.removeEventListener('wheel', dropdownRef.current._wheelHandler)
    }
    dropdownRef.current = el
    if (!el) return
    const handleWheel = (e) => {
      const atTop = el.scrollTop === 0 && e.deltaY < 0
      const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight && e.deltaY > 0
      if (!atTop && !atBottom) {
        // preventDefault ngăn Lenis hoàn toàn (non-passive)
        e.preventDefault()
      }
      // Luôn stopImmediatePropagation để Lenis không nhận event
      e.stopImmediatePropagation()
    }
    el._wheelHandler = handleWheel
    el.addEventListener('wheel', handleWheel, { passive: false })
  }

  // Stop Lenis hoàn toàn khi dropdown đang mở — giải pháp dứt điểm nhất
  useEffect(() => {
    if (isDestinationOpen) {
      window.__lenis?.stop()
    } else {
      window.__lenis?.start()
    }
    return () => {
      // Cleanup: luôn start lại khi component unmount
      window.__lenis?.start()
    }
  }, [isDestinationOpen])

  useLayoutEffect(() => {
    let ctx = gsap.context(() => {
      // Scrub fade and y-transform for hero content
      gsap.to(contentRef.current, {
        y: 100,
        opacity: 0,
        ease: "none",
        scrollTrigger: {
          trigger: heroRef.current,
          start: "top top",
          end: "bottom top",
          scrub: true
        }
      });
      // Scrub slight zoom for video
      gsap.to(videoRef.current, {
        scale: 1.15,
        ease: "none",
        scrollTrigger: {
          trigger: heroRef.current,
          start: "top top",
          end: "bottom top",
          scrub: true
        }
      });
    });
    return () => ctx.revert();
  }, []);

  const selectDestination = (value) => {
    setDestination(value)
    setIsDestinationOpen(false)
    setActiveDestinationIndex(-1)
  }

  const today = new Date().toISOString().split('T')[0]

  const minCheckOut = useMemo(() => {
    if (!checkIn) return today
    const nextDay = new Date(checkIn)
    nextDay.setDate(nextDay.getDate() + 1)
    return nextDay.toISOString().split('T')[0]
  }, [checkIn, today])

  // Validation: clear checkOut when it becomes invalid
  // (handled in checkIn onChange handler below instead of useEffect)

  const handleSearch = (e) => {
    e.preventDefault()

    if (!destination.trim()) {
      toast.error('Vui lòng nhập điểm đến')
      return
    }
    if (!checkIn) {
      toast.error('Vui lòng chọn ngày nhận phòng')
      return
    }
    if (!checkOut) {
      toast.error('Vui lòng chọn ngày trả phòng')
      return
    }
    if (checkOut <= checkIn) {
      toast.error('Ngày trả phòng phải sau ngày nhận phòng')
      return
    }
    const guestCount = parseInt(guests) || 0
    if (guestCount < 1) {
      toast.error('Vui lòng nhập số khách (tối thiểu 1)')
      return
    }
    if (guestCount > 10) {
      toast.error('Số khách tối đa là 10')
      return
    }

    const searchParams = new URLSearchParams()
    searchParams.set('city', destination.trim())
    searchParams.set('checkIn', checkIn)
    searchParams.set('checkOut', checkOut)
    searchParams.set('guests', guestCount.toString())
    navigate(`/rooms?${searchParams.toString()}`)
    window.scrollTo(0, 0)
  }

  return (
    <div ref={heroRef} data-nav-theme="light" className='relative flex flex-col items-start justify-center px-6 md:px-16 lg:px-24 xl:px-32 text-white min-h-screen'>
      {/* Video Background with Parallax — overflow-hidden ở đây để clip video h-[120%] không ảnh hưởng dropdown */}
      <div data-scroll data-scroll-speed="-0.3" className="absolute w-full h-[120%] -top-[10%] inset-0 z-0 pointer-events-none will-change-transform overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
        >
          <source src="/videos/drake-hotel-toronto.mp4" type="video/mp4" />
        </video>
      </div>

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/50 z-0" />

      <div ref={contentRef} className="relative z-10 flex flex-col gap-6 mt-20 max-w-5xl">
        {/* Monospace label — Drake style */}
        <p className='hero-animate hero-delay-1 font-mono text-[10px] md:text-xs uppercase tracking-[0.3em] text-white/60'>
          Iconic Booking Platform, Vietnam
        </p>

        {/* Word-in-box heading — Drake style */}
        <div className='hero-animate hero-delay-2 flex flex-wrap gap-2.5'>
          {['Khám', 'Phá', 'Điểm', 'Đến'].map((word) => (
            <span key={word} className="inline-block border-2 border-white/60 rounded-lg px-4 py-2 text-4xl md:text-6xl lg:text-7xl font-playfair font-semibold text-white tracking-tight">
              {word}
            </span>
          ))}
          <span className="inline-block bg-white rounded-lg px-4 py-2 text-4xl md:text-6xl lg:text-7xl font-playfair font-semibold text-gray-900 tracking-tight">
            Lý Tưởng
          </span>
        </div>

        {/* Subtitle — monospace */}
        <p className='hero-animate hero-delay-3 max-w-lg text-sm md:text-base leading-relaxed text-white/65 font-light'>
          Trải nghiệm xa hoa và tiện nghi vượt trội đang chờ đón bạn tại những khách sạn và khu nghỉ dưỡng đẳng cấp nhất Việt Nam.
        </p>

        {/* Search Form — Editorial style */}
        <form onSubmit={handleSearch} className='hero-animate hero-delay-4 relative z-20 bg-white text-gray-800 flex flex-col md:flex-row max-md:mx-auto w-full border-2 border-gray-200 rounded-lg'>

          {/* Destination */}
          <div className='relative flex-1 px-5 py-4 md:border-r border-gray-200'>
            <label htmlFor="destinationInput" className='font-mono text-[10px] uppercase tracking-[0.2em] text-gray-400'>Điểm đến</label>
            <input
              id="destinationInput"
              type="text"
              className="w-full mt-1.5 text-sm text-gray-900 font-medium outline-none placeholder:text-gray-300 bg-transparent"
              placeholder="Nhập điểm đến"
              value={destination}
              onChange={(e) => {
                setDestination(e.target.value)
                setIsDestinationOpen(true)
                setActiveDestinationIndex(0)
              }}
              onFocus={() => {
                setIsDestinationOpen(true)
                setActiveDestinationIndex(0)
              }}
              onBlur={() => {
                window.setTimeout(() => setIsDestinationOpen(false), 120)
              }}
              onKeyDown={(e) => {
                if (!isDestinationOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
                  setIsDestinationOpen(true)
                  setActiveDestinationIndex(0)
                  return
                }
                if (!isDestinationOpen) return
                if (e.key === 'Escape') {
                  setIsDestinationOpen(false)
                  setActiveDestinationIndex(-1)
                  return
                }
                if (e.key === 'ArrowDown') {
                  e.preventDefault()
                  setActiveDestinationIndex((prev) => Math.min(prev + 1, filteredCities.length - 1))
                  return
                }
                if (e.key === 'ArrowUp') {
                  e.preventDefault()
                  setActiveDestinationIndex((prev) => Math.max(prev - 1, 0))
                  return
                }
                if (e.key === 'Enter') {
                  const selected = filteredCities[activeDestinationIndex]
                  if (selected) {
                    e.preventDefault()
                    selectDestination(selected)
                  }
                }
              }}
            />
            {isDestinationOpen && filteredCities.length > 0 && (
              <div
                ref={setDropdownRef}
                data-lenis-prevent
                className='absolute left-0 right-0 top-full mt-0 max-h-56 overflow-y-auto border border-gray-200 bg-white shadow-[0_12px_40px_rgba(0,0,0,0.12)] z-50 overscroll-contain'
                onTouchMove={(e) => e.stopPropagation()}
              >
                {filteredCities.map((city, index) => (
                  <button
                    key={city}
                    type="button"
                    ref={(el) => {
                      if (el) destinationOptionRefs.current[index] = el
                    }}
                    className={`w-full text-left px-5 py-2.5 text-sm font-mono transition-colors ${index === activeDestinationIndex ? 'bg-gray-100 text-gray-900 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                    onMouseEnter={() => setActiveDestinationIndex(index)}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      selectDestination(city)
                    }}
                  >
                    {city}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Check-in */}
          <div className='flex-1 px-5 py-4 md:border-r border-gray-200 max-md:border-t'>
            <label htmlFor="checkIn" className='font-mono text-[10px] uppercase tracking-[0.2em] text-gray-400'>Nhận phòng</label>
            <input
              id="checkIn"
              type="date"
              min={today}
              value={checkIn}
              onChange={(e) => {
                const newCheckIn = e.target.value
                setCheckIn(newCheckIn)
                if (checkOut && checkOut <= newCheckIn) setCheckOut('')
              }}
              className="w-full mt-1.5 text-sm text-gray-900 font-medium outline-none bg-transparent"
            />
          </div>

          {/* Check-out */}
          <div className='flex-1 px-5 py-4 md:border-r border-gray-200 max-md:border-t'>
            <label htmlFor="checkOut" className='font-mono text-[10px] uppercase tracking-[0.2em] text-gray-400'>Trả phòng</label>
            <input
              id="checkOut"
              type="date"
              min={minCheckOut}
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              className="w-full mt-1.5 text-sm text-gray-900 font-medium outline-none bg-transparent"
            />
          </div>

          {/* Guests */}
          <div className='px-5 py-4 md:border-r border-gray-200 max-md:border-t md:w-28'>
            <label htmlFor="guests" className='font-mono text-[10px] uppercase tracking-[0.2em] text-gray-400'>Số khách</label>
            <input
              id="guests"
              type="number"
              min={1}
              max={10}
              value={guests}
              onChange={(e) => setGuests(e.target.value)}
              className="w-full mt-1.5 text-sm text-gray-900 font-medium outline-none bg-transparent"
              placeholder="0"
            />
          </div>

          {/* Search Button — Drake style: text + circle arrow */}
          <button
            type="submit"
            className='group flex items-center justify-center gap-3 px-6 py-4 bg-gray-900 text-white hover:bg-gray-800 transition-colors max-md:border-t border-gray-200 cursor-pointer'
          >
            <span className='font-mono text-xs uppercase tracking-[0.2em]'>Tìm kiếm</span>
            <span className='inline-flex items-center justify-center w-8 h-8 rounded-full border border-white/50 group-hover:bg-white group-hover:text-gray-900 transition-all'>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </span>
          </button>
        </form>
      </div>

      {/* Scroll indicator */}
      <div className='absolute bottom-8 left-1/2 -translate-x-1/2 scroll-indicator'>
        <svg className="w-6 h-6 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>
    </div>
  )
}

export default Hero
