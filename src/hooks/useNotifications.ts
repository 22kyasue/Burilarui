import { useState, useEffect, useCallback } from 'react';
import { Notification } from '../types/notification';

export function useNotifications() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = useCallback(async () => {
        try {
            // In a real app, you might want to fetch all or just unread.
            // For the ticker, we probably want unread ones.
            const response = await fetch('/api/notifications?unread_only=true');
            if (response.ok) {
                const data = await response.json();
                setNotifications(data);
                setUnreadCount(data.length);
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        }
    }, []);

    const markAsRead = async (id: string) => {
        try {
            const response = await fetch('/api/notifications/read', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id }),
            });

            if (response.ok) {
                // Optimistic update
                setNotifications(prev => prev.filter(n => n.id !== id));
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    // Poll every 30 seconds
    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, [fetchNotifications]);



    const submitFeedback = async (id: string, feedback: 'useful' | 'not_useful') => {
        try {
            const response = await fetch(`/api/notifications/${id}/feedback`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ feedback }),
            });

            if (response.ok) {
                // Optimistic update
                setNotifications(prev => prev.map(n =>
                    n.id === id ? { ...n, feedback } : n
                ));
            }
        } catch (error) {
            console.error('Failed to submit feedback:', error);
        }
    };

    return {
        notifications,
        unreadCount,
        markAsRead,
        submitFeedback,
        refresh: fetchNotifications
    };
}
