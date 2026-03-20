import { createContext, useContext } from 'react';

const SocketContext = createContext();

/**
 * Hook truy cập SocketContext (Notification Service).
 * Tách ra file riêng để Fast Refresh hoạt động.
 */
export const useSocketContext = () => {
    return useContext(SocketContext);
};

export { SocketContext };
