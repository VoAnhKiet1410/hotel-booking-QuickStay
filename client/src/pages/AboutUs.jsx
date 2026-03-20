import React, { useEffect, useRef, useLayoutEffect } from 'react';
import { assets } from '../assets/assets';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';

gsap.registerPlugin(ScrollTrigger);

// ─── Helper: staggered word reveal (must be outside component) ──────
const WordReveal = ({ text, delayOffset = 0, className = '' }) => {
    const words = text.split(' ');
    return (
        <span className={`inline-flex flex-wrap ${className}`}>
            {words.map((w, i) => (
                <span
                    key={i}
                    className="overflow-hidden inline-block mr-[0.22em] pb-[0.15em] -mb-[0.15em]"
                >
                    <motion.span
                        className="inline-block origin-bottom-left"
                        initial={{ opacity: 0, y: '100%', rotate: 1.5 }}
                        whileInView={{
                            opacity: 1,
                            y: '0%',
                            rotate: 0,
                            transition: {
                                delay: delayOffset + i * 0.06,
                                duration: 0.85,
                                ease: [0.16, 1, 0.3, 1],
                            },
                        }}
                        viewport={{ once: true, margin: '-50px' }}
                    >
                        {w}
                    </motion.span>
                </span>
            ))}
        </span>
    );
};

// ─── SVG Underline (wavy) decoration (must be outside component) ────
const SvgUnderline = ({ color = 'var(--drake-jade)', width = 220 }) => (
    <svg
        className="absolute -bottom-3 left-0 pointer-events-none"
        width={width}
        height="14"
        viewBox={`0 0 ${width} 14`}
        fill="none"
    >
        <motion.path
            d={`M2 8C${width * 0.07} 8 ${width * 0.1} 2 ${width * 0.2} 2C${width * 0.3} 2 ${width * 0.35} 12 ${width * 0.45} 12C${width * 0.55} 12 ${width * 0.6} 2 ${width * 0.7} 2C${width * 0.8} 2 ${width * 0.85} 12 ${width * 0.95} 12C${width * 1.02} 12 ${width} 8 ${width} 8`}
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.4, ease: 'easeInOut' }}
        />
    </svg>
);

/**
 * AboutUs — Trang giới thiệu QuickStay
 * Phong cách The Drake: boutique luxury, stagger word animations,
 * parallax images, SVG underline decorations.
 * Design tokens đồng bộ từ index.css (--drake-*)
 */
