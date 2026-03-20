import React, { useEffect, useSyncExternalStore, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { useUser } from '@clerk/clerk-react';
import { ChatSocketContext } from './chatSocketCore';

/**
 * ChatSocketProvider — Kết nối Socket.IO tới Chat Service (:3006).
 * Tách riêng khỏi SocketContext (Notification :3005) vì microservice
 * architecture có 2 Socket.IO servers khác nhau.
 *
 * Sử dụng useSyncExternalStore thay vì useState để tránh
 * "Calling setState synchronously within an effect" lint error.
 */

// External store cho socket instance
function createSocketStore() {
    let socket = null;
    let connected = false;
    // Cache snapshot object — useSyncExternalStore yêu cầu
    // getSnapshot trả cùng reference nếu giá trị không đổi
    let cachedSnapshot = { chatSocket: null, isChatConnected: false };
    const listeners = new Set();

    function notify() {
        // Tạo snapshot mới chỉ khi giá trị thay đổi
        cachedSnapshot = { chatSocket: socket, isChatConnected: connected };
        listeners.forEach((listener) => listener());
    }

    return {
        subscribe(listener) {
            listeners.add(listener);
            return () => listeners.delete(listener);
        },
        getSnapshot() {
            return cachedSnapshot;
        },
        setSocket(s) {
            socket = s;
            notify();
        },
        setConnected(c) {
            connected = c;
            notify();
        },
        getSocket() {
            return socket;
        },
    };
}

const socketStore = createSocketStore();

export const ChatSocketProvider = ({ children }) => {
    const { user, isLoaded } = useUser();
    const prevUserRef = useRef(null);

    useEffect(() => {
        if (isLoaded && user) {
            // Tránh tạo lại socket nếu user chưa đổi
            if (prevUserRef.current === user.id && socketStore.getSocket()) {
                return;
            }
            prevUserRef.current = user.id;

            const socketInstance = io(
                import.meta.env.VITE_CHAT_URL || 'http://localhost:3006',
                {
                    query: { userId: user.id },
                    reconnection: true,
                    reconnectionAttempts: 10,
                    reconnectionDelay: 1000,
                    reconnectionDelayMax: 5000,
                }
            );

            socketInstance.on('connect', () => {
                socketStore.setConnected(true);
                console.log(
                    `[ChatSocket] ✅ Connected as userId=${user.id} | socketId=${socketInstance.id}`
                );
            });

            socketInstance.on('disconnect', () => {
                socketStore.setConnected(false);
                console.log('[ChatSocket] ⛔ Disconnected');
            });

            socketStore.setSocket(socketInstance);

            return () => {
                socketInstance.close();
                socketStore.setSocket(null);
                socketStore.setConnected(false);
            };
        } else {
            const prev = socketStore.getSocket();
            if (prev) {
                prev.close();
                socketStore.setSocket(null);
                socketStore.setConnected(false);
            }
            prevUserRef.current = null;
        }
    }, [user, isLoaded]);

    const subscribe = useCallback((cb) => socketStore.subscribe(cb), []);
    const getSnapshot = useCallback(() => socketStore.getSnapshot(), []);
    const value = useSyncExternalStore(subscribe, getSnapshot);

    return (
        <ChatSocketContext.Provider value={value}>
            {children}
        </ChatSocketContext.Provider>
    );
};
