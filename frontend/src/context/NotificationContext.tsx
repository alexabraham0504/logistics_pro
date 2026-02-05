'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useSocket } from './SocketContext';
import { IoNotificationsOutline, IoCheckmarkCircle, IoWarning, IoRocket, IoGlobe, IoClose, IoTrashOutline } from 'react-icons/io5';
import { format } from 'date-fns';

export interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    timestamp: Date;
    read: boolean;
    data?: any;
}

interface NotificationContextType {
    notifications: Notification[];
    addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    clearAll: () => void;
    unreadCount: number;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const { socket } = useSocket();

    // Persistent storage simulation (could be moved to backend later)
    useEffect(() => {
        const saved = localStorage.getItem('notifications');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setNotifications(parsed.map((n: any) => ({ ...n, timestamp: new Date(n.timestamp) })));
            } catch (e) {
                console.error('Failed to load notifications');
            }
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('notifications', JSON.stringify(notifications));
    }, [notifications]);

    const addNotification = useCallback((payload: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
        const newNotification: Notification = {
            ...payload,
            id: Math.random().toString(36).substr(2, 9),
            timestamp: new Date(),
            read: false
        };
        setNotifications(prev => [newNotification, ...prev].slice(0, 50));
    }, []);

    const markAsRead = (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    };

    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const clearAll = () => setNotifications([]);
    const unreadCount = notifications.filter(n => !n.read).length;

    useEffect(() => {
        if (!socket) return;

        const handleNotification = (payload: any) => {
            const { type, data } = payload;
            let title = 'System Update';

            switch (type) {
                case 'STATUS_UPDATE': title = '🚢 Export Status Update'; break;
                case 'POD_GENERATED': title = '✅ Delivery Confirmed'; break;
                case 'SAFETY_ALERT': title = '⚠️ Safety Alert'; break;
                case 'EXPORT_UPDATE': title = '🌍 Export Journey'; break;
            }

            addNotification({ type, title, message: data.message || 'New activity', data });
        };

        socket.on('notification', handleNotification);
        return () => { socket.off('notification', handleNotification); };
    }, [socket, addNotification]);

    return (
        <NotificationContext.Provider value={{ notifications, addNotification, markAsRead, markAllAsRead, clearAll, unreadCount }}>
            {children}

            {/* T-TOP TOAST OVERLAY */}
            <div style={{
                position: 'fixed',
                top: '24px',
                right: '24px',
                zIndex: 999999,
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                width: '360px',
                pointerEvents: 'none'
            }}>
                {notifications.filter(n => !n.read).slice(0, 3).map((notif) => (
                    <NotificationToast key={notif.id} notification={notif} />
                ))}
            </div>
        </NotificationContext.Provider>
    );
};

const NotificationToast: React.FC<{ notification: Notification }> = ({ notification }) => {
    const { markAsRead } = useNotifications();
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
            // We don't mark as read automatically here if we want them saved in history
            // but we hide the toast
        }, 6000);
        return () => clearTimeout(timer);
    }, []);

    if (!isVisible) return null;

    const getIcon = () => {
        switch (notification.type) {
            case 'SAFETY_ALERT': return <IoWarning color="#f59e0b" size={24} />;
            case 'POD_GENERATED': return <IoCheckmarkCircle color="#10b981" size={24} />;
            default: return <IoRocket color="#3b82f6" size={24} />;
        }
    };

    return (
        <div
            onClick={() => setIsVisible(false)}
            style={{
                pointerEvents: 'auto',
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                border: '1px solid #e5e7eb',
                borderRadius: '16px',
                padding: '16px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                display: 'flex',
                gap: '12px',
                cursor: 'pointer',
                animation: 'slideInTop 0.5s ease-out forwards',
            }}
        >
            <style>{`
                @keyframes slideInTop {
                    from { transform: translateY(-100%); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `}</style>

            <div style={{ flexShrink: 0 }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {getIcon()}
                </div>
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>{notification.title}</div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>{notification.message}</div>
            </div>

            <button style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>
                <IoClose size={20} />
            </button>
        </div>
    );
};

// BELL ICON COMPONENT
export const NotificationBell: React.FC = () => {
    const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotifications();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div style={{ position: 'relative' }} ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    background: 'none',
                    border: 'none',
                    padding: '8px',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    position: 'relative',
                    color: '#6b7280',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s',
                    outline: 'none'
                }}
            >
                <IoNotificationsOutline size={24} />
                {unreadCount > 0 && (
                    <span style={{
                        position: 'absolute',
                        top: '6px',
                        right: '6px',
                        background: '#ef4444',
                        color: 'white',
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '2px 5px',
                        borderRadius: '10px',
                        border: '2px solid white',
                        minWidth: '18px'
                    }}>
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '12px',
                    width: '320px',
                    maxHeight: '480px',
                    background: 'white',
                    borderRadius: '20px',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0,0,0,0.05)',
                    zIndex: 1000,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden'
                }}>
                    <div style={{ padding: '16px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 700, color: '#111827' }}>Notifications</span>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button onClick={markAllAsRead} style={{ fontSize: '11px', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Mark all read</button>
                            <button onClick={clearAll} style={{ fontSize: '11px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Clear</button>
                        </div>
                    </div>

                    <div style={{ overflowY: 'auto', flex: 1, padding: '8px' }}>
                        {notifications.length === 0 ? (
                            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#9ca3af' }}>
                                <IoNotificationsOutline size={40} style={{ opacity: 0.3, marginBottom: '12px' }} />
                                <div style={{ fontSize: '13px' }}>No notifications yet</div>
                            </div>
                        ) : (
                            notifications.map((notif) => (
                                <div
                                    key={notif.id}
                                    onClick={() => markAsRead(notif.id)}
                                    style={{
                                        padding: '12px',
                                        borderRadius: '12px',
                                        cursor: 'pointer',
                                        background: notif.read ? 'transparent' : '#f9fafb',
                                        transition: 'background 0.2s',
                                        display: 'flex',
                                        gap: '12px',
                                        marginBottom: '4px',
                                        borderLeft: notif.read ? 'none' : '3px solid #3b82f6'
                                    }}
                                >
                                    <div style={{
                                        width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6', marginTop: '6px',
                                        visibility: notif.read ? 'hidden' : 'visible'
                                    }} />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>{notif.title}</div>
                                        <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>{notif.message}</div>
                                        <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '6px' }}>
                                            {format(notif.timestamp, 'hh:mm a, dd MMM')}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div style={{ padding: '12px', textAlign: 'center', borderTop: '1px solid #f3f4f6' }}>
                        <button style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer' }}>
                            View all activity
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
