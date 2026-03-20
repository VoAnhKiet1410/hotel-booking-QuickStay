import { createContext, useContext } from 'react';

const ChatSocketContext = createContext();

/**
 * Hook truy cập ChatSocket context.
 * Tách ra file riêng để Fast Refresh hoạt động.
 */
export const useChatSocket = () => {
    return useContext(ChatSocketContext);
};

export { ChatSocketContext };
