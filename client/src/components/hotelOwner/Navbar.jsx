import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { assets } from '../../assets/assets'
import { UserButton, useUser } from '@clerk/clerk-react'
import { MessageCircle, Bell } from 'lucide-react'
import { useAppContext } from '../../context/appContextCore'
import { useSocketContext } from '../../context/socketCore'
import { useChatSocket } from '../../context/chatSocketCore'
import MessageDropdown from '../MessageDropdown'
import ChatModal from '../ChatModal'
import NotificationDropdown from '../NotificationDropdown'

const Navbar = () => {
    const [isMessageOpen, setIsMessageOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [activeChat, setActiveChat] = useState(null);

    // === Notification state cho owner ===
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);

    const { axios } = useAppContext();
    const { socket } = useSocketContext();
    const { chatSocket } = useChatSocket();
    const { user } = useUser();
    const location = useLocation();

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
                console.log("Failed to fetch conversations unread count:", error);
            }
        };
        fetchUnread();
    }, [user, axios, location.pathname]);

    // Handle real-time unread count updates
    useEffect(() => {
        if (!chatSocket) return;
        const handleNewMessage = (message) => {
            if (message.senderId !== user?.id && !location.pathname.includes('/owner/inbox')) {
                setUnreadCount(prev => prev + 1);
            }
        };
        chatSocket.on('newMessage', handleNewMessage);
        return () => chatSocket.off('newMessage', handleNewMessage);
    }, [chatSocket, user?.id, location.pathname]);

    // === Lắng nghe notification real-time cho owner ===
    useEffect(() => {
        if (!socket || !user) return;

        const handleNotification = (notification) => {
            const notifWithId = { ...notification, id: `notif_${Date.now()}` };
            setNotifications(prev => [notifWithId, ...prev]);
        };

        socket.on('newNotification', handleNotification);
        return () => socket.off('newNotification', handleNotification);
    }, [socket, user]);

    // === Fetch notifications từ API khi owner login (persistent) ===
    useEffect(() => {
        if (!user || !axios) return;
        const fetchNotifications = async () => {
            try {
                const { data } = await axios.get('/api/notifications');
                if (data?.success) {
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
                console.warn('[Notifications] owner fetch error:', err.message);
            }
        };
        fetchNotifications();
    }, [user, axios]);

    return (
        <div className='flex items-center justify-between px-4 md:px-8 
        border-b border-gray-300 py-3 bg-white transition-all duration-300 relative'>
            <Link to='/'>
                <img src={assets.logo} alt='logo' className='h-9 invert opacity-80'></img>
            </Link>

            <div className="flex items-center gap-2">
                {/* === Bell Notification === */}
                {user && (
                    <div className="relative">
                        <button
                            onMouseDown={(e) => { e.stopPropagation(); setIsNotifOpen(prev => !prev); }}
                            className="relative p-2 rounded-full hover:bg-slate-100 text-gray-600 transition-colors"
                        >
                            <Bell className="w-5 h-5" />
                            {notifications.length > 0 && (
                                <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border border-white">
                                    {notifications.length > 9 ? '9+' : notifications.length}
                                </span>
                            )}
                        </button>

                        {/* Notification Dropdown */}
                        <div className="absolute top-12 right-0 z-50">
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
                    </div>
                )}

                {/* === Message Icon === */}
                <div className="relative flex items-center">
                    <button
                        onMouseDown={(e) => { e.stopPropagation(); setIsMessageOpen(prev => !prev); }}
                        className="relative p-2 rounded-full hover:bg-slate-100 text-gray-600 transition-colors"
                    >
                        <MessageCircle className="w-5 h-5" />
                        {unreadCount > 0 && (
                            <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border border-white">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </button>

                    {/* Desktop Dropdown Positioned under the button */}
                    <div className="absolute top-12 right-0">
                        <MessageDropdown
                            isOpen={isMessageOpen}
                            onClose={() => setIsMessageOpen(false)}
                            onSelectConversation={setActiveChat}
                            onUnreadChange={(newTotal) => setUnreadCount(newTotal)}
                        />
                    </div>
                </div>

                <UserButton />
            </div>

            {/* Global Chat Modal */}
            {activeChat && (
                <ChatModal
                    conversation={activeChat}
                    onClose={() => setActiveChat(null)}
                />
            )}
        </div>
    )
}

export default Navbar
