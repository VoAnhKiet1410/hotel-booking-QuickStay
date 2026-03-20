import React, { useEffect, useCallback, useRef, useSyncExternalStore } from 'react';
import { io } from 'socket.io-client';
import { useUser } from '@clerk/clerk-react';
import { SocketContext } from './socketCore';

/**
 * SocketContextProvider — Kết nối Socket.IO tới Notification Service (:3005).
 * Xử lý: newNotification, getOnlineUsers
 *
 * Sử dụng useSyncExternalStore thay vì useState để tránh
 * "Calling setState synchronously within an effect" lint error.
 */

// External store cho socket instance
function createNotifSocketStore() {
    let socket = null;
    let onlineUsers = [];
    let connected = false;
    // Cache snapshot — useSyncExternalStore yêu cầu getSnapshot
    // trả cùng reference nếu giá trị không đổi
    let cachedSnapshot = { socket: null, onlineUsers: [], isConnected: false };
    const listeners = new Set();

    function notify() {
        // Tạo snapshot mới chỉ khi giá trị thay đổi
        cachedSnapshot = { socket, onlineUsers, isConnected: connected };
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
        setOnlineUsers(users) {
            onlineUsers = users;
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

const notifStore = createNotifSocketStore();

export const SocketContextProvider = ({ children }) => {
    const { user, isLoaded } = useUser();
    const prevUserRef = useRef(null);

    useEffect(() => {
        if (isLoaded && user) {
            if (prevUserRef.current === user.id && notifStore.getSocket()) {
                return;
            }
            prevUserRef.current = user.id;

            const socketInstance = io(
                import.meta.env.VITE_API_URL || 'http://localhost:3005',
                {
                    query: { userId: user.id },
                    reconnection: true,
                    reconnectionAttempts: 10,
                    reconnectionDelay: 1000,
                    reconnectionDelayMax: 5000,
                }
            );

            socketInstance.on('connect', () => {
                notifStore.setConnected(true);
                console.log(
                    `[Socket] ✅ Connected as userId=${user.id} | socketId=${socketInstance.id}`
                );
            });

            socketInstance.on('disconnect', () => {
                notifStore.setConnected(false);
                console.log('[Socket] ⛔ Disconnected');
            });

            socketInstance.on('newNotification', (notif) => {
                console.log(
                    '[Socket] 🔔 newNotification received:',
                    notif.type,
                    notif.message?.slice(0, 50)
                );
            });

            socketInstance.on('getOnlineUsers', (users) => {
                notifStore.setOnlineUsers(users);
            });

            notifStore.setSocket(socketInstance);

            return () => {
                socketInstance.close();
                notifStore.setSocket(null);
                notifStore.setConnected(false);
                notifStore.setOnlineUsers([]);
            };
        } else {
            const prev = notifStore.getSocket();
            if (prev) {
                prev.close();
                notifStore.setSocket(null);
                notifStore.setConnected(false);
                notifStore.setOnlineUsers([]);
            }
            prevUserRef.current = null;
        }
    }, [user, isLoaded]);

    const subscribe = useCallback((cb) => notifStore.subscribe(cb), []);
    const getSnapshot = useCallback(() => notifStore.getSnapshot(), []);
    const value = useSyncExternalStore(subscribe, getSnapshot);

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
};
