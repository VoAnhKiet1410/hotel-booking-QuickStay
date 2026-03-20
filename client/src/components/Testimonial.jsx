import React, { useRef, useLayoutEffect } from 'react'
import { assets, testimonials } from '../assets/assets'
import useScrollReveal from '../hooks/useScrollReveal'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const Testimonial = () => {
  const sectionRef = useScrollReveal()
  const gridRef = useRef(null)

  useLayoutEffect(() => {
    let ctx = gsap.context(() => {
      if (!gridRef.current) return;
      const cards = gridRef.current.children;

      gsap.fromTo(cards, {
        y: 60,
        opacity: 0
      }, {
        y: 0,
        opacity: 1,
        duration: 0.6,
        stagger: 0.15,
        ease: "power2.out",
        scrollTrigger: {
          trigger: gridRef.current,
          start: "top 90%",
          toggleActions: "play none none none"
        }
      });
    });
    return () => ctx.revert();
  }, [])

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, index) => {
      const isFilled = index < rating
      return (
        <img
          key={index}
          src={isFilled ? assets.starIconFilled : assets.starIconOutlined}
          alt="star"
          className="w-4 h-4"
        />
      )
    })
  }

  return (
    <section ref={sectionRef} className="relative bg-[#f5f3ef] overflow-hidden">
      <div className="border-t border-gray-300" />

      <div className="px-6 md:px-16 lg:px-24 xl:px-32 py-20 md:py-24">
        <div className="max-w-6xl mx-auto">

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14" data-scroll data-scroll-speed="0.1">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-gray-400 mb-4 block">
                Trải nghiệm thực tế
              </span>
              <div className="flex flex-wrap gap-2">
                {['Đánh', 'Giá', 'Khách', 'Hàng'].map((word) => (
                  <span key={word} className="inline-block border-2 border-gray-800 rounded-lg px-3.5 py-1.5 text-3xl md:text-4xl lg:text-5xl font-playfair font-semibold text-gray-900 tracking-tight">
                    {word}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-gray-300 mb-10" />

          {/* Testimonial cards */}
          <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-gray-300">
            {testimonials.map((item, idx) => (
              <div
                key={item.id}
                className={`group p-7 md:p-8 bg-white ${idx > 0 ? 'md:border-l border-gray-300' : ''} max-md:border-t max-md:first:border-t-0 border-gray-300 hover:bg-gray-50 transition-colors duration-300`}
              >
                {/* User info */}
                <div className="flex items-center gap-4">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-12 h-12 rounded-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                    loading="lazy"
                  />
                  <div className="flex-1">
                    <p className="font-playfair font-semibold text-gray-900">{item.name}</p>
                    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-gray-400 mt-0.5">{item.address}</p>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-200 my-5" />

                {/* Stars */}
                <div className="flex items-center gap-0.5 mb-4">
                  {renderStars(item.rating)}
                </div>

                {/* Review */}
                <p className="text-sm leading-relaxed text-gray-500 font-light">
                  &ldquo;{item.review}&rdquo;
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="border-b border-gray-300" />
    </section>
  )
}

export default Testimonial
