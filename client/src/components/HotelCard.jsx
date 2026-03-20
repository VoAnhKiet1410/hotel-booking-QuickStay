import React from 'react'
import { Link } from 'react-router-dom'
import { assets } from '../assets/assets'
import { motion } from 'framer-motion'

const MotionLink = motion.create(Link)

const HotelCard = ({ hotel, searchQuery = '' }) => {
  // Animation variant for staggered entrance
  const cardVariant = {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 1, ease: [0.16, 1, 0.3, 1] }
    }
  }

  // Clip-path reveal for the image inside the card
  const imageReveal = {
    hidden: { clipPath: 'inset(100% 0 0 0)', scale: 1.15 },
    visible: {
      clipPath: 'inset(0% 0 0 0)',
      scale: 1,
      transition: { duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.1 }
    }
  }

  // Use minPrice from API (aggregated in getAllHotels)
  const minPrice = hotel.minPrice || 0

  const heroImage = hotel.images?.[0] || assets.heroImage

  return (
    <MotionLink
      variants={cardVariant}
      to={`/hotels/${hotel._id}${searchQuery}`}
      onClick={() => scrollTo(0, 0)}
      key={hotel._id}
      className="group w-full h-full flex flex-col bg-white border border-gray-300 overflow-hidden hover:-translate-y-1 transition-all duration-500 cursor-pointer"
    >
      {/* Image */}
      <div className="relative w-full h-56 md:h-64 overflow-hidden">
        <motion.div variants={imageReveal} className="w-full h-full">
          <img
            src={heroImage}
            alt={hotel.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        </motion.div>
        {/* Theme Badge */}
        <span className="absolute top-3 left-3 font-mono text-[9px] uppercase tracking-[0.15em] bg-white/90 backdrop-blur-sm px-3 py-1.5 text-gray-900 font-medium border border-gray-200">
          {hotel.theme}
        </span>
        {/* Wing Badge */}
        <span className="absolute top-3 right-3 font-mono text-[9px] uppercase tracking-[0.15em] bg-gray-900/80 backdrop-blur-sm px-3 py-1.5 text-white font-medium">
          {hotel.wing}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col p-5 md:p-6">
        {/* City label */}
        <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-gray-400 mb-2">
          {hotel.city}
        </span>

        <h3 className="font-playfair text-lg md:text-xl font-semibold text-gray-900 leading-snug group-hover:underline decoration-1 underline-offset-4">
          {hotel.name}
        </h3>

        {/* Rating + Address */}
        <div className="flex items-center gap-1.5 mt-2 text-sm text-gray-500">
          <img src={assets.starIconFilled} alt="star" className="w-3.5 h-3.5" />
          <span className="font-mono text-xs text-gray-600">{hotel.starRating || 4.5}</span>
          <span className="text-gray-300 mx-1">·</span>
          <span className="text-xs text-gray-400 truncate">{hotel.address}</span>
        </div>

        {/* Region Description (short) */}
        <p className="mt-3 text-xs text-gray-500 leading-relaxed line-clamp-2">
          {hotel.regionDescription}
        </p>

        {/* Bottom: price + CTA */}
        <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-200">
          <div>
            <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-gray-400 block mb-0.5">từ</span>
            <span className="text-lg font-bold text-gray-900">{minPrice > 0 ? `${minPrice.toLocaleString('vi-VN')}₫` : 'Liên hệ'}</span>
            <span className="text-xs text-gray-400 ml-1">/đêm</span>
          </div>
          {/* Circle arrow CTA */}
          <span className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-gray-800 text-gray-800 group-hover:bg-gray-900 group-hover:text-white group-hover:border-gray-900 transition-all duration-300">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </span>
        </div>
      </div>
    </MotionLink>
  )
}

export default HotelCard
