import React, { useState, useEffect, useRef, useLayoutEffect } from 'react'
import useScrollReveal from '../hooks/useScrollReveal'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/* ── Animated counter ── */
function useCountUp(target, duration = 2000, start = false) {
    const [count, setCount] = useState(0)
    useEffect(() => {
        if (!start) return
        let raf
        const t0 = performance.now()
        const tick = (now) => {
            const progress = Math.min((now - t0) / duration, 1)
            const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)
            setCount(Math.round(eased * target))
            if (progress < 1) raf = requestAnimationFrame(tick)
        }
        raf = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(raf)
    }, [target, duration, start])
    return count
}

/* ── Circle arrow button (Drake style) ── */
const CircleArrow = ({ className = '' }) => (
    <span className={`inline-flex items-center justify-center w-10 h-10 rounded-full border border-current transition-all duration-300 group-hover:bg-gray-900 group-hover:text-white group-hover:border-gray-900 ${className}`}>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
    </span>
)

/* ── Feature data ── */
const features = [
    {
        number: '01',
        title: 'Đặt Phòng An Toàn',
        description: 'Thanh toán mã hoá SSL 256-bit, bảo vệ bởi hệ thống bảo mật đạt chuẩn quốc tế PCI DSS. Mọi giao dịch được giám sát 24/7.',
        tag: 'BẢO MẬT',
    },
    {
        number: '02',
        title: 'Xác Nhận Tức Thì',
        description: 'Nhận xác nhận đặt phòng chỉ trong vài giây qua email và SMS. Không cần chờ đợi phản hồi thủ công.',
        tag: 'TỐC ĐỘ',
    },
    {
        number: '03',
        title: 'Cam Kết Giá Tốt Nhất',
        description: 'Đảm bảo giá tốt nhất thị trường. Hoàn 200% chênh lệch nếu bạn tìm được giá thấp hơn ở bất kỳ đâu.',
        tag: 'CAM KẾT',
    },
    {
        number: '04',
        title: 'Hỗ Trợ 24/7',
        description: 'Đội ngũ chuyên gia du lịch sẵn sàng hỗ trợ bạn mọi lúc, mọi nơi bằng Tiếng Việt, English và 中文.',
        tag: 'CHĂM SÓC',
    },
]

