import React, { useEffect, useRef, useState } from 'react';
import { assets } from '../assets/assets';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/* ──────────────────────────────────────────────
   Data — Trải nghiệm theo 2 khu vực
   ────────────────────────────────────────────── */
const urbanExperiences = [
    {
        id: '01',
        title: 'Sense of\nSerenity',
        category: 'Spa & Wellness',
        image: assets.exp_spa_editorial,
        desc: 'Tìm lại sự cân bằng hoàn hảo giữa Thân – Tâm – Trí với các liệu trình spa độc quyền lấy cảm hứng từ thiên nhiên nhiệt đới Việt Nam.',
        location: 'Hà Nội',
    },
    {
        id: '02',
        title: 'Culinary\nArt',
        category: 'Fine Dining',
        image: assets.exp_dining_editorial,
        desc: 'Thăng hoa vị giác cùng những kiệt tác ẩm thực được thiết kế bởi các bếp trưởng đẳng cấp quốc tế, kết hợp tinh hoa ẩm thực Việt.',
        location: 'Hà Nội · Đà Nẵng',
    },
    {
        id: '03',
        title: 'Sky\nLounge',
        category: 'Rooftop Suite',
        image: assets.exp_rooftop_suite,
        desc: 'Trải nghiệm không gian cực kỳ sang trọng với tầm nhìn trọn vẹn đường chân trời thành phố từ những penthouse suite trên tầng thượng.',
        location: 'Sài Gòn',
    },
];

const countyExperiences = [
    {
        id: '04',
        title: 'Wilderness\nCalling',
        category: 'Nature Expedition',
        image: assets.exp_nature_editorial,
        desc: 'Thức tỉnh giác quan giữa thiên nhiên kỳ vĩ. Hành trình khám phá rừng sâu và những ngọn núi hùng vĩ nhất của Việt Nam.',
        location: 'Sapa · Đà Lạt',
    },
    {
        id: '05',
        title: 'Timeless\nHeritage',
        category: 'Culture & Arts',
        image: assets.exp_culture_editorial,
        desc: 'Chạm vào linh hồn của những di sản ngàn năm. Những câu chuyện lịch sử được kể lại qua lăng kính đương đại và nghệ thuật đương đại.',
        location: 'Huế · Hội An',
    },
    {
        id: '06',
        title: 'Lakeside\nRetreat',
        category: 'Country Escape',
        image: assets.exp_county_retreat,
        desc: 'Rời xa nhịp sống đô thị, đắm mình trong không gian yên bình bên mặt hồ thơ mộng với kiến trúc thân thiện thiên nhiên.',
        location: 'Đà Lạt · Phú Quốc',
    },
];

/* ──────────────────────────────────────────────
   Slide-out Drawer Component
   ────────────────────────────────────────────── */
