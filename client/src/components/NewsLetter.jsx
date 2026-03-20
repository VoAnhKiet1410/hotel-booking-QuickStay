import React, { useRef, useLayoutEffect, useState, useEffect } from 'react'
import useScrollReveal from '../hooks/useScrollReveal'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'
import axios from 'axios'

gsap.registerPlugin(ScrollTrigger)

/**
 * NewsLetter — Section đăng ký nhận email ưu đãi.
 * Features: social proof, glow effects, loading/success/error states,
 * floating decorations, API integration.
 */
const NewsLetter = () => {
  const sectionRef = useScrollReveal()
  const contentRef = useRef(null)

  // Form states: idle | loading | success | error
  const [formState, setFormState] = useState('idle')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [subscriberCount, setSubscriberCount] = useState(null)
  const [shakeKey, setShakeKey] = useState(0)

  // Fetch subscriber count cho social proof
  useEffect(() => {
    const fetchCount = async () => {
      try {
        const { data } = await axios.get('/api/subscribers/count')
        if (data.success) {
          setSubscriberCount(data.count)
        }
      } catch {
        // Silent fail — social proof không critical
      }
    }
    fetchCount()
  }, [])

  // GSAP scroll animation
  useLayoutEffect(() => {
    let ctx = gsap.context(() => {
      gsap.fromTo(contentRef.current, {
        y: 40,
        opacity: 0
      }, {
        y: 0,
        opacity: 1,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 85%",
          toggleActions: "play none none none"
        }
      });
    });
    return () => ctx.revert();
  }, [])

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      setFormState('error')
      setMessage('Vui lòng nhập email hợp lệ.')
      setShakeKey(prev => prev + 1)
      return
    }

    setFormState('loading')
    setMessage('')

    try {
      const { data } = await axios.post('/api/subscribers', { email })

      if (data.success) {
        setFormState('success')
        setMessage(data.message)
        setEmail('')
        // Cập nhật count
        if (subscriberCount !== null) {
          setSubscriberCount(prev => prev + 1)
        }
      }
    } catch (error) {
      const errMsg = error?.response?.data?.message || 'Đã xảy ra lỗi. Vui lòng thử lại.'
      setFormState('error')
      setMessage(errMsg)
      setShakeKey(prev => prev + 1)
    }
  }

  // Reset form từ success state
  const handleReset = () => {
    setFormState('idle')
    setMessage('')
  }

  // Format count hiển thị
  const displayCount = subscriberCount !== null
    ? subscriberCount >= 1000
      ? `${(subscriberCount / 1000).toFixed(1).replace('.0', '')}k+`
      : `${subscriberCount}+`
    : null

  return (
    <section ref={sectionRef} className="relative bg-gray-900 overflow-hidden">
      <div className="border-t border-white/10" />

      {/* Floating decorations */}
      <div className="nl-floating-icons">
        <span className="nl-float-icon nl-float-1">✈️</span>
        <span className="nl-float-icon nl-float-2">📍</span>
        <span className="nl-float-icon nl-float-3">🏨</span>
        <span className="nl-float-icon nl-float-4">🌴</span>
      </div>

      <div className="px-6 md:px-16 lg:px-24 xl:px-32 py-20 md:py-28">
        <div ref={contentRef} className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center">

            {/* Left — Content */}
            <div data-scroll data-scroll-speed="0.05">
              <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/40 mb-5 block">
                Đăng ký nhận ưu đãi
              </span>

              {/* Word-in-box title */}
              <div className="flex flex-wrap gap-2 mb-6">
                {['Ưu', 'Đãi', 'Độc', 'Quyền'].map((word) => (
                  <span key={word} className="inline-block border-2 border-white/50 rounded-lg px-3.5 py-1.5 text-3xl md:text-4xl lg:text-5xl font-playfair font-semibold text-white tracking-tight">
                    {word}
                  </span>
                ))}
              </div>

              {/* Value proposition */}
              <p className="text-sm leading-relaxed text-white/50 font-light max-w-md mb-4">
                Đăng ký email để nhận deal giới hạn, gợi ý khách sạn theo điểm đến và cảm hứng cho chuyến đi tiếp theo.
              </p>

              {/* Benefit tags */}
              <div className="flex flex-wrap gap-2 mb-5">
                {[
                  { icon: '🔥', text: 'Flash Sale mỗi thứ 6' },
                  { icon: '🎁', text: 'Giảm đến 15%' },
                  { icon: '✈️', text: 'Gợi ý theo mùa' },
                ].map((tag) => (
                  <span key={tag.text} className="nl-benefit-tag">
                    <span className="mr-1.5">{tag.icon}</span>
                    {tag.text}
                  </span>
                ))}
              </div>

              {/* Social proof */}
              {displayCount && (
                <div className="nl-social-proof">
                  <div className="nl-avatar-stack">
                    {['🧑', '👩', '👨', '👩‍🦱'].map((avatar, i) => (
                      <span
                        key={i}
                        className="nl-avatar"
                        style={{ zIndex: 4 - i }}
                      >
                        {avatar}
                      </span>
                    ))}
                  </div>
                  <span className="text-white/40 text-xs font-light">
                    <strong className="text-white/70 font-medium">{displayCount}</strong> người đã đăng ký nhận ưu đãi
                  </span>
                </div>
              )}
            </div>

            {/* Right — Form */}
            <div data-scroll data-scroll-speed="-0.05">
              {formState === 'success' ? (
                /* ── Success State ── */
                <div className="nl-success-state">
                  <div className="nl-checkmark-circle">
                    <svg className="nl-checkmark-svg" viewBox="0 0 52 52">
                      <circle className="nl-checkmark-circle-bg" cx="26" cy="26" r="25" fill="none" />
                      <path className="nl-checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
                    </svg>
                  </div>
                  <p className="text-white font-playfair text-xl font-semibold mt-4 mb-2">
                    Đăng ký thành công!
                  </p>
                  <p className="text-white/50 text-sm font-light mb-6">
                    {message}
                  </p>
                  <button
                    onClick={handleReset}
                    className="font-mono text-[10px] text-white/40 uppercase tracking-[0.15em] hover:text-white/70 transition-colors cursor-pointer"
                  >
                    ← Đăng ký email khác
                  </button>
                </div>
              ) : (
                /* ── Form State (idle / loading / error) ── */
                <form
                  className="flex flex-col gap-4"
                  onSubmit={handleSubmit}
                >
                  <div>
                    <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40 mb-2 block">
                      Email
                    </label>
                    <div key={shakeKey} className={formState === 'error' ? 'nl-shake' : ''}>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value)
                          if (formState === 'error') {
                            setFormState('idle')
                            setMessage('')
                          }
                        }}
                        placeholder="Nhập email của bạn"
                        disabled={formState === 'loading'}
                        className={`nl-email-input ${formState === 'error' ? 'nl-input-error' : ''}`}
                      />
                    </div>
                    {/* Error message */}
                    {formState === 'error' && message && (
                      <p className="mt-2 text-red-400 text-xs font-light flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {message}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={formState === 'loading'}
                    className="group flex items-center justify-center gap-3 border-2 border-white/50 px-6 py-3.5 text-white hover:bg-white hover:text-gray-900 transition-all duration-300 cursor-pointer rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {formState === 'loading' ? (
                      /* Loading spinner */
                      <span className="nl-spinner" />
                    ) : (
                      <>
                        <span className="font-mono text-xs uppercase tracking-[0.2em]">Đăng ký</span>
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-current transition-all">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                          </svg>
                        </span>
                      </>
                    )}
                  </button>
                </form>
              )}

              <p className="mt-5 font-mono text-[10px] text-white/30 uppercase tracking-wider">
                Khi đăng ký, bạn đồng ý với chính sách quyền riêng tư.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default NewsLetter