const WhyChooseUs = () => {
    const sectionRef = useScrollReveal()
    const statsRef = useRef(null)
    const videoWrapperRef = useRef(null)
    const contentRef = useRef(null)
    const [statsVisible, setStatsVisible] = useState(false)

    useEffect(() => {
        const el = statsRef.current
        if (!el) return
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) { setStatsVisible(true); observer.disconnect() } },
            { threshold: 0.3 }
        )
        observer.observe(el)
        return () => observer.disconnect()
    }, [])

    useLayoutEffect(() => {
        let ctx = gsap.context(() => {
            gsap.fromTo(contentRef.current, {
                y: 80
            }, {
                y: -40,
                ease: "none",
                scrollTrigger: {
                    trigger: videoWrapperRef.current,
                    start: "top bottom",
                    end: "bottom top",
                    scrub: 1.5
                }
            });
        });
        return () => ctx.revert();
    }, []);

    const stat1 = useCountUp(500, 2200, statsVisible)
    const stat2 = useCountUp(50, 2200, statsVisible)
    const stat3 = useCountUp(10000, 2200, statsVisible)
    const stat4 = useCountUp(98, 2200, statsVisible)

    return (
        <section ref={sectionRef} className="relative overflow-hidden">

            {/* ═══════════════════════════════════════════════
          PART 1 — Full-width image banner with stats
          ═══════════════════════════════════════════════ */}
            <div ref={videoWrapperRef} className="relative overflow-hidden h-full min-h-[500px]">
                <div data-scroll data-scroll-speed="-0.3" className="absolute inset-0 w-full h-[120%] -top-[10%]">
                    <video
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                    >
                        <source src="/videos/drake-hotel-toronto.mp4" type="video/mp4" />
                    </video>
                </div>
                <div className="absolute inset-0 bg-black/65 z-0" />

                <div ref={statsRef} className="relative z-10 px-6 md:px-16 lg:px-24 xl:px-32 py-20 md:py-28 h-full flex flex-col justify-center">
                    <div ref={contentRef} className="max-w-6xl mx-auto w-full">

                        {/* Drake-style boxed title */}
                        <div className="reveal flex flex-wrap gap-2.5 mb-14">
                            {['Tại', 'Sao', 'Chọn'].map((word) => (
                                <span key={word} className="inline-block border-2 border-white/60 rounded-lg px-4 py-2 text-4xl md:text-6xl lg:text-7xl font-playfair font-semibold text-white tracking-tight">
                                    {word}
                                </span>
                            ))}
                            <span className="inline-block bg-white rounded-lg px-4 py-2 text-4xl md:text-6xl lg:text-7xl font-playfair font-semibold text-gray-900 tracking-tight">
                                QuickStay
                            </span>
                        </div>

                        {/* Stats row — thin dividers between */}
                        <div className="reveal reveal-delay-2 grid grid-cols-2 md:grid-cols-4">
                            {[
                                { value: stat1, suffix: '+', label: 'KHÁCH SẠN ĐỐI TÁC' },
                                { value: stat2, suffix: '+', label: 'THÀNH PHỐ' },
                                { value: stat3.toLocaleString('vi-VN'), suffix: '+', label: 'ĐÁNH GIÁ 5 SAO' },
                                { value: stat4, suffix: '%', label: 'KHÁCH HÀNG HÀI LÒNG' },
                            ].map((stat, i) => (
                                <div key={stat.label} className={`py-6 md:py-0 md:px-8 text-center ${i > 0 ? 'border-l border-white/20' : ''} ${i < 2 ? 'max-md:border-b max-md:border-white/20' : ''}`}>
                                    <p className="text-3xl md:text-4xl lg:text-5xl font-bold text-white tracking-tight font-playfair">
                                        {stat.value}<span className="text-blue-300">{stat.suffix}</span>
                                    </p>
                                    <p className="mt-2 text-[10px] md:text-xs text-white/50 font-mono tracking-[0.2em] uppercase">
                                        {stat.label}
                                    </p>
                                </div>
                            ))}
                        </div>

                        {/* Award badges (Drake-style dark pills) */}
                        <div className="reveal reveal-delay-3 flex flex-wrap gap-3 mt-12">
                            <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/15 rounded-full px-4 py-2 text-xs text-white/80 font-mono uppercase tracking-wider">
                                <svg className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14 2 9.27l6.91-1.01z" />
                                </svg>
                                Top Booking Platform 2025
                            </span>
                            <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/15 rounded-full px-4 py-2 text-xs text-white/80 font-mono uppercase tracking-wider">
                                <svg className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14 2 9.27l6.91-1.01z" />
                                </svg>
                                Traveler's Choice Award
                            </span>
                        </div>

                    </div>
                </div>
            </div>

            {/* ═══════════════════════════════════════════════
          PART 2 — Editorial feature grid (Drake-inspired)
          ═══════════════════════════════════════════════ */}
            <div className="relative bg-[#f5f3ef] py-0 z-20">
                <div className="max-w-6xl mx-auto px-6 md:px-16 lg:px-24 xl:px-0">

                    {/* Top thin line */}
                    <div className="border-t border-gray-300" />

                    {features.map((feat, idx) => {
                        const isLast = idx === features.length - 1
                        return (
                            <div
                                key={feat.number}
                                className={`reveal reveal-delay-${Math.min(idx + 1, 4)} group grid grid-cols-1 md:grid-cols-12 ${!isLast ? 'border-b border-gray-300' : 'border-b border-gray-300'}`}
                            >
                                {/* Number column */}
                                <div className="md:col-span-1 flex items-start md:items-center justify-start md:justify-center py-8 md:py-12 md:border-r border-gray-300">
                                    <span className="text-sm font-mono text-gray-400 tracking-widest">{feat.number}</span>
                                </div>

                                {/* Tag column */}
                                <div className="hidden md:flex md:col-span-2 items-center justify-center py-12 md:border-r border-gray-300">
                                    <span className="text-[10px] font-mono text-gray-400 tracking-[0.25em] uppercase">
                                        {feat.tag}
                                    </span>
                                </div>

                                {/* Title — Drake "word-in-box" style */}
                                <div className="md:col-span-5 flex items-center py-4 md:py-12 px-0 md:px-8 md:border-r border-gray-300">
                                    <div className="flex flex-wrap gap-2">
                                        {feat.title.split(' ').map((word, wi) => (
                                            <span
                                                key={wi}
                                                className="inline-block border-2 border-gray-800 rounded-lg px-3.5 py-1.5 text-2xl md:text-3xl lg:text-4xl font-playfair font-semibold text-gray-900 tracking-tight transition-all duration-300 group-hover:bg-gray-900 group-hover:text-white group-hover:border-gray-900"
                                            >
                                                {word}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Description + arrow */}
                                <div className="md:col-span-4 flex flex-col justify-center py-6 md:py-12 px-0 md:px-8">
                                    {/* Mobile tag */}
                                    <span className="md:hidden text-[10px] font-mono text-gray-400 tracking-[0.25em] uppercase mb-3">
                                        {feat.tag}
                                    </span>
                                    <p className="text-sm leading-relaxed text-gray-500 font-light max-w-sm">
                                        {feat.description}
                                    </p>
                                    <div className="mt-5 flex items-center gap-3 text-gray-800 cursor-pointer">
                                        <span className="text-xs font-mono uppercase tracking-[0.15em] group-hover:tracking-[0.2em] transition-all duration-300">
                                            Tìm hiểu thêm
                                        </span>
                                        <CircleArrow />
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}

export default WhyChooseUs
