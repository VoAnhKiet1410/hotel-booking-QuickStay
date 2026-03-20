import React, { useEffect, useState, useRef } from 'react'
import { Link, useLocation, } from 'react-router-dom';
import { assets } from '../assets/assets';
import { useClerk, UserButton } from '@clerk/clerk-react'
import { useAppContext } from '../context/appContextCore';
import { X, Menu, ArrowRight, Bell } from 'lucide-react';
import NotificationDropdown from './NotificationDropdown';
import { useSocketContext } from '../context/socketCore';
import { useChatSocket } from '../context/chatSocketCore';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const BookIcon = () => (
    <svg className="w-4 h-4 text-gray-700" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" >
        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 19V4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v13H7a2 2 0 0 0-2 2Zm0 0a2 2 0 0 0 2 2h12M9 3v14m7 0v4" />
    </svg>
)

const Navbar = () => {
    const navLinks = [
        { name: 'Trang chủ', path: '/' },
        { name: 'Khách sạn', path: '/rooms' },
        { name: 'Trải nghiệm', path: '/experiences' },
        { name: 'Giới thiệu', path: '/about' },
    ];

    const [isScrolled, setIsScrolled] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);



    const { openSignIn } = useClerk()
    const location = useLocation()
    const isNotHome = location.pathname !== '/';
    const { user, navigate, isOwner, axios } = useAppContext();
    const { socket } = useSocketContext();
    const { chatSocket } = useChatSocket();

    // DEV: Expose test helper vào window để gọi từ console
    useEffect(() => {
        if (import.meta.env.DEV) {
            window.__testNotif = (type) => {
                const samples = {
                    // === Owner nhận ===
                    new_booking: {
                        type: 'new_booking',
                        message: 'Dat phong moi tai Sunrise Boutique Ha Noi',
                        guestName: 'Nguyen Van A',
                        totalPrice: 2500000,
                        bookingId: 'TEST_001',
                        createdAt: new Date().toISOString(),
                    },
                    booking_cancelled: {
                        type: 'booking_cancelled',
                        message: 'Dat phong bi huy boi khach hang',
                        guestName: 'Le Thi C',
                        bookingId: 'TEST_002',
                        createdAt: new Date().toISOString(),
                    },
                    // === User nhận ===
                    booking_pending: {
                        type: 'booking_pending',
                        message: 'Đặt phòng Queen tại QuickStay Sài Gòn thành công! Đang chờ khách sạn xác nhận.',
                        bookingId: 'TEST_008',
                        createdAt: new Date().toISOString(),
                    },
                    booking_confirmed: {
                        type: 'booking_confirmed',
                        message: 'Dat phong Queen tai QuickStay Sai Gon da duoc xac nhan thanh cong',
                        bookingId: 'TEST_003',
                        createdAt: new Date().toISOString(),
                    },
                    booking_checked_in: {
                        type: 'booking_checked_in',
                        message: 'Ban da nhan phong Queen tai QuickStay Sai Gon thanh cong',
                        bookingId: 'TEST_004',
                        createdAt: new Date().toISOString(),
                    },
                    booking_completed: {
                        type: 'booking_completed',
                        message: 'Cam on ban da luu tru tai QuickStay Sai Gon. Hen gap lai!',
                        bookingId: 'TEST_005',
                        createdAt: new Date().toISOString(),
                    },
                    booking_cancelled_by_owner: {
                        type: 'booking_cancelled_by_owner',
                        message: 'Dat phong Queen tai QuickStay Sai Gon da bi huy boi khach san',
                        bookingId: 'TEST_006',
                        createdAt: new Date().toISOString(),
                    },
                    payment_success: {
                        type: 'payment_success',
                        message: 'Thanh toan thanh cong 2.000.000d',
                        totalPrice: 2000000,
                        bookingId: 'TEST_007',
                        createdAt: new Date().toISOString(),
                    },
                    new_message: {
                        type: 'new_message',
                        message: 'Tin nhan moi tu Tran Thi B',
                        createdAt: new Date().toISOString(),
                    },
                };

                if (type && samples[type]) {
                    setNotifications(prev => [{ ...samples[type], id: `test_${Date.now()}` }, ...prev]);
                    console.log(`[TestNotif] Injected: ${type}`);
                } else {
                    const all = Object.values(samples).map((n, i) => ({
                        ...n, id: `test_${Date.now()}_${i}`
                    }));
                    setNotifications(prev => [...all, ...prev]);
                    console.log('[TestNotif] Injected all 8 notification types. Types: ' + Object.keys(samples).join(', '));
                }
            };
            console.log('%c[DEV] Notification test ready! Run: window.__testNotif() or window.__testNotif("new_booking")', 'color: #8b5cf6; font-weight: bold');
        }
        return () => { if (import.meta.env.DEV) delete window.__testNotif; };
    }, []);

    // === Fetch notifications từ API khi user login (persistent) ===
    useEffect(() => {
        if (!user || !axios) return;
        const fetchNotifications = async () => {
            try {
                const { data } = await axios.get('/api/notifications');
                if (data?.success) {
                    // Map DB format sang format Navbar dùng
                    const loaded = (data.data.notifications || []).map((n) => ({
                        id: n._id,
                        type: n.type,
                        message: n.message,
                        createdAt: n.createdAt,
                        isRead: n.isRead,
                        ...(n.data || {}),
                    }));
                    setNotifications(loaded);
                }
            } catch (err) {
                // Không show lỗi — silent fail
                console.warn('[Notifications] fetch error:', err.message);
            }
        };
        fetchNotifications();
    }, [user, axios]);

    // Handle real-time notification updates
    useEffect(() => {
        if (!socket || !user) return;
        const handleNotification = (notification) => {
            const notifWithId = { ...notification, id: `notif_${Date.now()}` };
            setNotifications(prev => [notifWithId, ...prev]);
        };

        socket.on('newNotification', handleNotification);
        return () => {
            socket.off('newNotification', handleNotification);
        };
    }, [socket, user]);

    // Tin nhắn mới từ Chat Service → tạo notification và gộp vào bell
    useEffect(() => {
        if (!chatSocket || !user) return;
        const handleNewMessage = (message) => {
            if (message.senderId !== user?.id) {
                const msgNotif = {
                    id: `msg_${Date.now()}`,
                    type: 'new_message',
                    message: message.senderName
                        ? `Tin nhắn mới từ ${message.senderName}`
                        : 'Bạn có tin nhắn mới',
                    createdAt: message.createdAt || new Date().toISOString(),
                };
                setNotifications(prev => [msgNotif, ...prev]);
            }
        };

        chatSocket.on('newMessage', handleNewMessage);
        return () => {
            chatSocket.off('newMessage', handleNewMessage);
        };
    }, [chatSocket, user]);

    // Dự phòng: lắng nghe localNotification event khi socket chưa kịp kết nối
    // (ví dụ: sau khi redirect từ Stripe về booking-success)
    useEffect(() => {
        if (!user) return;
        const handleLocalNotif = (e) => {
            const notification = e.detail;
            if (notification) {
                setNotifications(prev => [
                    { ...notification, id: `local_${Date.now()}` },
                    ...prev,
                ]);
            }
        };
        window.addEventListener('localNotification', handleLocalNotif);
        return () => window.removeEventListener('localNotification', handleLocalNotif);
    }, [user]);

    // isScrolled = scroll only; isCompact = scrolled OR not on homepage
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10)
        }

        handleScroll()

        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    const isCompact = isScrolled || isNotHome;

    // Lock body scroll when menu is open
    useEffect(() => {
        if (isMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isMenuOpen]);

    const headerRef = useRef(null);
    const navInnerRef = useRef(null);

    // Smart Hide/Show using GSAP ScrollTrigger
    useEffect(() => {
        let ctx = gsap.context(() => {
            const showAnim = gsap.from(headerRef.current, {
                yPercent: -100,
                paused: true,
                duration: 0.4,
                ease: "power3.out"
            }).progress(1);

            ScrollTrigger.create({
                start: "top top",
                end: "max",
                onUpdate: (self) => {
                    if (self.scrollY < 50) {
                        showAnim.play();
                    } else if (self.direction === 1) { // 1 = scroll down
                        // only hide if the mobile menu or message is NOT open
                        if (!isMenuOpen) {
                            showAnim.reverse();
                        }
                    } else if (self.direction === -1) { // -1 = scroll up
                        showAnim.play();
                    }
                }
            });

            // Dynamic Color Change Logic (if sections have data-nav-theme="light")
            // Optional basic setup for future sections with this attribute
            const lightSections = gsap.utils.toArray('[data-nav-theme="light"]');
            lightSections.forEach(sec => {
                ScrollTrigger.create({
                    trigger: sec,
                    start: "top 64px",
                    end: "bottom 64px",
                    toggleClass: { targets: navInnerRef.current, className: "nav-force-light" }
                });
            });
        });

        return () => ctx.revert();
    }, [isMenuOpen, location.pathname]);

    return (
        <>
            {/* Wrapper element handled strictly by GSAP for transform animations without CSS transitions interfering */}
            <header ref={headerRef} className="fixed top-0 left-0 w-full z-50">
                <nav ref={navInnerRef} className={`w-full transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${isCompact
                    ? "bg-white/95 backdrop-blur-lg border-b border-gray-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.05)] text-gray-900 override-force-light"
                    : "text-white"
                    }`}>

                    {/* === ROW 1: Logo + Utility Bar === */}
                    <div className="flex items-center justify-between px-4 md:px-10 lg:px-16 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
                        style={{ height: isCompact ? '60px' : '72px' }}
                    >
                        {/* Logo — shrinks to icon on scroll */}
                        <Link to='/' aria-label="Trang chủ QuickStay" className="flex items-center gap-2 group">
                            <div className={`flex items-center transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden`}>
                                {/* Full logo when not scrolled */}
                                <div className={`transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${isCompact ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
                                    <img src={assets.logo} alt="logo" className="h-8" />
                                </div>
                                {/* Compact "Q" badge when scrolled */}
                                <div className={`flex items-center justify-center border font-playfair font-bold transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${isCompact
                                    ? 'w-9 h-9 text-lg border-gray-900 text-gray-900 opacity-100'
                                    : 'w-0 h-9 text-lg border-transparent text-transparent opacity-0'
                                    }`}>
                                    Q
                                </div>
                            </div>
                        </Link>

                        {/* Right side: Utility buttons */}
                        <div className="flex items-center gap-1">

                            {/* Desktop: User actions */}
                            <div className="hidden md:flex items-center gap-1">
                                {/* Notifications */}
                                {user && (
                                    <div className="relative">
                                        <button
                                            onMouseDown={(e) => { e.stopPropagation(); setIsNotifOpen(prev => !prev); }}
                                            className={`relative flex items-center justify-center w-10 h-10 transition-colors duration-300 ${isCompact ? 'text-gray-600 hover:text-gray-900' : 'text-current opacity-70 hover:opacity-100'}`}
                                        >
                                            <Bell className="w-[18px] h-[18px]" />
                                            {notifications.length > 0 && (
                                                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold flex items-center justify-center rounded-full border-2 border-white">
                                                    {notifications.length > 9 ? '9+' : notifications.length}
                                                </span>
                                            )}
                                        </button>

                                        <NotificationDropdown
                                            isOpen={isNotifOpen}
                                            onClose={() => setIsNotifOpen(false)}
                                            notifications={notifications}
                                            onClearAll={async () => {
                                                setNotifications([]);
                                                setIsNotifOpen(false);
                                                try { await axios?.delete('/api/notifications'); } catch { /* silent */ }
                                            }}
                                        />
                                    </div>
                                )}


                                {/* User button or Sign in */}
                                {user ? (
                                    <div className="flex items-center ml-2">
                                        <UserButton>
                                            <UserButton.MenuItems>
                                                <UserButton.Action label="Đặt chỗ của tôi" labelIcon={<BookIcon />} onClick={() => navigate('/my-bookings')} />
                                            </UserButton.MenuItems>
                                        </UserButton>
                                    </div>
                                ) : (
                                    <button
                                        onClick={openSignIn}
                                        className={`ml-2 font-mono text-[10px] uppercase tracking-[0.2em] px-4 py-2 border transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] cursor-pointer
                                    ${isScrolled
                                                ? "border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white"
                                                : "border-current text-current hover:bg-white hover:text-gray-900"
                                            }`}
                                    >
                                        Đăng nhập
                                    </button>
                                )}
                            </div>

                            {/* Quản trị button (Desktop) */}
                            {user && isOwner && (
                                <button
                                    className={`hidden md:flex items-center ml-2 font-mono text-[10px] uppercase tracking-[0.2em] px-4 py-2 border transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] cursor-pointer ${isScrolled
                                        ? 'text-gray-900 border-gray-900 hover:bg-gray-900 hover:text-white'
                                        : 'text-current border-current hover:bg-white hover:text-gray-900'
                                        }`}
                                    onClick={() => navigate('/owner')}
                                >
                                    Quản trị
                                </button>
                            )}

                            {/* MENU button — Drake style */}
                            <button
                                type="button"
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                aria-label={isMenuOpen ? "Đóng menu" : "Mở menu"}
                                aria-expanded={isMenuOpen}
                                className={`hidden md:flex items-center gap-2 ml-3 px-4 py-2 border transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] cursor-pointer ${isScrolled
                                    ? 'border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white'
                                    : 'border-current text-current hover:bg-white hover:text-gray-900'
                                    }`}
                            >
                                <span className="font-mono text-[10px] uppercase tracking-[0.2em]">Menu</span>
                                <Menu className="w-4 h-4" />
                            </button>

                            {/* Mobile: user + hamburger */}
                            <div className="flex items-center gap-1 md:hidden">
                                {user && (
                                    <div className="flex items-center gap-1">
                                        <UserButton>
                                            <UserButton.MenuItems>
                                                <UserButton.Action label="Đặt chỗ của tôi" labelIcon={<BookIcon />} onClick={() => navigate('/my-bookings')} />
                                            </UserButton.MenuItems>
                                        </UserButton>
                                    </div>
                                )}
                                <button
                                    type="button"
                                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                                    aria-label={isMenuOpen ? "Đóng menu" : "Mở menu"}
                                    aria-expanded={isMenuOpen}
                                    className={`flex items-center justify-center p-2 transition-all ${isCompact ? 'text-gray-900' : 'text-white'}`}
                                >
                                    <Menu className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* === ROW 2: Nav Links — always visible, style adapts === */}
                    <div className={`hidden md:flex transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] border-t ${isCompact
                        ? 'border-gray-200/60'
                        : 'border-white/10'
                        }`}
                    >
                        <div className="flex items-center justify-center gap-0 w-full px-10 lg:px-16">
                            {navLinks.map((link, i) => (
                                <Link
                                    key={i}
                                    to={link.path}
                                    className={`group relative flex items-center justify-center px-6 py-3.5 font-mono text-[10px] uppercase tracking-[0.18em] border-r last:border-r-0 transition-all duration-300
                                    ${isCompact
                                            ? (location.pathname === link.path
                                                ? 'text-gray-900 bg-gray-100 border-gray-200/60'
                                                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50 border-gray-200/60')
                                            : (location.pathname === link.path
                                                ? 'text-current bg-white/10 border-white/10'
                                                : 'text-current opacity-70 hover:opacity-100 hover:bg-white/5 border-white/10')
                                        }`}
                                >
                                    {link.name}
                                    {/* Active/hover underline */}
                                    <span className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-[1px] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${isCompact ? 'bg-gray-900' : 'bg-white'} ${location.pathname === link.path ? 'w-8' : 'w-0 group-hover:w-6'}`} />
                                </Link>
                            ))}

                            {user && isOwner && (
                                <button
                                    className={`flex items-center justify-center px-5 py-3 font-mono text-[10px] uppercase tracking-[0.18em] border-l transition-all duration-300 cursor-pointer ${isCompact
                                        ? 'text-gray-500 hover:text-gray-900 hover:bg-gray-50 border-gray-200/60'
                                        : 'text-current opacity-70 hover:opacity-100 hover:bg-white/5 border-white/10'
                                        }`}
                                    onClick={() => navigate('/owner')}
                                >
                                    Quản trị
                                </button>
                            )}
                        </div>
                    </div>
                </nav>
            </header>

            {/* === SLIDE-IN DRAWER MENU — Drake Style === */}
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] transition-opacity duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setIsMenuOpen(false)}
            />
            {/* Drawer */}
            <div className={`fixed top-0 right-0 h-full w-full md:w-[520px] bg-[#1a1a1a] text-white z-[70] transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-y-auto ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>

                {/* ── Drawer Header ── */}
                <div className="flex items-center justify-end gap-2 px-8 py-5">
                    <button
                        onClick={() => setIsMenuOpen(false)}
                        aria-label="Đóng menu"
                        className="flex items-center gap-2 px-4 py-2 border border-white/20 font-mono text-[10px] uppercase tracking-[0.2em] text-white/80 hover:bg-white hover:text-gray-900 transition-all duration-400 cursor-pointer"
                    >
                        <span>Đóng</span>
                        <X className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={() => { navigate('/rooms'); setIsMenuOpen(false); }}
                        className="flex items-center gap-2 px-4 py-2 border border-white/20 font-mono text-[10px] uppercase tracking-[0.2em] text-white/80 hover:bg-white hover:text-gray-900 transition-all duration-400 cursor-pointer"
                    >
                        <span>Đặt phòng</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                </div>

                {/* ── Featured Destinations ── */}
                <div className="px-8 pb-6"
                    style={{
                        opacity: isMenuOpen ? 1 : 0,
                        transform: isMenuOpen ? 'translateY(0)' : 'translateY(20px)',
                        transition: `all 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${isMenuOpen ? 0.15 : 0}s`
                    }}
                >
                    {/* Region: Miền Bắc */}
                    <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-amber-400/70 mb-3">Miền Bắc, Việt Nam</p>
                    <div className="border-t border-white/10 pt-3 mb-6">
                        <button
                            onClick={() => { navigate('/rooms'); setIsMenuOpen(false); }}
                            className="group flex items-center gap-3 cursor-pointer"
                        >
                            <span className="font-playfair text-2xl md:text-[28px] font-bold text-white/90 group-hover:text-white transition-colors duration-300">
                                Hà Nội
                            </span>
                        </button>
                    </div>

                    {/* Region: Miền Trung */}
                    <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-amber-400/70 mb-3">Miền Trung, Việt Nam</p>
                    <div className="border-t border-white/10 pt-3 mb-6">
                        <button
                            onClick={() => { navigate('/rooms'); setIsMenuOpen(false); }}
                            className="group flex items-center gap-3 cursor-pointer"
                        >
                            <span className="font-playfair text-2xl md:text-[28px] font-bold text-white/90 group-hover:text-white transition-colors duration-300">
                                Đà Nẵng
                            </span>
                        </button>
                    </div>

                    {/* Region: Miền Nam */}
                    <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-amber-400/70 mb-3">Miền Nam, Việt Nam</p>
                    <div className="border-t border-white/10 pt-3 space-y-1">
                        <button
                            onClick={() => { navigate('/rooms'); setIsMenuOpen(false); }}
                            className="group flex items-center gap-3 cursor-pointer"
                        >
                            <span className="font-playfair text-2xl md:text-[28px] font-bold text-white/90 group-hover:text-white transition-colors duration-300">
                                Sài Gòn
                            </span>
                        </button>
                    </div>
                </div>

                {/* ── Spacer ── */}
                <div className="flex-1 min-h-[40px] md:min-h-[60px]" />

                {/* ── Navigation Grid — 2 columns ── */}
                <div className="px-8 py-6 border-t border-white/8"
                    style={{
                        opacity: isMenuOpen ? 1 : 0,
                        transform: isMenuOpen ? 'translateY(0)' : 'translateY(20px)',
                        transition: `all 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${isMenuOpen ? 0.3 : 0}s`
                    }}
                >
                    <div className="grid grid-cols-2 gap-x-12 gap-y-4">
                        {/* Column 1 */}
                        {[
                            { name: 'Trang chủ', path: '/' },
                            { name: 'Khách sạn', path: '/rooms' },
                            { name: 'Trải nghiệm', path: '/experiences' },
                            { name: 'Giới thiệu', path: '/about' },
                            ...(user && isOwner ? [{ name: 'Quản trị', path: '/owner' }] : []),
                        ].map((link, i) => (
                            <button
                                key={i}
                                onClick={() => { navigate(link.path); setIsMenuOpen(false); }}
                                className={`text-left font-mono text-[11px] uppercase tracking-[0.18em] transition-colors duration-300 cursor-pointer ${location.pathname === link.path ? 'text-white' : 'text-white/50 hover:text-white'}`}
                            >
                                {link.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Newsletter Section ── */}
                <div className="px-8 py-6 border-t border-white/8"
                    style={{
                        opacity: isMenuOpen ? 1 : 0,
                        transform: isMenuOpen ? 'translateY(0)' : 'translateY(15px)',
                        transition: `all 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${isMenuOpen ? 0.4 : 0}s`
                    }}
                >
                    <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-white/40 mb-4">
                        Đừng bỏ lỡ ưu đãi
                    </p>
                    <div className="flex border border-white/20">
                        <input
                            type="email"
                            placeholder="Email của bạn"
                            className="flex-1 bg-transparent px-4 py-3 font-mono text-[11px] text-white placeholder-white/30 outline-none tracking-wide"
                        />
                        <button className="px-5 py-3 font-mono text-[10px] uppercase tracking-[0.2em] text-white/80 border-l border-white/20 hover:bg-white hover:text-gray-900 transition-all duration-300 cursor-pointer">
                            Đăng ký
                        </button>
                    </div>
                </div>

                {/* ── Social Icons ── */}
                <div className="px-8 py-5 border-t border-white/8"
                    style={{
                        opacity: isMenuOpen ? 1 : 0,
                        transition: `opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${isMenuOpen ? 0.5 : 0}s`
                    }}
                >
                    <div className="flex items-center gap-3">
                        {[
                            { label: 'Facebook', icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M9.198 21.5h4v-8.01h3.604l.396-3.98h-4V7.5a1 1 0 0 1 1-1h3v-4h-3a5 5 0 0 0-5 5v2.01h-2l-.396 3.98h2.396v8.01Z" /></svg> },
                            { label: 'Instagram', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="5" /><circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" /></svg> },
                            { label: 'TikTok', icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M16.6 5.82s.51.5 0 0A4.278 4.278 0 0 1 15.54 3h-3.09v12.4a2.592 2.592 0 0 1-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6 0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3s-1.88.09-3.24-1.48Z" /></svg> },
                        ].map((s, i) => (
                            <a
                                key={i}
                                href="#"
                                aria-label={s.label}
                                className="flex items-center justify-center w-9 h-9 border border-white/15 text-white/40 hover:text-white hover:border-white/40 transition-all duration-300"
                            >
                                {s.icon}
                            </a>
                        ))}
                    </div>
                </div>

                {/* ── Sign in (if not logged in) ── */}
                {!user && (
                    <div className="px-8 py-4"
                        style={{
                            opacity: isMenuOpen ? 1 : 0,
                            transition: `opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${isMenuOpen ? 0.55 : 0}s`
                        }}
                    >
                        <button
                            onClick={() => { openSignIn(); setIsMenuOpen(false); }}
                            className="w-full font-mono text-[10px] uppercase tracking-[0.2em] px-6 py-3.5 border border-white/25 text-white hover:bg-white hover:text-gray-900 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] cursor-pointer"
                        >
                            Đăng nhập / Đăng ký
                        </button>
                    </div>
                )}

                {/* ── Copyright ── */}
                <div className="px-8 py-4"
                    style={{
                        opacity: isMenuOpen ? 1 : 0,
                        transition: `opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${isMenuOpen ? 0.6 : 0}s`
                    }}
                >
                    <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-white/20">
                        © 2026 QuickStay. All rights reserved.
                    </p>
                </div>
            </div>


        </>

    );
}

export default Navbar
