import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useAppContext } from '../context/appContextCore';
import { useSocketContext } from '../context/socketCore';
import { useChatSocket } from '../context/chatSocketCore';
import { assets } from '../assets/assets';

// ── Sound notification (using Web Audio API) ──
const playMessageSound = () => {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + 0.3);
    } catch {
        // Silently fail
    }
};

// ── Format timestamp ──
const formatTime = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
};

const formatDateSeparator = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return 'Hôm nay';
    if (date.toDateString() === yesterday.toDateString()) return 'Hôm qua';
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

// ── Typing dots animation ──
const TypingIndicator = () => (
    <div className="flex justify-start gap-2 px-1 mt-1">
        <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-none px-4 py-2.5 shadow-sm">
            <div className="flex gap-1 items-center h-4">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
        </div>
    </div>
);

const ChatModal = ({ conversation, onClose }) => {
    const { user } = useUser();
    const { axios } = useAppContext();
    const { onlineUsers } = useSocketContext();
    const { chatSocket } = useChatSocket();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isReceiverTyping, setIsReceiverTyping] = useState(false);
    const [allRead, setAllRead] = useState(false);
    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const isTypingRef = useRef(false);
    const inputRef = useRef(null);

    // ── Pagination ──
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [oldestMsgId, setOldestMsgId] = useState(null);
    const scrollContainerRef = useRef(null);

    const receiver = conversation?.participants?.find(p => p._id !== user?.id) || {};
    const isOnline = onlineUsers.includes(receiver._id);

    // ── Join conversation room ──
    useEffect(() => {
        if (!chatSocket || !conversation?._id) return;
        chatSocket.emit('joinConversation', conversation._id);
        return () => chatSocket.emit('leaveConversation', conversation._id);
    }, [chatSocket, conversation?._id]);

    // ── Fetch messages ──
    useEffect(() => {
        if (!conversation?._id || !axios) return;
        let cancelled = false;

        const fetchMessages = async () => {
            try {
                setIsLoading(true);
                const { data } = await axios.get(`/api/chat/messages/${conversation._id}?limit=50`);
                if (cancelled) return;
                if (data.success) {
                    const msgs = data.data || [];
                    setMessages(msgs);
                    setHasMore(data.hasMore ?? false);
                    if (msgs.length > 0) setOldestMsgId(msgs[0]._id);
                }
            } catch (error) {
                console.error('Failed to fetch messages:', error);
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        };

        fetchMessages();
        return () => { cancelled = true; };
    }, [conversation?._id, axios]);

    // ── Auto mark read ──
    useEffect(() => {
        if (!conversation?._id || !axios) return;
        axios.put(`/api/chat/messages/${conversation._id}/read`).catch(() => { });
    }, [conversation?._id, axios]);

    // ── Socket events ──
    useEffect(() => {
        if (!chatSocket) return;

        const handleNewMessage = (message) => {
            if (message.conversationId === conversation?._id) {
                setMessages(prev => [...prev, message]);
                setAllRead(false);
                axios?.put(`/api/chat/messages/${conversation._id}/read`).catch(() => { });
                if ((message.senderId?._id || message.senderId) !== user?.id) {
                    playMessageSound();
                }
            }
        };

        const handleMessagesRead = ({ conversationId }) => {
            if (conversationId === conversation?._id) setAllRead(true);
        };

        const handleTyping = ({ conversationId: cId }) => {
            if (cId === conversation?._id) setIsReceiverTyping(true);
        };

        const handleStopTyping = ({ conversationId: cId }) => {
            if (cId === conversation?._id) setIsReceiverTyping(false);
        };

        chatSocket.on('newMessage', handleNewMessage);
        chatSocket.on('messagesRead', handleMessagesRead);
        chatSocket.on('typing', handleTyping);
        chatSocket.on('stopTyping', handleStopTyping);

        return () => {
            chatSocket.off('newMessage', handleNewMessage);
            chatSocket.off('messagesRead', handleMessagesRead);
            chatSocket.off('typing', handleTyping);
            chatSocket.off('stopTyping', handleStopTyping);
        };
    }, [chatSocket, conversation?._id, axios, user?.id]);

    // ── Auto-scroll ──
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isReceiverTyping]);

    // ── Focus input on mount ──
    useEffect(() => {
        setTimeout(() => inputRef.current?.focus(), 300);
    }, []);

    // ── Typing emit ──
    const handleTypingEmit = useCallback(() => {
        if (!chatSocket || !receiver._id) return;
        if (!isTypingRef.current) {
            isTypingRef.current = true;
            chatSocket.emit('typing', { conversationId: conversation?._id, receiverId: receiver._id });
        }
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            isTypingRef.current = false;
            chatSocket.emit('stopTyping', { conversationId: conversation?._id, receiverId: receiver._id });
        }, 2000);
    }, [chatSocket, conversation?._id, receiver._id]);

    // ── Send message ──
    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !axios || !conversation?._id) return;

        // Stop typing
        if (isTypingRef.current) {
            isTypingRef.current = false;
            chatSocket?.emit('stopTyping', { conversationId: conversation._id, receiverId: receiver._id });
        }
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

        const tempId = `temp_${Date.now()}`;
        const tempMsg = {
            _id: tempId,
            text: newMessage,
            senderId: { _id: user.id },
            createdAt: new Date().toISOString(),
            _isTemp: true,
        };
        setMessages(prev => [...prev, tempMsg]);
        setAllRead(false);
        const messageToSend = newMessage;
        setNewMessage('');

        try {
            const { data } = await axios.post('/api/chat/messages', {
                conversationId: conversation._id,
                text: messageToSend,
            });
            if (data.success) {
                setMessages(prev => prev.map(m => m._id === tempId ? data.data : m));
            }
        } catch (error) {
            console.error('Failed to send message:', error);
            setMessages(prev => prev.filter(m => m._id !== tempId));
        }
    };

    // ── Load older messages ──
    const loadMoreMessages = useCallback(async () => {
        if (!hasMore || isLoadingMore || !axios || !conversation?._id || !oldestMsgId) return;
        setIsLoadingMore(true);
        const container = scrollContainerRef.current;
        const prevScrollHeight = container?.scrollHeight || 0;

        try {
            const { data } = await axios.get(`/api/chat/messages/${conversation._id}?limit=30&before=${oldestMsgId}`);
            if (data.success) {
                const olderMsgs = data.data || [];
                if (olderMsgs.length > 0) {
                    setMessages(prev => [...olderMsgs, ...prev]);
                    setOldestMsgId(olderMsgs[0]._id);
                    setHasMore(data.hasMore ?? false);
                    requestAnimationFrame(() => {
                        if (container) container.scrollTop = container.scrollHeight - prevScrollHeight;
                    });
                } else {
                    setHasMore(false);
                }
            }
        } catch (error) {
            console.error('Failed to load more messages:', error);
        } finally {
            setIsLoadingMore(false);
        }
    }, [hasMore, isLoadingMore, axios, conversation?._id, oldestMsgId]);

    const handleScroll = useCallback((e) => {
        if (e.target.scrollTop < 50 && hasMore && !isLoadingMore) loadMoreMessages();
    }, [hasMore, isLoadingMore, loadMoreMessages]);

    if (!conversation) return null;

    // ── Helpers ──
    const shouldShowDate = (msg, prevMsg) => {
        if (!prevMsg) return true;
        return new Date(msg.createdAt).toDateString() !== new Date(prevMsg.createdAt).toDateString();
    };

    const lastSentMsg = [...messages].reverse().find(
        m => (m.senderId?._id || m.senderId) === user?.id
    );

    return (
        <div className="fixed bottom-0 right-0 sm:bottom-6 sm:right-6 z-[100] pointer-events-auto">
            {/*
              ┌─ CRITICAL FIX for scrolling ─┐
              │ The outer box uses EXPLICIT height + flex column.            │
              │ The body div uses flex-1 + min-h-0 + overflow-y-auto.       │
              │ Without min-h-0, flex children default to min-height: auto, │
              │ which PREVENTS overflow-y-auto from working.                │
              └──────────────────────────────────────────────────────────────┘
            */}
            <div
                className="bg-white sm:rounded-2xl shadow-2xl border border-slate-200
                    w-full sm:w-[380px] md:w-[400px]
                    h-[100dvh] sm:h-[520px] sm:max-h-[85vh]
                    flex flex-col overflow-hidden"
                style={{ animation: 'chatSlideUp 0.3s ease-out' }}
                onWheel={(e) => e.stopPropagation()}
            >
                {/* ═══ Header ═══ */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-white shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <img
                                src={receiver.imageUrl || assets.userIcon}
                                alt={receiver.username || 'User'}
                                className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-100"
                            />
                            <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${isOnline ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-sm font-semibold text-gray-900 truncate">
                                {receiver.username || 'Chủ nhà'}
                            </h3>
                            <p className="text-[11px] leading-tight">
                                {isReceiverTyping ? (
                                    <span className="text-blue-500 font-medium animate-pulse">Đang nhập...</span>
                                ) : isOnline ? (
                                    <span className="text-emerald-500">Đang hoạt động</span>
                                ) : (
                                    <span className="text-gray-400">Ngoại tuyến</span>
                                )}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 active:scale-95 transition-all text-slate-400 hover:text-slate-600"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* ═══ Messages Body — THE SCROLLABLE AREA ═══ */}
                <div
                    ref={scrollContainerRef}
                    onScroll={handleScroll}
                    onWheel={(e) => {
                        // Prevent page scroll when scrolling inside chat
                        const el = e.currentTarget;
                        const { scrollTop, scrollHeight, clientHeight } = el;
                        const atTop = scrollTop <= 0 && e.deltaY < 0;
                        const atBottom = scrollTop + clientHeight >= scrollHeight - 1 && e.deltaY > 0;
                        if (atTop || atBottom) {
                            e.preventDefault();
                        }
                        e.stopPropagation();
                    }}
                    className="flex-1 min-h-0 overflow-y-auto p-4 bg-gradient-to-b from-slate-50 to-white chat-scrollbar"
                    style={{ overscrollBehavior: 'contain' }}
                >
                    {/* Load more spinner */}
                    {isLoadingMore && (
                        <div className="flex justify-center py-3">
                            <div className="w-5 h-5 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" />
                        </div>
                    )}

                    {isLoading ? (
                        <div className="flex flex-col justify-center items-center h-full gap-2">
                            <div className="w-6 h-6 border-2 border-gray-900 rounded-full animate-spin border-t-transparent" />
                            <span className="text-xs text-gray-400">Đang tải...</span>
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center px-6">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                            </div>
                            <p className="text-sm text-gray-500 font-medium">Chưa có tin nhắn nào</p>
                            <p className="text-xs text-gray-400 mt-1">Gửi lời chào để bắt đầu cuộc trò chuyện!</p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {messages.map((msg, idx) => {
                                const isMe = (msg.senderId?._id || msg.senderId) === user?.id;
                                const prevMsg = idx > 0 ? messages[idx - 1] : null;
                                const nextMsg = idx < messages.length - 1 ? messages[idx + 1] : null;
                                const showDate = shouldShowDate(msg, prevMsg);
                                const isLastSent = msg._id === lastSentMsg?._id;

                                // Group consecutive messages from same sender
                                const prevSameUser = prevMsg && (prevMsg.senderId?._id || prevMsg.senderId) === (msg.senderId?._id || msg.senderId);
                                const nextSameUser = nextMsg && (nextMsg.senderId?._id || nextMsg.senderId) === (msg.senderId?._id || msg.senderId);
                                const showAvatar = !isMe && !nextSameUser;

                                return (
                                    <React.Fragment key={msg._id || idx}>
                                        {/* Date separator */}
                                        {showDate && (
                                            <div className="flex items-center gap-3 py-3">
                                                <div className="flex-1 h-px bg-slate-200" />
                                                <span className="text-[10px] text-slate-400 font-medium bg-white px-2 py-0.5 rounded-full border border-slate-100">
                                                    {formatDateSeparator(msg.createdAt)}
                                                </span>
                                                <div className="flex-1 h-px bg-slate-200" />
                                            </div>
                                        )}

                                        <div
                                            className={`flex ${isMe ? 'justify-end' : 'justify-start'} gap-1.5 group ${!prevSameUser ? 'mt-3' : 'mt-0.5'}`}
                                        >
                                            {/* Avatar column */}
                                            {!isMe && (
                                                <div className="w-7 shrink-0 flex items-end">
                                                    {showAvatar && (
                                                        <img
                                                            src={msg.senderId?.imageUrl || assets.userIcon}
                                                            alt="avatar"
                                                            className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-100"
                                                        />
                                                    )}
                                                </div>
                                            )}

                                            {/* Message content */}
                                            <div className={`flex flex-col max-w-[80%] ${isMe ? 'items-end' : 'items-start'}`}>
                                                <div
                                                    className={`px-3.5 py-2 text-[13px] leading-relaxed break-words ${isMe
                                                        ? `bg-gray-900 text-white ${msg._isTemp ? 'opacity-50' : ''} ${!nextSameUser ? 'rounded-2xl rounded-br-sm' : 'rounded-2xl'}`
                                                        : `bg-white text-gray-800 border border-slate-200/80 shadow-sm ${!nextSameUser ? 'rounded-2xl rounded-bl-sm' : 'rounded-2xl'}`
                                                        }`}
                                                >
                                                    {msg.text}
                                                </div>

                                                {/* Timestamp — show on hover or for last in group */}
                                                <span className={`text-[9px] mt-0.5 px-1 transition-opacity duration-200 ${!nextSameUser
                                                    ? 'opacity-60'
                                                    : 'opacity-0 group-hover:opacity-60'
                                                    } ${isMe ? 'text-gray-400' : 'text-gray-400'}`}>
                                                    {formatTime(msg.createdAt)}
                                                </span>

                                                {/* Seen indicator */}
                                                {isMe && isLastSent && allRead && !msg._isTemp && (
                                                    <span className="text-[9px] text-blue-500 font-medium px-1 flex items-center gap-1">
                                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                        </svg>
                                                        Đã xem
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </React.Fragment>
                                );
                            })}
                        </div>
                    )}

                    {/* Typing indicator */}
                    {isReceiverTyping && <TypingIndicator />}

                    <div ref={messagesEndRef} />
                </div>

                {/* ═══ Input Footer ═══ */}
                <div className="px-3 py-2.5 bg-white border-t border-slate-100 shrink-0">
                    <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                        <input
                            ref={inputRef}
                            type="text"
                            value={newMessage}
                            onChange={(e) => {
                                setNewMessage(e.target.value);
                                handleTypingEmit();
                            }}
                            placeholder="Nhập tin nhắn..."
                            className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-4 py-2.5 h-10 text-sm outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-200 transition-all placeholder:text-slate-400"
                        />
                        <button
                            type="submit"
                            disabled={!newMessage.trim()}
                            className="w-10 h-10 flex-shrink-0 bg-gray-900 hover:bg-black active:scale-95 text-white rounded-full flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:active:scale-100"
                        >
                            <svg className="w-4 h-4 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                            </svg>
                        </button>
                    </form>
                </div>
            </div>

            {/* Inline styles: animation + visible scrollbar */}
            <style>{`
                @keyframes chatSlideUp {
                    from { opacity: 0; transform: translateY(20px) scale(0.97); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                .chat-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .chat-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .chat-scrollbar::-webkit-scrollbar-thumb {
                    background-color: rgba(0, 0, 0, 0.15);
                    border-radius: 3px;
                }
                .chat-scrollbar::-webkit-scrollbar-thumb:hover {
                    background-color: rgba(0, 0, 0, 0.3);
                }
                .chat-scrollbar {
                    scrollbar-width: thin;
                    scrollbar-color: rgba(0,0,0,0.15) transparent;
                }
            `}</style>
        </div>
    );
};

export default ChatModal;
