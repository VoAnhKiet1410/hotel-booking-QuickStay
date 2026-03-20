import React, { useEffect, useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useAppContext } from '../context/appContextCore';
import { useSocketContext } from '../context/socketCore';
import { useChatSocket } from '../context/chatSocketCore';
import { useUser } from '@clerk/clerk-react';
import { assets } from '../assets/assets';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

const MessageDropdown = ({ isOpen, onClose, onSelectConversation, onUnreadChange, anchorRef }) => {
    const { axios } = useAppContext();
    const { onlineUsers } = useSocketContext();
    const { chatSocket } = useChatSocket();
    const { user } = useUser();

    const [conversations, setConversations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const dropdownRef = useRef(null);

    // Position state for portal-based fixed positioning
    const [pos, setPos] = useState({ top: 0, right: 0 });

    // Recalculate position when dropdown opens
    useEffect(() => {
        if (isOpen && anchorRef?.current) {
            const rect = anchorRef.current.getBoundingClientRect();
            setPos({
                top: rect.bottom + 8,
                right: window.innerWidth - rect.right,
            });
        }
    }, [isOpen, anchorRef]);

    // Fetch conversations
    useEffect(() => {
        if (!isOpen || !axios) return;


        const fetchConversations = async () => {
            try {
                setIsLoading(true);
                const { data } = await axios.get('/api/chat/conversations');
                if (data.success) {
                    setConversations(data.data);
                }
            } catch (error) {
                console.error("Failed to fetch conversations:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchConversations();
    }, [isOpen, axios]);

    // Handle new messages in real-time
    useEffect(() => {
        if (!chatSocket) return;

        const handleNewMessage = (message) => {
            setConversations(prevList => {
                const newList = [...prevList];
                const index = newList.findIndex(c => c._id === message.conversationId);

                if (index !== -1) {
                    // Cập nhật conversation có sẵn (đẩy lên đầu)
                    const updatedConv = { ...newList[index] };
                    updatedConv.lastMessage = message;
                    // Normalize senderId: có thể là object hoặc string
                    const msgSenderId = message.senderId?._id || message.senderId;
                    if (msgSenderId !== user?.id && !updatedConv.isChatOpen) {
                        updatedConv.unreadCount = (updatedConv.unreadCount || 0) + 1;
                    }
                    newList.splice(index, 1);
                    newList.unshift(updatedConv);
                } else {
                    // Có thể gọi API lại để lấy conversation mới (cho an toàn)
                    axios.get('/api/chat/conversations')
                        .then(res => res.data.success && setConversations(res.data.data));
                }
                return newList;
            });
        };

        // Khi receiver đã đọc tin nhắn → reset unread count
        const handleMessagesRead = ({ conversationId }) => {
            setConversations(prevList =>
                prevList.map(c =>
                    c._id === conversationId ? { ...c, unreadCount: 0 } : c
                )
            );
        };

        chatSocket.on('newMessage', handleNewMessage);
        chatSocket.on('messagesRead', handleMessagesRead);
        return () => {
            chatSocket.off('newMessage', handleNewMessage);
            chatSocket.off('messagesRead', handleMessagesRead);
        };
    }, [chatSocket, user?.id, axios]);

    // Close when click outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                onClose();
            }
        };
        if (isOpen) {
            // Dùng 'click' thay vì 'mousedown' để tránh race condition
            // với click handler bên trong dropdown
            document.addEventListener('click', handleClickOutside);
        }
        return () => document.removeEventListener('click', handleClickOutside);
    }, [isOpen, onClose]);

    const handleSelectConversation = async (conv) => {
        // Pass the selected conversation to Navbar to open chat
        onSelectConversation(conv);
        // Automatically close the dropdown
        onClose();

        // Đánh dấu đã đọc nếu có tin nhắn chưa đọc
        if (conv.unreadCount > 0) {
            // Cập nhật state nội bộ cho mượt
            setConversations(prev => {
                const updated = prev.map(c =>
                    c._id === conv._id ? { ...c, unreadCount: 0 } : c
                );
                // Also update Navbar unread count
                const newTotal = updated.reduce((acc, c) => acc + (c.unreadCount || 0), 0);
                if (onUnreadChange) onUnreadChange(newTotal);
                return updated;
            });

            // Bắn API
            try {
                await axios.put(`/api/chat/messages/${conv._id}/read`);
            } catch (error) {
                console.error('Failed to mark messages as read', error);
            }
        }
    };

    if (!isOpen) return null;

    return ReactDOM.createPortal(
        <div
            ref={dropdownRef}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            style={{ position: 'fixed', top: pos.top, right: pos.right, zIndex: 9999 }}
            className="w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in slide-in-from-top-2 fade-in duration-200 origin-top-right"
        >
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-white text-gray-900">
                <h3 className="font-semibold text-lg">Tin nhắn</h3>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto max-h-[400px] p-2 bg-slate-50">
                {isLoading ? (
                    <div className="flex justify-center items-center h-32">
                        <div className="w-6 h-6 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : conversations.length === 0 ? (
                    <div className="text-center text-sm text-gray-500 py-10 px-4">
                        Bạn chưa có tin nhắn nào.
                    </div>
                ) : (
                    <div className="space-y-1">
                        {conversations.map(conv => {
                            const receiver = conv.participants?.find(p => p._id !== user?.id) || {};
                            const isOnline = onlineUsers.includes(receiver._id);
                            const lastMsg = conv.lastMessage;
                            const isUnread = conv.unreadCount > 0;

                            return (
                                <button
                                    key={conv._id}
                                    onClick={() => handleSelectConversation(conv)}
                                    className="w-full flex items-start gap-4 p-3 hover:bg-white rounded-xl transition-all duration-200 text-left group border border-transparent hover:border-slate-200 hover:shadow-sm cursor-pointer"
                                >
                                    <div className="relative shrink-0">
                                        <img
                                            src={receiver.imageUrl || assets.userIcon}
                                            alt={receiver.username}
                                            className="w-12 h-12 rounded-full object-cover border border-slate-200"
                                        />
                                        {isOnline && (
                                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white"></div>
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0 pr-2">
                                        <div className="flex items-center justify-between mb-0.5">
                                            <h4 className={`text-sm truncate pr-2 ${isUnread ? 'font-bold text-gray-900' : 'font-medium text-gray-800'}`}>
                                                {receiver.username || 'Người dùng'}
                                            </h4>
                                            {lastMsg && (
                                                <span className={`text-[11px] whitespace-nowrap ${isUnread ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
                                                    {formatDistanceToNow(new Date(lastMsg.createdAt), { addSuffix: true, locale: vi })}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <p className={`text-sm truncate max-w-[180px] sm:max-w-[220px] ${isUnread ? 'text-gray-900 font-semibold' : 'text-gray-500'}`}>
                                                {lastMsg ? (
                                                    <>
                                                        {(lastMsg.senderId?._id || lastMsg.senderId) === user?.id ? 'Bạn: ' : ''}
                                                        {lastMsg.text}
                                                    </>
                                                ) : (
                                                    <span className="italic">Chưa có tin nhắn.</span>
                                                )}
                                            </p>

                                            {isUnread && (
                                                <div className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-1"></div>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
};

export default MessageDropdown;
