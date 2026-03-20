import React from 'react'
import { Link } from 'react-router-dom'
import { assets } from '../assets/assets'

/**
 * Footer component — inspired by The Drake Hotel
 * Dark editorial luxury footer with location columns, nav links,
 * newsletter subscribe, social icons, and copyright bar.
 */
const Footer = () => {
  const year = new Date().getFullYear()

  // Social links with inline SVG icons
  const socials = [
    {
      name: 'Facebook',
      href: '#',
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
          <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 7.108 7.108 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 1.896-.55 1.771h-2.983v7.98h-3.353Z" />
        </svg>
      ),
    },
    {
      name: 'Instagram',
      href: '#',
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
          <path d="M12 2c2.717 0 3.056.01 4.122.06 1.065.05 1.79.217 2.428.465.66.254 1.216.598 1.772 1.153a4.908 4.908 0 0 1 1.153 1.772c.247.637.415 1.363.465 2.428.047 1.066.06 1.405.06 4.122 0 2.717-.01 3.056-.06 4.122-.05 1.065-.218 1.79-.465 2.428a4.883 4.883 0 0 1-1.153 1.772 4.915 4.915 0 0 1-1.772 1.153c-.637.247-1.363.415-2.428.465-1.066.047-1.405.06-4.122.06-2.717 0-3.056-.01-4.122-.06-1.065-.05-1.79-.218-2.428-.465a4.89 4.89 0 0 1-1.772-1.153 4.904 4.904 0 0 1-1.153-1.772c-.248-.637-.415-1.363-.465-2.428C2.013 15.056 2 14.717 2 12c0-2.717.01-3.056.06-4.122.05-1.066.217-1.79.465-2.428a4.88 4.88 0 0 1 1.153-1.772A4.897 4.897 0 0 1 5.45 2.525c.638-.248 1.362-.415 2.428-.465C8.944 2.013 9.283 2 12 2Zm0 1.802c-2.67 0-2.986.01-4.04.058-.976.045-1.505.207-1.858.344-.466.182-.8.398-1.15.748-.35.35-.566.684-.748 1.15-.137.353-.3.882-.344 1.857-.048 1.055-.058 1.37-.058 4.041 0 2.67.01 2.986.058 4.04.045.977.207 1.505.344 1.858.182.466.399.8.748 1.15.35.35.684.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058 2.67 0 2.987-.01 4.04-.058.977-.045 1.505-.207 1.858-.344.466-.182.8-.399 1.15-.748.35-.35.566-.684.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041 0-2.67-.01-2.986-.058-4.04-.045-.977-.207-1.505-.344-1.858a3.097 3.097 0 0 0-.748-1.15 3.098 3.098 0 0 0-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.054-.048-1.37-.058-4.041-.058Zm0 3.063a5.135 5.135 0 1 1 0 10.27 5.135 5.135 0 0 1 0-10.27Zm0 8.468a3.333 3.333 0 1 0 0-6.666 3.333 3.333 0 0 0 0 6.666Zm6.538-8.671a1.2 1.2 0 1 1-2.4 0 1.2 1.2 0 0 1 2.4 0Z" />
        </svg>
      ),
    },
    {
      name: 'TikTok',
      href: '#',
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
          <path d="M16.6 5.82s.51.5 0 0A4.278 4.278 0 0 1 15.54 3h-3.09v12.4a2.592 2.592 0 0 1-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6 0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3s-1.88.09-3.24-1.48z" />
        </svg>
      ),
    },
    {
      name: 'LinkedIn',
      href: '#',
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      ),
    },
  ]

  return (
    <footer className="bg-[#111] text-white/60">
      {/* ─── Main footer body ─── */}
      <div className="px-6 md:px-16 lg:px-24 xl:px-32">
        <div className="mx-auto max-w-6xl py-16 lg:py-20">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">

            {/* ─── Col 1: Brand + Locations ─── */}
            <div>
              <Link to="/" className="inline-flex items-center">
                <img src={assets.logo} alt="QuickStay" className="h-9" style={{ filter: 'brightness(0) invert(1)' }} />
              </Link>

              {/* Locations — Drake-style grouped by region */}
              <div className="mt-8 space-y-5">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/25 mb-2">
                    Miền Nam
                  </p>
                  <Link to="/hotels" className="block text-white/70 hover:text-white transition-colors text-sm leading-relaxed">
                    QuickStay Sài Gòn
                  </Link>
                </div>
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/25 mb-2">
                    Miền Trung
                  </p>
                  <Link to="/hotels" className="block text-white/70 hover:text-white transition-colors text-sm leading-relaxed">
                    QuickStay Đà Nẵng
                  </Link>
                </div>
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/25 mb-2">
                    Miền Bắc
                  </p>
                  <Link to="/hotels" className="block text-white/70 hover:text-white transition-colors text-sm leading-relaxed">
                    QuickStay Hà Nội
                  </Link>
                </div>
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/25 mb-2">
                    Tây Nguyên
                  </p>
                  <Link to="/hotels" className="block text-white/70 hover:text-white transition-colors text-sm leading-relaxed">
                    QuickStay Đà Lạt
                  </Link>
                </div>
              </div>
            </div>

            {/* ─── Col 2: Nav Links ─── */}
            <div className="space-y-3 text-sm">
              <h3 className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/25 mb-5">
                Khám phá
              </h3>
              <Link to="/" className="block text-white/60 hover:text-white transition-colors">
                Trang chủ
              </Link>
              <Link to="/rooms" className="block text-white/60 hover:text-white transition-colors">
                Phòng & Suites
              </Link>
              <Link to="/hotels" className="block text-white/60 hover:text-white transition-colors">
                Khách sạn
              </Link>
              <a href="#" className="block text-white/60 hover:text-white transition-colors">
                Về chúng tôi
              </a>
              <a href="#" className="block text-white/60 hover:text-white transition-colors">
                Tuyển dụng
              </a>
              <a href="#" className="block text-white/60 hover:text-white transition-colors">
                Blog
              </a>
            </div>

            {/* ─── Col 3: Support Links ─── */}
            <div className="space-y-3 text-sm">
              <h3 className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/25 mb-5">
                Hỗ trợ
              </h3>
              <a href="#" className="block text-white/60 hover:text-white transition-colors">
                Liên hệ
              </a>
              <a href="#" className="block text-white/60 hover:text-white transition-colors">
                Câu hỏi thường gặp
              </a>
              <a href="#" className="block text-white/60 hover:text-white transition-colors">
                Chính sách hoàn tiền
              </a>
              <a href="#" className="block text-white/60 hover:text-white transition-colors">
                Điều khoản sử dụng
              </a>
              <a href="#" className="block text-white/60 hover:text-white transition-colors">
                Chính sách quyền riêng tư
              </a>
              <a href="#" className="block text-white/60 hover:text-white transition-colors">
                Đối tác khách sạn
              </a>
            </div>

            {/* ─── Col 4: Liên hệ + Social ─── */}
            <div className="space-y-4 text-sm">
              <h3 className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/25 mb-5">
                Kết nối
              </h3>
              <div className="space-y-3">
                <p className="text-white/60 font-light leading-relaxed">
                  <span className="block text-white/40 font-mono text-[10px] uppercase tracking-[0.2em] mb-1">Hotline</span>
                  0784123299
                </p>
                <p className="text-white/60 font-light leading-relaxed">
                  <span className="block text-white/40 font-mono text-[10px] uppercase tracking-[0.2em] mb-1">Email</span>
                  kietanhvo4@gmail.com
                </p>
              </div>

              {/* Social icons row */}
              <div className="flex items-center gap-3 pt-4">
                {socials.map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    aria-label={item.name}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-white/40 transition-all duration-300 hover:border-white/50 hover:text-white hover:bg-white/5"
                  >
                    {item.icon}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Copyright bar — Drake style: minimal, monospace ─── */}
      <div className="border-t border-white/10">
        <div className="px-6 md:px-16 lg:px-24 xl:px-32">
          <div className="mx-auto max-w-6xl py-5">
            <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
              <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/25">
                © {year} QuickStay. All rights reserved.
              </p>
              <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/25">
                Thiết kế hướng trải nghiệm.
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
