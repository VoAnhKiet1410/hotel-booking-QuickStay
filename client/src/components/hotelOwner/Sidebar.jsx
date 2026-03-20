import React, { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
    LayoutDashboard, CalendarCheck, PlusCircle, List, Building2,
    ChevronLeft, ChevronRight, Menu, Tag, MessageSquare, CalendarDays, RotateCcw, UserCheck, DollarSign, SprayCan, Moon
} from 'lucide-react'
import { useAppContext } from '../../context/appContextCore'
import { useSocketContext } from '../../context/socketCore'
import { useChatSocket } from '../../context/chatSocketCore'
import { useUser } from '@clerk/clerk-react'

const Sidebar = () => {
    const [collapsed, setCollapsed] = useState(false)
    const [unreadCount, setUnreadCount] = useState(0)
    const [pendingRefunds, setPendingRefunds] = useState(0)

    const { axios } = useAppContext()
    const { socket } = useSocketContext()
    const { chatSocket } = useChatSocket()
    const { user } = useUser()
    const location = useLocation()

    // Fetch initial unread count
    useEffect(() => {
        if (!user || !axios) return;
        const fetchUnread = async () => {
            try {
                const { data } = await axios.get('/api/chat/conversations');
                if (data.success) {
                    const total = data.data.reduce((acc, conv) => acc + (conv.unreadCount || 0), 0);
                    setUnreadCount(total);
                }
            } catch (error) {
                console.log("Failed to fetch conversations global count:", error);
            }
        };
        fetchUnread();
    }, [user, axios, location.pathname]); // Re-fetch on path change to clear badge if visited

    // Fetch pending refund requests count
    useEffect(() => {
        if (!user || !axios) return;
        let cancelled = false;
        const fetchRefundCount = async () => {
            try {
                const { data } = await axios.get('/api/bookings/owner/refund-requests');
                if (!cancelled && data.success) setPendingRefunds(data.data?.length || 0);
            } catch { /* silent */ }
        };
        fetchRefundCount();
        return () => { cancelled = true; };
    }, [user, axios, location.pathname]);

    // Handle real-time unread count updates
    useEffect(() => {
        if (!chatSocket) return;
        const handleNewMessage = (message) => {
            // Only increment if not on the inbox page (inbox handles its own reads)
            if (message.senderId !== user?.id && !location.pathname.includes('/owner/inbox')) {
                setUnreadCount(prev => prev + 1);
            }
        };
        chatSocket.on('newMessage', handleNewMessage);
        return () => chatSocket.off('newMessage', handleNewMessage);
    }, [chatSocket, user?.id, location.pathname]);

    // Real-time: khi nhận thông báo yêu cầu hoàn tiền → tăng badge ngay
    useEffect(() => {
        if (!socket) return;
        const handleNotification = (notification) => {
            if (notification.type === 'booking_refund_requested') {
                setPendingRefunds(prev => prev + 1);
            }
        };
        socket.on('newNotification', handleNotification);
        return () => socket.off('newNotification', handleNotification);
    }, [socket]);

    const sidebarLinks = [
        { name: 'Tổng quan', path: '/owner', icon: LayoutDashboard },
        { name: 'Tin nhắn', path: '/owner/inbox', icon: MessageSquare, hasBadge: true, badgeCount: unreadCount },
        { name: 'Đặt phòng', path: '/owner/bookings', icon: CalendarCheck },
        { name: 'Nhận/Trả phòng', path: '/owner/check-in-out', icon: UserCheck },
        { name: 'Lịch phòng', path: '/owner/calendar', icon: CalendarDays },
        { name: 'Hoàn tiền', path: '/owner/refund-requests', icon: RotateCcw, hasBadge: true, badgeCount: pendingRefunds, badgeColor: 'bg-amber-500' },
        { name: 'Doanh thu', path: '/owner/revenue', icon: DollarSign },
        { name: 'Vệ sinh phòng', path: '/owner/housekeeping', icon: SprayCan },
        { name: 'Chốt sổ ngày', path: '/owner/night-audit', icon: Moon },
        { name: 'Thêm phòng', path: '/owner/add-room', icon: PlusCircle },
        { name: 'Danh sách phòng', path: '/owner/list-rooms', icon: List },
        { name: 'Ưu đãi', path: '/owner/promotions', icon: Tag },
        { name: 'Khách sạn', path: '/owner/hotel-info', icon: Building2 },
    ]

    return (
        <aside className={`flex h-full flex-col border-r border-slate-200 bg-white transition-all duration-300 ${collapsed ? 'w-16' : 'w-16 md:w-64'
            }`}>
            {/* Header */}
            <div className="flex h-14 items-center justify-between border-b border-slate-100 px-3">
                <span className={`font-semibold text-slate-900 transition-opacity ${collapsed ? 'hidden' : 'hidden md:block'
                    }`}>
                    Quản trị
                </span>
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="hidden rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 md:block"
                >
                    {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                </button>
                <Menu className="h-5 w-5 text-slate-400 md:hidden" />
            </div>

            {/* Navigation */}
            <nav className="flex flex-1 flex-col gap-1 p-2">
                {sidebarLinks.map((item) => {
                    const Icon = item.icon
                    return (
                        <NavLink
                            to={item.path}
                            key={item.path}
                            end={item.path === '/owner'}
                            className={({ isActive }) =>
                                `group relative flex items-center justify-between rounded-xl px-3 py-2.5 transition-all ${isActive
                                    ? 'bg-indigo-50 text-indigo-600'
                                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                }`
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <div className="flex items-center gap-3 relative">
                                        <div className="relative">
                                            <Icon className={`h-5 w-5 shrink-0 ${isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                                            {item.hasBadge && (item.badgeCount ?? unreadCount) > 0 && collapsed && (
                                                <span className={`absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full text-[8px] font-bold text-white border border-white ${item.badgeColor || 'bg-red-500'}`}></span>
                                            )}
                                        </div>
                                        <span className={`text-sm font-medium transition-opacity ${collapsed ? 'hidden' : 'hidden md:block'
                                            }`}>
                                            {item.name}
                                        </span>
                                    </div>

                                    {/* Badge for expanded view */}
                                    {item.hasBadge && (item.badgeCount ?? unreadCount) > 0 && !collapsed && (
                                        <span className={`flex h-5 items-center justify-center rounded-full px-2 text-[10px] font-bold text-white shadow-sm hidden md:flex ${item.badgeColor || 'bg-red-500'}`}>
                                            {(item.badgeCount ?? unreadCount) > 99 ? '99+' : (item.badgeCount ?? unreadCount)}
                                        </span>
                                    )}

                                    {isActive && (
                                        <span className="absolute right-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-l-full bg-indigo-600" />
                                    )}
                                </>
                            )}
                        </NavLink>
                    )
                })}
            </nav>


        </aside>
    )
}

export default Sidebar
