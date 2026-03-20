import React, { useState, useEffect, useRef } from 'react'
import { useAppContext } from '../../context/appContextCore'
import { useSocketContext } from '../../context/socketCore'
import { useChatSocket } from '../../context/chatSocketCore'
import { useUser } from '@clerk/clerk-react'
import { toast } from 'react-hot-toast'
import { format } from 'date-fns'
import { Send, CheckCheck, Info, MessageSquare } from 'lucide-react'
import { assets } from '../../assets/assets'
import Title from '../../components/Title'

const OwnerInbox = () => {
    const { user } = useUser()
    const { axios } = useAppContext()
    const { onlineUsers } = useSocketContext()
    const { chatSocket } = useChatSocket()

    const [conversations, setConversations] = useState([])
    const [messages, setMessages] = useState([])
    const [activeConversation, setActiveConversation] = useState(null)
    const [newMessage, setNewMessage] = useState('')
    const [isLoadingList, setIsLoadingList] = useState(true)
    const [isLoadingMessages, setIsLoadingMessages] = useState(false)
    const [isSending, setIsSending] = useState(false)
    const messagesEndRef = useRef(null)

    // Lấy danh sách conversation từ backend
    useEffect(() => {
        let isCancelled = false
        const fetchConversations = async () => {
            if (!axios || !user) return
            try {
                setIsLoadingList(true)
                const { data } = await axios.get('/api/chat/conversations')
                if (isCancelled) return
                if (data.success) {
                    setConversations(data.data)
                }
            } catch {
                if (!isCancelled) toast.error('Lỗi khi tải danh sách tin nhắn')
            } finally {
                if (!isCancelled) setIsLoadingList(false)
            }
        }
        fetchConversations()
        return () => { isCancelled = true }
    }, [axios, user])

    // Lắng nghe online realtime (thêm tin mới tự push vào)
    useEffect(() => {
        if (!chatSocket) return

        const handleNewMessage = (newMessage) => {
            // Update current messages if it belongs to active conversation
            if (activeConversation && activeConversation._id === newMessage.conversationId) {
                setMessages(prev => [...prev, newMessage])

                // Đánh dấu đã đọc ngay lập tức nếu đang mở
                if (newMessage.senderId !== user?.id && axios) {
                    axios.put(`/api/chat/messages/${newMessage.conversationId}/read`).catch(console.error)
                }
            }

            // Update conversation list (put to top & change updatedAt)
            setConversations(prev => {
                const updatedList = prev.map(conv => {
                    if (conv._id === newMessage.conversationId) {
                        const isUnread = (!activeConversation || activeConversation._id !== newMessage.conversationId) && newMessage.senderId !== user?.id;
                        return {
                            ...conv,
                            updatedAt: new Date().toISOString(),
                            unreadCount: isUnread ? (conv.unreadCount || 0) + 1 : conv.unreadCount
                        }
                    }
                    return conv
                })

                // Đưa cái vừa nhắn lên đầu
                updatedList.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
                return updatedList
            })
        }

        chatSocket.on('newMessage', handleNewMessage)

        return () => {
            chatSocket.off('newMessage', handleNewMessage)
        }
    }, [chatSocket, activeConversation, user?.id, axios])

    // Load messages khi chọn conversation
    useEffect(() => {
        if (!activeConversation || !axios) return

        let isCancelled = false
        const fetchMessages = async () => {
            try {
                setIsLoadingMessages(true)
                const { data } = await axios.get(`/api/chat/messages/${activeConversation._id}`)
                if (!isCancelled && data.success) {
                    setMessages(data.data)

                    // Xử lý đánh dấu đã đọc
                    if (activeConversation.unreadCount > 0) {
                        await axios.put(`/api/chat/messages/${activeConversation._id}/read`)
                        setConversations(prev => prev.map(c =>
                            c._id === activeConversation._id ? { ...c, unreadCount: 0 } : c
                        ))
                    }
                }
            } catch {
                if (!isCancelled) toast.error('Không thể tải tin nhắn trò chuyện')
            } finally {
                if (!isCancelled) setIsLoadingMessages(false)
            }
        }
        fetchMessages()
        return () => { isCancelled = true }
    }, [activeConversation, axios])

    // Cuộn xuống cuối
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    // Gửi tin nhắn
    const handleSendMessage = async (e) => {
        e.preventDefault()
        if (!newMessage.trim() || !activeConversation || isSending || !axios || !user) return

        try {
            setIsSending(true)
            const { data } = await axios.post('/api/chat/messages', {
                conversationId: activeConversation._id,
                text: newMessage.trim()
            })

            if (data.success) {
                setMessages(prev => [...prev, data.data])
                setNewMessage('')

                // Cập nhật list lên đầu
                setConversations(prev => {
                    const updatedList = prev.map(conv => {
                        if (conv._id === activeConversation._id) {
                            return { ...conv, updatedAt: new Date().toISOString() }
                        }
                        return conv
                    })
                    updatedList.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
                    return updatedList
                })
            }
        } catch {
            toast.error('Lỗi khi gửi tin nhắn')
        } finally {
            setIsSending(false)
        }
    }

    // Helper: Lấy thông tin người đối diện từ conversation.participants
    const getOtherParticipant = (conversation) => {
        if (!conversation || !user) return null
        return conversation.participants.find(p => p._id !== user.id)
    }

    // Giao diện list
    const renderConversationsList = () => {
        if (isLoadingList) {
            return (
                <div className="flex justify-center items-center h-full">
                    <div className="h-6 w-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
            )
        }

        if (conversations.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4 text-center">
                    <MessageSquare className="h-10 w-10 mb-3 text-slate-300" />
                    <p className="text-sm font-medium">Chưa có tin nhắn nào</p>
                    <p className="text-xs text-slate-400 mt-1">Khi khách hàng liên hệ đặt phòng, tin nhắn sẽ hiển thị tại đây.</p>
                </div>
            )
        }

        return (
            <div className="space-y-1 p-2">
                {conversations.map(conv => {
                    const otherUser = getOtherParticipant(conv)
                    if (!otherUser) return null

                    const isOnline = onlineUsers.includes(otherUser._id)
                    const isActive = activeConversation?._id === conv._id
                    const isUnread = conv.unreadCount > 0

                    return (
                        <div
                            key={conv._id}
                            onClick={() => setActiveConversation(conv)}
                            className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${isActive ? 'bg-indigo-50 border-r-4 border-indigo-600' : 'hover:bg-slate-50 border-r-4 border-transparent'}`}
                        >
                            <div className="relative shrink-0">
                                <img
                                    src={otherUser.imageUrl || assets.userIcon}
                                    alt="avatar"
                                    className="w-10 h-10 rounded-full object-cover border border-slate-200"
                                />
                                {isOnline && (
                                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white"></div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0 pr-2">
                                <h4 className={`text-sm truncate ${isUnread && !isActive ? 'font-bold text-slate-900' : 'font-semibold text-slate-800'}`}>
                                    {otherUser.username || 'Khách hàng'}
                                </h4>
                                <div className="flex items-center justify-between mt-0.5">
                                    <p className={`text-xs truncate ${isUnread && !isActive ? 'text-slate-800 font-medium' : 'text-slate-500'}`}>
                                        Nhấp để xem cuộc trò chuyện
                                    </p>
                                    {isUnread && !isActive && (
                                        <div className="flex items-center justify-center w-4 h-4 rounded-full bg-red-500 text-[9px] font-bold text-white leading-none">
                                            {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="text-[10px] text-slate-400 shrink-0 self-start mt-1">
                                {format(new Date(conv.updatedAt), 'HH:mm')}
                            </div>
                        </div>
                    )
                })}
            </div>
        )
    }

    // Giao diện Khung chat (Bên phải)
    const renderChatArea = () => {
        if (!activeConversation) {
            return (
                <div className="flex flex-col items-center justify-center h-full bg-slate-50/50">
                    <div className="bg-white p-6 rounded-full shadow-sm border border-slate-100 mb-4">
                        <MessageSquare className="h-10 w-10 text-indigo-200" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-800">Tin nhắn của bạn</h3>
                    <p className="text-slate-500 text-sm mt-2 max-w-sm text-center">
                        Chọn một cuộc trò chuyện từ danh sách bên trái để phản hồi khách hàng của bạn.
                    </p>
                </div>
            )
        }

        const otherUser = getOtherParticipant(activeConversation)
        const isOnline = otherUser ? onlineUsers.includes(otherUser._id) : false

        return (
            <div className="flex flex-col h-full bg-white">
                {/* Header chat */}
                <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-200 bg-white">
                    <img
                        src={otherUser?.imageUrl || assets.userIcon}
                        alt="avatar"
                        className="w-10 h-10 rounded-full object-cover border border-slate-200"
                    />
                    <div>
                        <h3 className="font-semibold text-slate-900">{otherUser?.username || 'Khách hàng'}</h3>
                        <p className={`text-xs ${isOnline ? 'text-emerald-500' : 'text-slate-500'}`}>
                            {isOnline ? 'Đang hoạt động' : 'Ngoại tuyến'}
                        </p>
                    </div>
                </div>

                {/* Khung tin nhắn */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50 space-y-4">
                    {isLoadingMessages ? (
                        <div className="flex justify-center items-center h-full">
                            <div className="h-6 w-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400">
                            <Info className="h-8 w-8 mb-2 opacity-50" />
                            <p className="text-sm">Hãy gửi lời chào đến khách hàng của bạn!</p>
                        </div>
                    ) : (
                        messages.map((msg, index) => {
                            const isMine = msg.senderId._id === user?.id

                            return (
                                <div
                                    key={msg._id || index}
                                    className={`flex w-full ${isMine ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`flex flex-col gap-1 max-w-[75%] ${isMine ? 'items-end' : 'items-start'}`}>
                                        <div
                                            className={`px-4 py-2 text-sm ${isMine ? 'bg-indigo-600 text-white rounded-2xl rounded-tr-sm' : 'bg-white border border-slate-200 text-slate-800 rounded-2xl rounded-tl-sm shadow-sm'}`}
                                        >
                                            {msg.text}
                                        </div>
                                        <div className="flex items-center gap-1.5 px-1">
                                            <span className="text-[10px] text-slate-400">
                                                {format(new Date(msg.createdAt), 'HH:mm')}
                                            </span>
                                            {isMine && <CheckCheck className="h-3 w-3 text-slate-400" />}
                                        </div>
                                    </div>
                                </div>
                            )
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Vùng nhập tin nhắn */}
                <div className="p-4 bg-white border-t border-slate-200">
                    <form
                        onSubmit={handleSendMessage}
                        className="flex items-center gap-2 bg-slate-100 rounded-full pr-2 pl-4 py-1.5 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:bg-indigo-50/50 transition-all border border-transparent focus-within:border-indigo-200"
                    >
                        <input
                            type="text"
                            className="flex-1 bg-transparent py-2 text-sm outline-none placeholder:text-slate-500"
                            placeholder="Nhập tin nhắn..."
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                        />
                        <button
                            type="submit"
                            disabled={!newMessage.trim() || isSending}
                            className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors shrink-0"
                        >
                            <Send className="h-4 w-4 ml-0.5" />
                        </button>
                    </form>
                </div>
            </div>
        )
    }

    return (
        <div className="h-full flex flex-col">
            <div className="mb-4">
                <Title align="left" font="font-outfit" title="Hộp thư đến" subTitle="Trò chuyện và hỗ trợ khách hàng đặt phòng trực tiếp." />
            </div>

            <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex min-h-[500px]">
                {/* Column Trái: Danh Sách Chat */}
                <div className="w-full md:w-80 lg:w-96 border-r border-slate-200 bg-white flex flex-col">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                        <h2 className="font-bold text-slate-800">Tin nhắn</h2>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {renderConversationsList()}
                    </div>
                </div>

                {/* Column Phải: Nội dung Chat (Hiện trên desktop, hoặc khi đã chọn trên Mobile) */}
                <div className={`flex-1 ${!activeConversation ? 'hidden md:flex flex-col' : 'flex flex-col'} bg-slate-50`}>
                    {renderChatArea()}
                </div>
            </div>
        </div>
    )
}

export default OwnerInbox
