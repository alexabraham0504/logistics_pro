'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
    socket: Socket | null;
    isConnected: boolean;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context;
};

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
        // Only connect if user is authenticated
        if (!user?._id && !user?.role) {
            console.log('📡 [SocketContext] Waiting for authentication before connecting socket...');
            setIsConnected(false);
            setSocket(null);
            return;
        }

        // Use environment variable for socket URL (production vs development)
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const socketUrl = apiUrl.replace('/api', '').replace(/\/$/, '');
        console.log('📡 [SocketContext] User authenticated! Connecting to:', socketUrl);

        const newSocket = io(socketUrl, {
            withCredentials: true,
            transports: ['polling', 'websocket'], // Start with polling for better compatibility
            reconnectionAttempts: 5,
            timeout: 10000
        });

        newSocket.on('connect', () => {
            console.log('🔌 [SocketContext] Connected successfully! ID:', newSocket.id);
            setIsConnected(true);

            if (user?._id) {
                newSocket.emit('joinUserRoom', user._id);
                console.log('👤 [SocketContext] Joined user room:', user._id);
            }
            if (user?.role) {
                newSocket.emit('joinRoleRoom', user.role);
                console.log('👥 [SocketContext] Joined role room:', user.role);
            }
        });

        newSocket.on('connect_error', (err) => {
            console.error('❌ [SocketContext] Connection error:', err.message);
            setIsConnected(false);
        });

        newSocket.on('disconnect', (reason) => {
            console.log('🔌 [SocketContext] Disconnected:', reason);
            setIsConnected(false);
        });

        setSocket(newSocket);

        return () => {
            console.log('🔌 [SocketContext] Cleanup: Closing socket');
            newSocket.close();
        };
    }, [user?._id, user?.role]);

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
};
