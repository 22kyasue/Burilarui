import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X } from 'lucide-react';
import { Notification } from '../types/notification';

interface NewsTickerProps {
    theme: 'light' | 'dark';
    onNotificationClick?: (notification: Notification) => void;
    notifications: Notification[];
    markAsRead: (id: string) => void;
}

export const NewsTicker: React.FC<NewsTickerProps> = ({ theme, onNotificationClick, notifications, markAsRead }) => {

    const [currentIndex, setCurrentIndex] = useState(0);

    // Auto-rotate notifications if multiple exist
    useEffect(() => {
        if (notifications.length > 1) {
            const interval = setInterval(() => {
                setCurrentIndex((prev) => (prev + 1) % notifications.length);
            }, 5000); // Rotate every 5 seconds
            return () => clearInterval(interval);
        }
    }, [notifications.length]);

    if (notifications.length === 0) {
        return null;
    }

    const currentNotification = notifications[currentIndex];

    const bgColor = theme === 'dark' ? 'bg-blue-900/30' : 'bg-blue-50';
    const textColor = theme === 'dark' ? 'text-blue-200' : 'text-blue-800';
    const borderColor = theme === 'dark' ? 'border-blue-800' : 'border-blue-200';

    return (
        <div className={`w-full ${bgColor} border-b ${borderColor} py-2 px-4 flex items-center justify-between transition-colors duration-300`}>
            <div className="flex items-center space-x-3 flex-1 overflow-hidden">
                <div className={`p-1.5 rounded-full ${theme === 'dark' ? 'bg-blue-800/50' : 'bg-blue-100'}`}>
                    <Bell size={14} className={textColor} />
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentNotification.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                        className="flex-1 cursor-pointer"
                        onClick={() => onNotificationClick?.(currentNotification)}
                    >
                        <div className="flex items-baseline space-x-2">
                            <span className={`font-semibold text-sm ${textColor}`}>
                                {currentNotification.title}
                            </span>
                            <span className={`text-xs opacity-70 truncate ${textColor}`}>
                                {currentNotification.message}
                            </span>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>

            <div className="flex items-center space-x-2">
                <button
                    onClick={() => markAsRead(currentNotification.id)}
                    className={`p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors ${textColor}`}
                    title="Dismiss"
                >
                    <X size={14} />
                </button>
            </div>
        </div>
    );
};