const AboutUs = () => {
    // ─── Reset scroll position ───
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // ─── Data ───────────────────────────────────────────────────
    const timeline = [
        {
            year: '2022',
            tag: 'Khai trương',
            title: 'QuickStay Hà Nội',
            desc: 'Khách sạn boutique đầu tiên của chuỗi, nằm trong lòng phố cổ Hà Nội. Nhanh chóng trở thành biểu tượng của sự kết hợp giữa di sản văn hóa và tiện nghi hiện đại.',
            image: assets.about_timeline_1,
            link: '/rooms',
        },
        {
            year: '2024',
            tag: 'Mở rộng',
            title: 'QuickStay Đà Nẵng',
            desc: 'Resort boutique bên bờ biển, mang phong cách đến miền Trung với góc nhìn mới về hospitality sáng tạo — nơi biển, gió và nghệ thuật hoà quyện.',
            image: assets.about_timeline_2,
            link: '/rooms',
        },
        {
            year: '2026',
            tag: 'Phát triển',
            title: 'QuickStay Sài Gòn',
            desc: 'Tái định nghĩa khái niệm khách sạn đô thị với phong cách boutique hiện đại. Trái tim nhịp đập của thành phố không ngủ — đậm chất QuickStay.',
            image: assets.about_timeline_3,
            link: '/rooms',
        },
    ];

    const ethos = [
        {
            num: '01',
            title: 'Hospitality',
            text: 'Chúng tôi mang đến những trải nghiệm tinh tế, cá nhân hóa — khiến mỗi vị khách cảm thấy thực sự đặc biệt và được chào đón như người bạn cũ trở về.',
        },
        {
            num: '02',
            title: 'Community',
            text: 'Tại QuickStay, chúng tôi là đội ngũ đam mê văn hóa, thăng hoa dựa trên những kết nối thực sự — với nhau, với khách hàng và các nhà sáng tạo địa phương.',
        },
        {
            num: '03',
            title: 'Expression',
            text: 'Nghệ thuật, âm nhạc, thiết kế và ẩm thực là DNA cốt lõi của chúng tôi. Mọi chi tiết, dù nhỏ nhất, đều được đo lường để mang lại niềm vui.',
        },
    ];

    const drives = [
        {
            title: 'Kết Nối\nCộng Đồng',
            desc: 'Bắt rễ từ những cộng đồng độc đáo, không gian của chúng tôi phản ánh tinh thần và sự sáng tạo của từng điểm đến.',
            cta: 'Khám phá',
            image: assets.exp_dining,
        },
        {
            title: 'Nghệ Thuật\nĐón Tiếp',
            desc: 'Từ thiết kế chu đáo đến dịch vụ ấm áp trực giác, những mảnh ghép nhỏ kết nối nên trải nghiệm trọn vẹn.',
            cta: 'Tìm hiểu',
            image: assets.exp_spa,
        },
        {
            title: 'Kiến Tạo\nVăn Hóa',
            desc: 'Không chỉ là người đón tiếp, chúng tôi song hành cùng văn hóa. Nghệ thuật và âm nhạc hoà quyện đa chiều.',
            cta: 'Tìm hiểu',
            image: assets.exp_nature,
        },
        {
            title: 'Phát Triển\nBền Vững',
            desc: 'Cam kết bảo vệ môi trường qua những sáng kiến xanh trong vận hành ẩm thực và lưu trú.',
            cta: 'Tìm hiểu',
            image: assets.exp_culture,
        },
    ];

    const marqueeWords = 'HOSPITALITY • COMMUNITY • EXPRESSION • CULTURE • CREATIVITY • CONNECTION • ';

    // ─── Refs ───────────────────────────────────────────────────
    const progressBarRef = useRef(null);

    // ─── GSAP Scroll Effects ─────────────────────────────────────
    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
            // Scroll progress bar
            gsap.to(progressBarRef.current, {
                scaleX: 1,
                ease: 'none',
                scrollTrigger: {
                    trigger: document.documentElement,
                    start: 'top top',
                    end: 'bottom bottom',
                    scrub: 0.1,
                },
            });

            // Parallax images
            document.querySelectorAll('.js-parallax-img').forEach((img) => {
                gsap.fromTo(
                    img,
                    { yPercent: -8 },
                    {
                        yPercent: 8,
                        ease: 'none',
                        scrollTrigger: {
                            trigger: img.closest('.js-parallax-wrap') || img.parentElement,
                            start: 'top bottom',
                            end: 'bottom top',
                            scrub: true,
                        },
                    }
                );
            });

            // Line draw animations
            document.querySelectorAll('.js-line-draw').forEach((line) => {
                gsap.fromTo(
                    line,
                    { scaleX: 0 },
                    {
                        scaleX: 1,
                        duration: 1.5,
                        ease: 'power3.inOut',
                        scrollTrigger: { trigger: line, start: 'top 90%', once: true },
                    }
                );
            });
        });
        return () => ctx.revert();
    }, []);

    // ─── Framer Motion Variants ──────────────────────────────────
    const fadeUp = {
        hidden: { opacity: 0, y: 36 },
        visible: (i = 0) => ({
            opacity: 1,
            y: 0,
            transition: { delay: i * 0.1, duration: 0.9, ease: [0.16, 1, 0.3, 1] },
        }),
    };

    const stagger = {
        hidden: {},
        visible: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
    };

    const maskReveal = {
        hidden: { clipPath: 'inset(100% 0 0 0)' },
        visible: {
            clipPath: 'inset(0% 0 0 0)',
            transition: { duration: 1.3, ease: [0.16, 1, 0.3, 1] },
        },
    };



    // ────────────────────────────────────────────────────────────
    //  RENDER
    // ────────────────────────────────────────────────────────────
    return (
        <div
            className="text-[var(--drake-black)] overflow-x-hidden"
            style={{ fontFamily: "'Inter', 'Be Vietnam Pro', sans-serif" }}
        >
            {/* ── Scroll Progress Bar ── */}
            <div
                ref={progressBarRef}
                className="fixed top-0 left-0 right-0 h-[3px] z-[100] origin-left"
                style={{ transform: 'scaleX(0)', backgroundColor: 'var(--drake-coral)' }}
            />

            {/* ══════════════════════════════════════════
                1. HERO — fullscreen cinematic
            ══════════════════════════════════════════ */}
            <section className="relative w-full h-screen min-h-[640px] overflow-hidden">
                {/* Background image with entrance scale */}
                <motion.div
                    className="absolute inset-0 js-parallax-wrap overflow-hidden"
                    initial={{ scale: 1.08 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 1.8, ease: 'easeOut' }}
                >
                    <img
                        src={assets.about_hero}
                        alt="QuickStay hero"
                        className="w-full h-[115%] object-cover object-center js-parallax-img"
                    />
                </motion.div>

                {/* Dark gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-[rgba(61,31,45,0.55)] via-transparent to-[rgba(26,26,26,0.75)]" />

                {/* Hero content */}
                <div className="relative z-10 flex flex-col items-center justify-center h-full text-center text-white px-6 pb-28">
                    {/* Pre-heading label */}
                    <div className="overflow-hidden mb-10">
                        <motion.span
                            className="block text-[10px] sm:text-[11px] tracking-[0.45em] uppercase"
                            style={{ color: 'var(--drake-cream)', fontFamily: "'Inter', sans-serif" }}
                            initial={{ y: '110%' }}
                            animate={{ y: '0%' }}
                            transition={{ delay: 0.5, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        >
                            Câu chuyện của chúng tôi
                        </motion.span>
                    </div>

                    {/* Main heading — stagger words */}
                    <h1
                        className="tracking-[-0.03em] leading-[0.92]"
                        style={{
                            fontFamily: "'Playfair Display', Georgia, serif",
                            fontWeight: 400,
                            fontSize: 'clamp(3.8rem, 10vw, 9rem)',
                        }}
                    >
                        <WordReveal text="Welcome" delayOffset={0.6} />
                        <span className="flex items-center justify-center gap-[0.15em] -mt-1 sm:-mt-3">
                            <motion.span
                                className="italic opacity-85 lowercase"
                                style={{ color: 'var(--drake-cream)' }}
                                initial={{ opacity: 0, scale: 0.93, rotate: -2 }}
                                animate={{ opacity: 0.85, scale: 1, rotate: 0 }}
                                transition={{ delay: 1, duration: 0.9, ease: 'easeOut' }}
                            >
                                to our
                            </motion.span>
                            <WordReveal text="Story" delayOffset={0.75} />
                        </span>
                    </h1>

                    {/* Subheading */}
                    <motion.p
                        className="mt-10 max-w-md text-white/75 leading-[1.85]"
                        style={{
                            fontFamily: "'Inter', sans-serif",
                            fontSize: 'clamp(0.9rem, 1.2vw, 1.05rem)',
                            fontWeight: 300,
                        }}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.2, duration: 0.9 }}
                    >
                        Gắn kết văn hóa và cộng đồng trong một không gian trải nghiệm đích thực.
                        Nơi từng chi tiết nhỏ đều mang một câu chuyện.
                    </motion.p>
                </div>

                {/* Scroll indicator */}
                <motion.div
                    className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.6, duration: 1.2 }}
                >
                    <span
                        className="text-[9px] tracking-[0.4em] uppercase text-white/45"
                        style={{ fontFamily: "'Inter', sans-serif" }}
                    >
                        Scroll
                    </span>
                    <div className="w-px h-14 bg-white/20 overflow-hidden relative">
                        <div
                            className="w-full h-1/2 bg-[var(--drake-coral)]"
                            style={{ animation: 'scrollLine 2.5s ease-in-out infinite' }}
                        />
                    </div>
                </motion.div>
            </section>

            {/* ══════════════════════════════════════════
                2. INTRO — editorial paragraph
            ══════════════════════════════════════════ */}
            <section className="py-24 md:py-36" style={{ backgroundColor: 'var(--drake-cream)' }}>
                <div className="max-w-3xl mx-auto px-6">
                    <motion.p
                        className="text-center leading-[1.9]"
                        style={{
                            fontFamily: "'Inter', sans-serif",
                            fontSize: 'clamp(1.05rem, 1.8vw, 1.35rem)',
                            fontWeight: 300,
                            color: '#555',
                        }}
                        variants={fadeUp}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: '-100px' }}
                    >
                        QuickStay tự hào với triết lý{' '}
                        <em
                            className="not-italic font-normal"
                            style={{ color: 'var(--drake-wine)' }}
                        >
                            ưu tiên trải nghiệm
                        </em>
                        , tạo ra những không gian boutique độc đáo. Chúng tôi tôn vinh cái đẹp
                        của sự bản địa, kết nối tinh tế giữa di sản và đường nét hiện đại — để
                        biến mỗi lưu trú thành kỷ niệm khó phai.
                    </motion.p>
                </div>
            </section>

            {/* ══════════════════════════════════════════
                3. TIMELINE HIGHLIGHTS
            ══════════════════════════════════════════ */}
            <section className="py-20 md:py-32 bg-white">
                <div className="max-w-6xl mx-auto px-6">

                    {/* Section heading */}
                    <div className="text-center mb-28 md:mb-44">
                        <div className="relative inline-block">
                            <h2
                                className="tracking-[-0.02em] whitespace-nowrap"
                                style={{
                                    fontFamily: "'Playfair Display', Georgia, serif",
                                    fontWeight: 400,
                                    fontSize: 'clamp(2.4rem, 5vw, 4.2rem)',
                                    lineHeight: 1.1,
                                }}
                            >
                                Timeline{' '}
                                <span
                                    className="italic"
                                    style={{ color: 'var(--drake-wine)' }}
                                >
                                    Highlights
                                </span>
                            </h2>
                            <SvgUnderline color="var(--drake-jade)" width={260} />
                        </div>
                    </div>

                    {/* Timeline items */}
                    <div className="flex flex-col gap-28 md:gap-44">
                        {timeline.map((item, idx) => (
                            <div
                                key={item.year}
                                className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center"
                            >
                                {/* — Image — */}
                                <motion.div
                                    className={`relative js-parallax-wrap overflow-hidden ${idx % 2 !== 0 ? 'lg:order-2' : ''}`}
                                    style={{ aspectRatio: '4/5' }}
                                    variants={maskReveal}
                                    initial="hidden"
                                    whileInView="visible"
                                    viewport={{ once: true, margin: '-80px' }}
                                >
                                    {/* Subtle background fill */}
                                    <div
                                        className="absolute inset-0 -z-10"
                                        style={{ backgroundColor: 'var(--drake-cream)' }}
                                    />
                                    <img
                                        src={item.image}
                                        alt={item.title}
                                        className="absolute inset-x-0 -top-[10%] w-full h-[120%] object-cover js-parallax-img transition-transform duration-[1.6s] hover:scale-[1.03]"
                                        loading="lazy"
                                    />
                                </motion.div>

                                {/* — Text — */}
                                <motion.div
                                    className={`flex flex-col ${idx % 2 !== 0 ? 'lg:order-1' : ''}`}
                                    variants={fadeUp}
                                    initial="hidden"
                                    whileInView="visible"
                                    viewport={{ once: true, margin: '-80px' }}
                                >
                                    {/* Doodle icon */}
                                    <svg
                                        className="w-7 h-7 mb-8 opacity-30"
                                        style={{ color: 'var(--drake-wine)' }}
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1"
                                    >
                                        <path
                                            d="M12 2L15 9L22 12L15 15L12 22L9 15L2 12L9 9L12 2Z"
                                            strokeLinejoin="round"
                                        />
                                    </svg>

                                    {/* Year badge */}
                                    <div className="flex items-center gap-3 mb-5">
                                        <span
                                            className="text-[10px] tracking-[0.28em] font-medium px-2 py-1"
                                            style={{
                                                color: 'var(--drake-wine)',
                                                backgroundColor: 'var(--drake-cream)',
                                                fontFamily: "'Inter', sans-serif",
                                            }}
                                        >
                                            {item.year}
                                        </span>
                                        <span
                                            className="text-[10px] tracking-[0.18em] uppercase opacity-50"
                                            style={{ fontFamily: "'Inter', sans-serif" }}
                                        >
                                            {item.tag}
                                        </span>
                                    </div>

                                    {/* Title */}
                                    <h3
                                        className="mb-7 tracking-tight"
                                        style={{
                                            fontFamily: "'Playfair Display', Georgia, serif",
                                            fontWeight: 400,
                                            fontSize: 'clamp(1.9rem, 3.2vw, 2.9rem)',
                                            lineHeight: 1.1,
                                        }}
                                    >
                                        {item.title}
                                    </h3>

                                    {/* Divider */}
                                    <div
                                        className="w-16 h-px mb-7 js-line-draw origin-left"
                                        style={{ backgroundColor: 'var(--drake-wine)', opacity: 0.25 }}
                                    />

                                    {/* Description */}
                                    <p
                                        className="leading-[1.85] mb-10 max-w-sm"
                                        style={{
                                            fontFamily: "'Inter', sans-serif",
                                            fontSize: '0.9375rem',
                                            fontWeight: 300,
                                            color: '#666',
                                        }}
                                    >
                                        {item.desc}
                                    </p>

                                    {/* CTA */}
                                    <a
                                        href={item.link}
                                        className="inline-flex items-center gap-3 self-start group"
                                        style={{
                                            fontFamily: "'Inter', sans-serif",
                                            fontSize: '10px',
                                            letterSpacing: '0.22em',
                                            fontWeight: 600,
                                            textTransform: 'uppercase',
                                            color: 'var(--drake-wine)',
                                            borderBottom: '1px solid var(--drake-wine)',
                                            paddingBottom: '6px',
                                            transition: 'color 0.3s, border-color 0.3s',
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.color = 'var(--drake-coral)';
                                            e.currentTarget.style.borderColor = 'var(--drake-coral)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.color = 'var(--drake-wine)';
                                            e.currentTarget.style.borderColor = 'var(--drake-wine)';
                                        }}
                                    >
                                        <span>Khám phá</span>
                                        <span style={{ transition: 'transform 0.3s' }}
                                            className="group-hover:translate-x-1">→</span>
                                    </a>
                                </motion.div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ══════════════════════════════════════════
                4. SECTION BREAK — full-width image
            ══════════════════════════════════════════ */}
            <section className="relative h-[50vh] md:h-[60vh] overflow-hidden js-parallax-wrap">
                <img
                    src={assets.about_section_break}
                    alt="QuickStay section break"
                    className="w-full h-[120%] object-cover object-center js-parallax-img"
                    loading="lazy"
                />
                <div
                    className="absolute inset-0"
                    style={{
                        background:
                            'linear-gradient(to bottom, rgba(61,31,45,0.3) 0%, rgba(26,26,26,0.45) 100%)',
                    }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                    <motion.h2
                        className="text-white text-center tracking-[0.25em] uppercase"
                        style={{
                            fontFamily: "'Inter', sans-serif",
                            fontSize: 'clamp(0.65rem, 1.2vw, 0.875rem)',
                            fontWeight: 500,
                            letterSpacing: '0.4em',
                        }}
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.2 }}
                    >
                        Boutique · Bản địa · Đích thực
                    </motion.h2>
                </div>
            </section>

            {/* ══════════════════════════════════════════
                5. OUR ETHOS
            ══════════════════════════════════════════ */}
            <section
                className="py-24 md:py-36 border-y"
                style={{
                    backgroundColor: 'var(--drake-cream)',
                    borderColor: 'rgba(61,31,45,0.1)',
                }}
            >
                <div className="max-w-6xl mx-auto px-6">
                    {/* Heading row */}
                    <div className="mb-20 grid grid-cols-1 md:grid-cols-2 gap-10 items-end">
                        <h2
                            className="tracking-tight"
                            style={{
                                fontFamily: "'Playfair Display', Georgia, serif",
                                fontWeight: 400,
                                fontSize: 'clamp(2.5rem, 5vw, 4.5rem)',
                                lineHeight: 1.05,
                            }}
                        >
                            <WordReveal text="Our " />
                            <span
                                className="italic"
                                style={{ color: 'var(--drake-coral)' }}
                            >
                                Ethos
                            </span>
                        </h2>
                        <motion.p
                            className="max-w-xs leading-[1.9] opacity-65"
                            style={{
                                fontFamily: "'Inter', sans-serif",
                                fontSize: '0.9375rem',
                                fontWeight: 300,
                                color: 'var(--drake-black)',
                            }}
                            variants={fadeUp}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                        >
                            Không chỉ là điểm đến, QuickStay là một phong cách sống — đặt con người vào trung tâm mọi quyết định.
                        </motion.p>
                    </div>

                    {/* Ethos items */}
                    <div
                        className="border-t pt-16"
                        style={{ borderColor: 'rgba(26,26,26,0.12)' }}
                    >
                        <motion.div
                            className="grid grid-cols-1 md:grid-cols-3 gap-0 items-start"
                            variants={stagger}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: '-50px' }}
                        >
                            {ethos.map((item, idx) => (
                                <motion.div
                                    key={idx}
                                    variants={fadeUp}
                                    className={`group ${idx === 0 ? 'pr-10' : idx === ethos.length - 1 ? 'pl-10' : 'px-10'} pt-8 pb-10 md:border-r last:border-r-0`}
                                    style={{ borderColor: 'rgba(26,26,26,0.1)' }}
                                >
                                    {/* Number */}
                                    <span
                                        className="block mb-6 opacity-25 group-hover:opacity-60 transition-opacity duration-300"
                                        style={{
                                            fontFamily: "'Playfair Display', Georgia, serif",
                                            fontSize: '2.5rem',
                                            fontWeight: 400,
                                            lineHeight: 1,
                                            color: 'var(--drake-wine)',
                                        }}
                                    >
                                        {item.num}
                                    </span>

                                    {/* Title */}
                                    <h3
                                        className="mb-5 pb-4 transition-colors duration-300"
                                        style={{
                                            fontFamily: "'Playfair Display', Georgia, serif",
                                            fontWeight: 400,
                                            fontSize: '1.45rem',
                                            borderBottom: '1px solid rgba(26,26,26,0.1)',
                                        }}
                                    >
                                        {item.title}
                                    </h3>

                                    {/* Body */}
                                    <p
                                        className="leading-[1.85] opacity-65 group-hover:opacity-90 transition-opacity duration-300"
                                        style={{
                                            fontFamily: "'Inter', sans-serif",
                                            fontSize: '0.9rem',
                                            fontWeight: 300,
                                            color: 'var(--drake-black)',
                                        }}
                                    >
                                        {item.text}
                                    </p>
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ══════════════════════════════════════════
                6. WHAT DRIVES US — dark wine section
            ══════════════════════════════════════════ */}
            <section
                className="py-24 md:py-36"
                style={{ backgroundColor: 'var(--drake-wine)', color: 'var(--drake-cream)' }}
            >
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-16 lg:gap-24">

                        {/* Left — sticky title */}
                        <div className="lg:sticky lg:top-28 lg:self-start">
                            {/* Decorative SVG */}
                            <svg
                                className="w-16 h-16 mb-10 opacity-80"
                                style={{ color: 'var(--drake-coral)' }}
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="0.6"
                            >
                                <circle cx="12" cy="12" r="10" />
                                <circle cx="12" cy="12" r="6" />
                                <circle cx="12" cy="12" r="2" />
                            </svg>

                            <h2
                                className="tracking-tight leading-[1.05] relative inline-block"
                                style={{
                                    fontFamily: "'Playfair Display', Georgia, serif",
                                    fontSize: 'clamp(2.8rem, 5vw, 4.5rem)',
                                }}
                            >
                                What
                                <br />
                                <span
                                    className="italic font-light pr-2"
                                    style={{ color: 'var(--drake-coral)' }}
                                >
                                    Drives
                                </span>
                                Us
                            </h2>

                            <p
                                className="mt-10 leading-[1.85] max-w-[260px] opacity-55"
                                style={{
                                    fontFamily: "'Inter', sans-serif",
                                    fontSize: '0.875rem',
                                    fontWeight: 300,
                                }}
                            >
                                QuickStay theo đuổi sự trọn vẹn trong từng khía cạnh. Chúng tôi tôn trọng tính nhân văn trong kinh doanh khách sạn.
                            </p>
                        </div>

                        {/* Right — drives list */}
                        <div className="flex flex-col">
                            {drives.map((item, idx) => (
                                <motion.div
                                    key={idx}
                                    className="group py-12 md:py-14"
                                    style={{ borderTop: '1px solid rgba(245,240,232,0.12)' }}
                                    variants={fadeUp}
                                    initial="hidden"
                                    whileInView="visible"
                                    viewport={{ once: true, margin: '-50px' }}
                                >
                                    {/* 3-column Drake layout */}
                                    <div className="grid grid-cols-1 md:grid-cols-[160px_220px_1fr] gap-8 md:gap-12 items-start">

                                        {/* Title */}
                                        <h3
                                            className="whitespace-pre-line tracking-tight mt-1"
                                            style={{
                                                fontFamily: "'Playfair Display', Georgia, serif",
                                                fontSize: 'clamp(1.4rem, 2.2vw, 1.85rem)',
                                                lineHeight: 1.15,
                                                color: 'var(--drake-cream)',
                                            }}
                                        >
                                            {item.title}
                                        </h3>

                                        {/* Image */}
                                        <div className="overflow-hidden aspect-[4/3]">
                                            <img
                                                src={item.image}
                                                alt={item.title}
                                                className="w-full h-full object-cover opacity-75 group-hover:opacity-100 group-hover:scale-[1.06] transition-all duration-[1.5s]"
                                                loading="lazy"
                                            />
                                        </div>

                                        {/* Text + CTA */}
                                        <div className="flex flex-col gap-5 mt-1">
                                            <p
                                                className="leading-[1.85] opacity-60"
                                                style={{
                                                    fontFamily: "'Inter', sans-serif",
                                                    fontSize: '0.875rem',
                                                    fontWeight: 300,
                                                }}
                                            >
                                                {item.desc}
                                            </p>
                                            <a
                                                href="#"
                                                className="inline-flex items-center gap-2 group-hover:gap-4 transition-all duration-300 uppercase"
                                                style={{
                                                    fontFamily: "'Inter', sans-serif",
                                                    fontSize: '10px',
                                                    letterSpacing: '0.22em',
                                                    fontWeight: 500,
                                                    color: 'var(--drake-coral)',
                                                }}
                                            >
                                                <span>{item.cta}</span>
                                                <span>→</span>
                                            </a>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                            {/* Bottom border */}
                            <div style={{ borderTop: '1px solid rgba(245,240,232,0.12)' }} />
                        </div>
                    </div>
                </div>
            </section>

            {/* ══════════════════════════════════════════
                7. MARQUEE — kinetic footer strip
            ══════════════════════════════════════════ */}
            <section
                className="overflow-hidden py-14 border-t"
                style={{
                    backgroundColor: 'var(--drake-wine)',
                    borderColor: 'rgba(245,240,232,0.06)',
                    color: 'var(--drake-cream)',
                }}
            >
                <div className="marquee-container">
                    <div className="marquee-track">
                        {[0, 1].map((i) => (
                            <span
                                key={i}
                                className="marquee-text font-light tracking-widest opacity-10"
                                style={{
                                    fontFamily: "'Playfair Display', Georgia, serif",
                                    fontSize: 'clamp(2.8rem, 6vw, 6rem)',
                                }}
                                aria-hidden={i > 0}
                            >
                                {marqueeWords}
                                {marqueeWords}
                            </span>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default AboutUs;