const SlideDrawer = ({ isOpen, onClose, children }) => {
    const drawerRef = useRef(null);
    const overlayRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            gsap.to(overlayRef.current, { opacity: 1, duration: 0.3, ease: 'power2.out' });
            gsap.to(drawerRef.current, { x: 0, duration: 0.5, ease: 'power3.out' });
        } else {
            gsap.to(drawerRef.current, { x: '100%', duration: 0.4, ease: 'power3.in' });
            gsap.to(overlayRef.current, {
                opacity: 0, duration: 0.3, ease: 'power2.in',
                onComplete: () => { document.body.style.overflow = ''; }
            });
        }
    }, [isOpen]);

    return (
        <div className={`fixed inset-0 z-[60] ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
            {/* Overlay */}
            <div
                ref={overlayRef}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm opacity-0"
                onClick={onClose}
            />
            {/* Drawer Panel */}
            <div
                ref={drawerRef}
                className="absolute top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl translate-x-full overflow-y-auto"
            >
                <div className="p-8 md:p-12">
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-full border border-gray-300 hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-all cursor-pointer"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    {children}
                </div>
            </div>
        </div>
    );
};

/* ──────────────────────────────────────────────
   Location Picker Drawer Content
   ────────────────────────────────────────────── */
const LocationPicker = ({ onSelect }) => {
    const regions = [
        { name: 'Miền Bắc', cities: ['Hà Nội'] },
        { name: 'Miền Trung', cities: ['Đà Nẵng'] },
        { name: 'Miền Nam', cities: ['Sài Gòn', 'Đà Lạt'] },
    ];

    return (
        <div className="pt-8">
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-gray-400 block mb-2">Khám phá</span>
            <h3 className="text-3xl font-playfair font-bold text-gray-900 mb-10 leading-tight">
                Chọn Điểm Đến<br />Của Bạn
            </h3>
            {regions.map((region) => (
                <div key={region.name} className="mb-8">
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-3 block">{region.name}</span>
                    <div className="space-y-1">
                        {region.cities.map((city) => (
                            <button
                                key={city}
                                onClick={() => onSelect(city)}
                                className="group w-full flex items-center justify-between py-3 border-b border-gray-100 hover:border-gray-900 transition-colors cursor-pointer"
                            >
                                <span className="text-lg text-gray-800 group-hover:text-gray-900 transition-colors">{city}</span>
                                <span className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all">
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                    </svg>
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

/* ──────────────────────────────────────────────
   Experience Card — Editorial Asymmetric
   Rich scrub & parallax animations
   ────────────────────────────────────────────── */
const ExperienceCard = ({ exp, isReversed }) => {
    const cardRef = useRef(null);
    const imgRef = useRef(null);
    const imgWrapRef = useRef(null);
    const contentRef = useRef(null);
    const titleRef = useRef(null);
    const descRef = useRef(null);
    const ctaRef = useRef(null);
    const metaRef = useRef(null);

    useEffect(() => {
        const el = cardRef.current;
        if (!el) return;

        const triggers = [];

        // ── 1. Image parallax with scrub ── 
        // Different speeds for odd/even cards → depth perception
        if (imgRef.current) {
            const parallaxAmount = isReversed ? -15 : -12;
            const st = ScrollTrigger.create({
                trigger: imgWrapRef.current,
                start: 'top bottom',
                end: 'bottom top',
                scrub: 1.5,
                animation: gsap.fromTo(imgRef.current,
                    { yPercent: isReversed ? 8 : 5, scale: 1.15 },
                    { yPercent: parallaxAmount, scale: 1.05, ease: 'none' }
                ),
            });
            triggers.push(st);
        }

        // ── 2. Image wrapper clip-path reveal with scrub ──
        if (imgWrapRef.current) {
            const st = ScrollTrigger.create({
                trigger: imgWrapRef.current,
                start: 'top 90%',
                end: 'top 50%',
                scrub: 0.8,
                animation: gsap.fromTo(imgWrapRef.current,
                    { clipPath: 'inset(8% 0% 8% 0%)' },
                    { clipPath: 'inset(0% 0% 0% 0%)', ease: 'none' }
                ),
            });
            triggers.push(st);
        }

        // ── 3. Content stagger reveal ──
        const contentEls = [
            metaRef.current,
            titleRef.current,
            descRef.current,
            ctaRef.current
        ].filter(Boolean);

        if (contentEls.length > 0) {
            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: contentRef.current,
                    start: 'top 80%',
                    end: 'top 40%',
                    scrub: 1,
                }
            });

            contentEls.forEach((cel, ci) => {
                tl.fromTo(cel,
                    { opacity: 0, y: 30 + ci * 5, x: isReversed ? 20 : -20 },
                    { opacity: 1, y: 0, x: 0, ease: 'power2.out' },
                    ci * 0.08
                );
            });

            triggers.push(tl.scrollTrigger);
        }

        // ── 4. Subtle horizontal shift on whole card while scrolling ──
        const xShift = isReversed ? -20 : 20;
        const st2 = ScrollTrigger.create({
            trigger: el,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 2,
            animation: gsap.fromTo(el,
                { x: xShift },
                { x: -xShift, ease: 'none' }
            ),
        });
        triggers.push(st2);

        return () => {
            triggers.forEach(st => st && st.kill());
        };
    }, [isReversed]);

    return (
        <div
            ref={cardRef}
            className={`editorial-card group grid grid-cols-12 gap-4 md:gap-8 items-start ${isReversed ? 'md:direction-rtl' : ''}`}
        >
            {/* Image Block — spans 7 columns */}
            <div className={`col-span-12 ${isReversed ? 'md:col-start-6 md:col-span-7' : 'md:col-span-7'}`}>
                <div ref={imgWrapRef} className="relative aspect-[4/5] overflow-hidden bg-gray-100" style={{ clipPath: 'inset(8% 0% 8% 0%)', willChange: 'clip-path' }}>
                    <img
                        ref={imgRef}
                        src={exp.image}
                        alt={exp.title}
                        className="w-full h-[130%] object-cover transition-[filter] duration-[1.2s] group-hover:scale-[1.03] grayscale-[20%] group-hover:grayscale-0"
                        style={{ willChange: 'transform' }}
                        loading="lazy"
                    />
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-500" />

                    {/* Floating location badge */}
                    <div className="absolute bottom-4 left-4 md:bottom-6 md:left-6">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/90 backdrop-blur-sm text-[10px] font-mono uppercase tracking-[0.2em] text-gray-700">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {exp.location}
                        </span>
                    </div>

                    {/* Hover arrow */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
                        <span className="inline-flex items-center justify-center w-16 h-16 rounded-full border-2 border-white text-white bg-black/20 backdrop-blur-md">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                        </span>
                    </div>
                </div>
            </div>

            {/* Content Block — spans 5 columns */}
            <div ref={contentRef} className={`col-span-12 ${isReversed ? 'md:col-start-1 md:col-span-5 md:row-start-1' : 'md:col-span-5'} flex flex-col justify-center md:py-12`} style={{ direction: 'ltr' }}>
                {/* Index & Category */}
                <div ref={metaRef} className="flex items-center gap-3 mb-4 opacity-0">
                    <span className="font-mono text-sm text-gray-300">{exp.id}</span>
                    <span className="h-px w-8 bg-gray-300" />
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-gray-400">{exp.category}</span>
                </div>

                {/* Stacked Title — visual staircase */}
                <div ref={titleRef} className="mb-5 opacity-0">
                    {exp.title.split('\n').map((line, li) => (
                        <span
                            key={li}
                            className="block text-3xl md:text-4xl lg:text-[2.8rem] font-playfair font-bold text-gray-900 leading-[1.1] tracking-tight"
                        >
                            {line}
                        </span>
                    ))}
                </div>

                {/* Description */}
                <p ref={descRef} className="text-sm text-gray-500 leading-[1.8] font-light max-w-sm mb-6 opacity-0">
                    {exp.desc}
                </p>

                {/* CTA link */}
                <a ref={ctaRef} href="#" className="group/link inline-flex items-center gap-3 w-fit opacity-0">
                    <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-gray-800 border-b border-gray-300 pb-0.5 group-hover/link:border-gray-900 transition-colors">
                        Khám phá
                    </span>
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full border border-gray-300 group-hover/link:border-gray-900 group-hover/link:bg-gray-900 group-hover/link:text-white transition-all">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                    </span>
                </a>
            </div>
        </div>
    );
};

/* ──────────────────────────────────────────────
   Main Component
   ────────────────────────────────────────────── */
const Experiences = () => {
    const navigate = useNavigate();
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('urban');
    const heroRef = useRef(null);
    const stickyNavRef = useRef(null);
    const sectionUrbanRef = useRef(null);
    const sectionCountyRef = useRef(null);
    const marqueeRef = useRef(null);
    const galleryRef = useRef(null);
    const galleryImg1Ref = useRef(null);
    const galleryImg2Ref = useRef(null);
    const galleryTextRef = useRef(null);
    const galleryQuoteRef = useRef(null);
    const ctaSectionRef = useRef(null);
    const urbanHeaderRef = useRef(null);
    const countyHeaderRef = useRef(null);
    const dividerRef1 = useRef(null);
    const dividerRef2 = useRef(null);
    const dividerRef3 = useRef(null);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    /* ─── Hero Animations ─── */
    useEffect(() => {
        const ctx = gsap.context(() => {
            // Stagger reveal for hero content
            gsap.fromTo('.hero-title-word',
                { opacity: 0, y: 40, rotateX: -15 },
                {
                    opacity: 1, y: 0, rotateX: 0,
                    duration: 1,
                    ease: 'power3.out',
                    stagger: 0.08,
                    delay: 0.3,
                }
            );

            gsap.fromTo('.hero-subtitle',
                { opacity: 0, y: 20 },
                { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out', delay: 0.9 }
            );

            // ── Hero image parallax with scrub (3D window effect) ──
            gsap.fromTo('.hero-img-left',
                { scale: 1.1, yPercent: 0 },
                {
                    scale: 1.2, yPercent: 15,
                    ease: 'none',
                    scrollTrigger: {
                        trigger: heroRef.current,
                        start: 'top top',
                        end: 'bottom top',
                        scrub: 1.5,
                    }
                }
            );

            // ── Hero gradient overlay intensifies on scroll ──
            gsap.to('.hero-gradient-overlay', {
                opacity: 0.9,
                ease: 'none',
                scrollTrigger: {
                    trigger: heroRef.current,
                    start: 'top top',
                    end: 'bottom top',
                    scrub: 1,
                }
            });

            // ── Hero title moves up and fades during scroll-out ──
            gsap.to('.hero-content-inner', {
                yPercent: -30,
                opacity: 0.3,
                ease: 'none',
                scrollTrigger: {
                    trigger: heroRef.current,
                    start: '60% top',
                    end: 'bottom top',
                    scrub: 1,
                }
            });
        }, heroRef);

        return () => ctx.revert();
    }, []);

    /* ─── Section Header & Divider Animations ─── */
    useEffect(() => {
        const triggers = [];

        // ── Urban section header parallax ──
        if (urbanHeaderRef.current) {
            const st = ScrollTrigger.create({
                trigger: urbanHeaderRef.current,
                start: 'top 85%',
                end: 'top 30%',
                scrub: 1,
                animation: gsap.fromTo(urbanHeaderRef.current,
                    { opacity: 0, y: 60 },
                    { opacity: 1, y: 0, ease: 'power2.out' }
                ),
            });
            triggers.push(st);
        }

        // ── County section header parallax ──
        if (countyHeaderRef.current) {
            const st = ScrollTrigger.create({
                trigger: countyHeaderRef.current,
                start: 'top 85%',
                end: 'top 35%',
                scrub: 1,
                animation: gsap.fromTo(countyHeaderRef.current,
                    { opacity: 0, y: 50 },
                    { opacity: 1, y: 0, ease: 'power2.out' }
                ),
            });
            triggers.push(st);
        }

        // ── Divider line-draw animations ──
        [dividerRef1, dividerRef2, dividerRef3].forEach(ref => {
            if (ref.current) {
                const st = ScrollTrigger.create({
                    trigger: ref.current,
                    start: 'top 90%',
                    end: 'top 60%',
                    scrub: 0.6,
                    animation: gsap.fromTo(ref.current,
                        { scaleX: 0, transformOrigin: 'left center' },
                        { scaleX: 1, ease: 'none' }
                    ),
                });
                triggers.push(st);
            }
        });

        return () => triggers.forEach(st => st && st.kill());
    }, []);

    /* ─── Art Gallery Parallax & Scrub ─── */
    useEffect(() => {
        const triggers = [];

        // ── Gallery image 1: rises slowly ──
        if (galleryImg1Ref.current) {
            const st = ScrollTrigger.create({
                trigger: galleryRef.current,
                start: 'top bottom',
                end: 'bottom top',
                scrub: 1.5,
                animation: gsap.fromTo(galleryImg1Ref.current,
                    { yPercent: 15, scale: 1.08 },
                    { yPercent: -10, scale: 1, ease: 'none' }
                ),
            });
            triggers.push(st);
        }

        // ── Gallery image 2: different speed for depth ──
        if (galleryImg2Ref.current) {
            const st = ScrollTrigger.create({
                trigger: galleryRef.current,
                start: 'top bottom',
                end: 'bottom top',
                scrub: 2,
                animation: gsap.fromTo(galleryImg2Ref.current,
                    { yPercent: -5, scale: 1.05 },
                    { yPercent: -20, scale: 1, ease: 'none' }
                ),
            });
            triggers.push(st);
        }

        // ── Gallery text reveal ──
        if (galleryTextRef.current) {
            const st = ScrollTrigger.create({
                trigger: galleryTextRef.current,
                start: 'top 80%',
                end: 'top 40%',
                scrub: 1,
                animation: gsap.fromTo(galleryTextRef.current,
                    { opacity: 0, x: -40 },
                    { opacity: 1, x: 0, ease: 'power2.out' }
                ),
            });
            triggers.push(st);
        }

        // ── Floating quote slide up ──
        if (galleryQuoteRef.current) {
            const st = ScrollTrigger.create({
                trigger: galleryRef.current,
                start: '40% bottom',
                end: '80% bottom',
                scrub: 1,
                animation: gsap.fromTo(galleryQuoteRef.current,
                    { opacity: 0, y: 40, x: -20 },
                    { opacity: 1, y: 0, x: 0, ease: 'power2.out' }
                ),
            });
            triggers.push(st);
        }

        return () => triggers.forEach(st => st && st.kill());
    }, []);

    /* ─── CTA Section Scale Reveal ─── */
    useEffect(() => {
        if (!ctaSectionRef.current) return;

        const st = ScrollTrigger.create({
            trigger: ctaSectionRef.current,
            start: 'top 85%',
            end: 'top 35%',
            scrub: 1,
            animation: gsap.fromTo(ctaSectionRef.current,
                { opacity: 0, y: 50, scale: 0.96 },
                { opacity: 1, y: 0, scale: 1, ease: 'power2.out' }
            ),
        });

        return () => st.kill();
    }, []);

    /* ─── Marquee — scroll-linked speed + auto ─── */
    useEffect(() => {
        const track = marqueeRef.current;
        if (!track) return;

        // Base auto-scroll
        const autoTween = gsap.to(track, {
            xPercent: -50,
            repeat: -1,
            duration: 30,
            ease: 'none',
        });

        // Scroll-linked speed boost: marquee accelerates when user scrolls fast
        const st = ScrollTrigger.create({
            trigger: track.parentElement,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1,
            onUpdate: (self) => {
                // Speed up marquee based on scroll velocity
                const velocity = Math.abs(self.getVelocity());
                const speedMultiplier = 1 + Math.min(velocity / 1000, 3);
                autoTween.timeScale(speedMultiplier);
            },
        });

        return () => {
            autoTween.kill();
            st.kill();
        };
    }, []);

    const handleCitySelect = (city) => {
        setDrawerOpen(false);
        setTimeout(() => navigate(`/rooms?city=${encodeURIComponent(city)}`), 400);
    };

    return (
        <>
            <div className="min-h-screen bg-white text-gray-900 overflow-hidden">

                {/* ═══════════════════════════════════════════
                    HERO — Split-screen bifurcated layout
                    ═══════════════════════════════════════════ */}
                <section ref={heroRef} className="relative min-h-screen bg-[#1a1a1a] flex items-end overflow-hidden">
                    {/* Background image */}
                    <div className="absolute inset-0 overflow-hidden">
                        <img
                            src={assets.exp_hero_bedroom}
                            alt="QuickStay Luxury Experience"
                            className="hero-img-left w-full h-[120%] object-cover opacity-50"
                            style={{ willChange: 'transform' }}
                        />
                        <div className="hero-gradient-overlay absolute inset-0 bg-gradient-to-t from-[#1a1a1a] via-[#1a1a1a]/60 to-transparent opacity-70" />
                    </div>

                    {/* Hero content */}
                    <div className="hero-content-inner relative z-10 w-full max-w-7xl mx-auto px-6 md:px-12 lg:px-20 pb-16 md:pb-24 pt-32">
                        <div className="grid grid-cols-12 gap-4">
                            {/* Title */}
                            <div className="col-span-12 md:col-span-8">
                                <span className="hero-subtitle font-mono text-[10px] uppercase tracking-[0.3em] text-white/50 mb-6 block opacity-0">
                                    QuickStay Lifestyle
                                </span>
                                <h1 className="mb-6" style={{ perspective: '600px' }}>
                                    {['Our', 'Experiences'].map((word, i) => (
                                        <span
                                            key={word}
                                            className="hero-title-word inline-block mr-4 text-5xl md:text-7xl lg:text-8xl xl:text-9xl font-playfair font-bold text-white leading-[1.05] tracking-tight opacity-0"
                                            style={{ display: i === 1 ? 'block' : 'inline-block' }}
                                        >
                                            {word}
                                        </span>
                                    ))}
                                </h1>
                            </div>

                            {/* Subtitle */}
                            <div className="col-span-12 md:col-span-4 flex items-end pb-2">
                                <p className="hero-subtitle text-sm text-white/60 leading-[1.8] font-light max-w-xs opacity-0">
                                    Không chỉ là điểm đến, chúng tôi kiến tạo những khoảnh khắc vượt thời gian. Mỗi trải nghiệm đều được may đo tỉ mỉ.
                                </p>
                            </div>
                        </div>

                        {/* Scroll indicator */}
                        <div className="mt-12 flex items-center gap-3 opacity-60">
                            <span className="w-px h-8 bg-white/40 scroll-indicator" />
                            <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-white/40">Cuộn để khám phá</span>
                        </div>
                    </div>
                </section>

                {/* ═══════════════════════════════════════════
                    Split Navigation — Urban vs County
                    ═══════════════════════════════════════════ */}
                <section className="bg-white">
                    <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-20">
                        {/* Sticky category nav */}
                        <div ref={stickyNavRef} className="sticky top-16 z-30 bg-white/95 backdrop-blur-sm border-b border-gray-100 -mx-6 md:-mx-12 lg:-mx-20 px-6 md:px-12 lg:px-20">
                            <div className="flex items-center justify-between py-4">
                                <div className="flex items-center gap-4">
                                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-gray-400 hidden md:block">Khám phá</span>
                                    <span className="h-4 w-px bg-gray-200 hidden md:block" />
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => {
                                                setActiveTab('urban');
                                                sectionUrbanRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                            }}
                                            className={`px-4 py-2 text-xs font-mono uppercase tracking-[0.15em] transition-all cursor-pointer ${activeTab === 'urban'
                                                ? 'bg-gray-900 text-white'
                                                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                                                }`}
                                        >
                                            Đô Thị
                                        </button>
                                        <button
                                            onClick={() => {
                                                setActiveTab('county');
                                                sectionCountyRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                            }}
                                            className={`px-4 py-2 text-xs font-mono uppercase tracking-[0.15em] transition-all cursor-pointer ${activeTab === 'county'
                                                ? 'bg-gray-900 text-white'
                                                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                                                }`}
                                        >
                                            Nghỉ Dưỡng
                                        </button>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setDrawerOpen(true)}
                                    className="flex items-center gap-2 px-4 py-2 border border-gray-200 hover:border-gray-900 hover:bg-gray-900 hover:text-white transition-all cursor-pointer"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    <span className="font-mono text-[11px] uppercase tracking-[0.12em]">Chọn Điểm Đến</span>
                                </button>
                            </div>
                        </div>

                        {/* ─── Urban Stays ─── */}
                        <div ref={sectionUrbanRef} className="pt-20 md:pt-28 scroll-mt-28">
                            {/* Section Header */}
                            <div ref={urbanHeaderRef} className="grid grid-cols-12 gap-4 mb-16 md:mb-24 opacity-0">
                                <div className="col-span-12 md:col-span-6">
                                    <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-gray-400 mb-4 block">01 — Kỳ nghỉ đô thị</span>
                                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-playfair font-bold text-gray-900 leading-[1.1] tracking-tight">
                                        Urban<br />Stays
                                    </h2>
                                </div>
                                <div className="col-span-12 md:col-span-4 md:col-start-9 flex items-end">
                                    <p className="text-sm text-gray-500 leading-[1.8] font-light">
                                        Khám phá nhịp sống sôi động nơi đô thị qua lăng kính của những trải nghiệm xa xỉ — từ ẩm thực đỉnh cao đến spa sang trọng giữa lòng thành phố.
                                    </p>
                                </div>
                            </div>

                            {/* Divider line */}
                            <div ref={dividerRef1} className="h-px bg-gray-200 mb-16 md:mb-24" style={{ transformOrigin: 'left center', transform: 'scaleX(0)' }} />

                            {/* Experience Cards */}
                            <div className="space-y-24 md:space-y-32">
                                {urbanExperiences.map((exp, index) => (
                                    <ExperienceCard
                                        key={exp.id}
                                        exp={exp}
                                        index={index}
                                        isReversed={index % 2 !== 0}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* ─── Transition Marquee ─── */}
                        <div className="py-20 md:py-32 overflow-hidden">
                            <div ref={dividerRef2} className="h-px bg-gray-200 mb-16" style={{ transformOrigin: 'left center', transform: 'scaleX(0)' }} />
                            <div className="marquee-container">
                                <div ref={marqueeRef} className="flex whitespace-nowrap will-change-transform">
                                    {[...Array(4)].map((_, i) => (
                                        <span key={i} className="text-6xl md:text-8xl lg:text-9xl font-playfair font-bold text-gray-100 tracking-tight px-8 select-none">
                                            QuickStay · Beyond The Ordinary ·&nbsp;
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div ref={dividerRef3} className="h-px bg-gray-200 mt-16" style={{ transformOrigin: 'left center', transform: 'scaleX(0)' }} />
                        </div>

                        {/* ─── County Stays ─── */}
                        <div ref={sectionCountyRef} className="scroll-mt-28">
                            {/* Section Header on warm bg */}
                            <div className="bg-[#F0EEEA] -mx-6 md:-mx-12 lg:-mx-20 px-6 md:px-12 lg:px-20 py-20 md:py-28 mb-16 md:mb-24">
                                <div ref={countyHeaderRef} className="max-w-7xl mx-auto grid grid-cols-12 gap-4 opacity-0">
                                    <div className="col-span-12 md:col-span-6">
                                        <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-gray-400 mb-4 block">02 — Kỳ nghỉ miền quê</span>
                                        <h2 className="text-4xl md:text-5xl lg:text-6xl font-playfair font-bold text-gray-900 leading-[1.1] tracking-tight">
                                            Country<br />Stays
                                        </h2>
                                    </div>
                                    <div className="col-span-12 md:col-span-4 md:col-start-9 flex items-end">
                                        <p className="text-sm text-gray-500 leading-[1.8] font-light">
                                            Trốn khỏi thành phố, đắm mình trong vẻ đẹp nguyên sơ của thiên nhiên. Nơi thời gian chậm lại và tâm hồn được chữa lành.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Experience Cards */}
                            <div className="space-y-24 md:space-y-32 pb-20">
                                {countyExperiences.map((exp, index) => (
                                    <ExperienceCard
                                        key={exp.id}
                                        exp={exp}
                                        index={index}
                                        isReversed={index % 2 !== 0}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* ═══════════════════════════════════════════
                    Floating Art Gallery — Layered Images
                    ═══════════════════════════════════════════ */}
                <section ref={galleryRef} className="bg-[#F0EEEA] py-24 md:py-32 overflow-hidden">
                    <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-20">
                        <div className="grid grid-cols-12 gap-4 md:gap-8">
                            {/* Text column */}
                            <div ref={galleryTextRef} className="col-span-12 md:col-span-4 flex flex-col justify-center mb-10 md:mb-0 opacity-0">
                                <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-gray-400 mb-4 block">Nghệ thuật & Không gian</span>
                                <h2 className="text-3xl md:text-4xl lg:text-5xl font-playfair font-bold text-gray-900 leading-[1.1] tracking-tight mb-6">
                                    A Hotbed<br />Of Art
                                </h2>
                                <p className="text-sm text-gray-500 leading-[1.8] font-light max-w-sm mb-8">
                                    Mỗi góc nhỏ trong không gian QuickStay đều là một tác phẩm nghệ thuật. Chúng tôi kết hợp kiến trúc hiện đại với nghệ thuật đương đại Việt Nam để tạo nên những trải nghiệm thị giác độc đáo.
                                </p>
                                <a href="#" className="group/art inline-flex items-center gap-3 w-fit">
                                    <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-gray-800 border-b border-gray-300 pb-0.5 group-hover/art:border-gray-900 transition-colors">
                                        Xem Bộ Sưu Tập
                                    </span>
                                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full border border-gray-300 group-hover/art:border-gray-900 group-hover/art:bg-gray-900 group-hover/art:text-white transition-all">
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                        </svg>
                                    </span>
                                </a>
                            </div>

                            {/* Layered images — asymmetric parallax stacking like Drake */}
                            <div className="col-span-12 md:col-span-8 relative">
                                <div className="grid grid-cols-2 gap-4">
                                    {/* Large image — rises with scroll */}
                                    <div className="col-span-2 md:col-span-1 relative">
                                        <div className="aspect-[3/4] overflow-hidden">
                                            <img
                                                ref={galleryImg1Ref}
                                                src={assets.exp_urban_lobby}
                                                alt="Lobby Art"
                                                className="w-full h-[130%] object-cover hover:scale-105 transition-[filter] duration-[1.2s]"
                                                style={{ willChange: 'transform' }}
                                                loading="lazy"
                                            />
                                        </div>
                                    </div>
                                    {/* Offset image — different parallax speed for depth */}
                                    <div className="col-span-2 md:col-span-1 md:mt-16 relative">
                                        <div className="aspect-[3/4] overflow-hidden">
                                            <img
                                                ref={galleryImg2Ref}
                                                src={assets.exp_rooftop_suite}
                                                alt="Rooftop Art"
                                                className="w-full h-[130%] object-cover hover:scale-105 transition-[filter] duration-[1.2s]"
                                                style={{ willChange: 'transform' }}
                                                loading="lazy"
                                            />
                                        </div>
                                    </div>
                                </div>
                                {/* Floating text overlay with scrub reveal */}
                                <div ref={galleryQuoteRef} className="absolute -bottom-4 -left-4 md:-bottom-8 md:-left-8 bg-white p-6 md:p-8 shadow-sm max-w-xs opacity-0">
                                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-gray-400 block mb-2">Triết lý thiết kế</span>
                                    <p className="text-sm text-gray-700 leading-relaxed italic">
                                        "Chúng tôi tin rằng không gian lưu trú phải kể được câu chuyện của đất nước, con người và thời đại."
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ═══════════════════════════════════════════
                    Bottom CTA — Editorial minimal
                    ═══════════════════════════════════════════ */}
                <section className="bg-white py-24 md:py-32">
                    <div ref={ctaSectionRef} className="max-w-4xl mx-auto px-6 text-center opacity-0">
                        <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-gray-400 mb-8 block">Bắt đầu hành trình</span>
                        <h2 className="text-4xl md:text-6xl lg:text-7xl font-playfair font-bold text-gray-900 leading-[1.1] tracking-tight mb-8">
                            Sẵn Sàng<br />Cho Kỳ Nghỉ?
                        </h2>
                        <p className="text-sm text-gray-500 leading-[1.8] font-light max-w-md mx-auto mb-10">
                            Chọn trải nghiệm phù hợp với phong cách sống của bạn. Từ phố thị sôi động đến miền quê thanh bình — mỗi chuyến đi đều đáng nhớ.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <button
                                onClick={() => navigate('/rooms')}
                                className="group flex items-center gap-3 bg-gray-900 text-white px-8 py-4 hover:bg-gray-800 transition-all cursor-pointer"
                            >
                                <span className="font-mono text-xs uppercase tracking-[0.15em]">Đặt phòng ngay</span>
                                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full border border-white/30 group-hover:bg-white group-hover:text-gray-900 transition-all">
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                    </svg>
                                </span>
                            </button>
                            <button
                                onClick={() => setDrawerOpen(true)}
                                className="group flex items-center gap-3 border border-gray-300 px-8 py-4 hover:border-gray-900 transition-all cursor-pointer"
                            >
                                <span className="font-mono text-xs uppercase tracking-[0.15em] text-gray-700">Chọn điểm đến</span>
                                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full border border-gray-300 group-hover:border-gray-900 transition-all">
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </span>
                            </button>
                        </div>
                    </div>
                </section>

            </div>

            {/* ─── Slide-out Location Drawer ─── */}
            <SlideDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)}>
                <LocationPicker onSelect={handleCitySelect} />
            </SlideDrawer>
        </>
    );
};

export default Experiences;
