import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Info, AlertTriangle, CheckCircle, AlertOctagon, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Notification } from '../types/notification';

interface ToastNotificationProps {
    notification: Notification | null;
    onDismiss: () => void;
    onFeedback?: (id: string, feedback: 'useful' | 'not_useful') => void;
    theme?: 'light' | 'dark';
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({ notification, onDismiss, onFeedback, theme = 'light' }) => {
    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => {
                onDismiss();
            }, 5000); // Amount of time visible
            return () => clearTimeout(timer);
        }
    }, [notification, onDismiss]);

    if (!notification) return null;

    const getIcon = () => {
        switch (notification.type) {
            case 'success': return <CheckCircle size={20} className="text-green-500" />;
            case 'warning': return <AlertTriangle size={20} className="text-yellow-500" />;
            case 'error': return <AlertOctagon size={20} className="text-red-500" />;
            case 'update': return <Bell size={20} className="text-blue-500" />;
            default: return <Info size={20} className="text-blue-500" />;
        }
    };

    const bgColor = theme === 'dark' ? 'bg-gray-800' : 'bg-white';
    const textColor = theme === 'dark' ? 'text-white' : 'text-gray-900';
    const borderColor = theme === 'dark' ? 'border-gray-700' : 'border-gray-200';

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.9 }}
                className={`fixed bottom-6 right-6 z-50 p-4 rounded-2xl shadow-2xl border backdrop-blur-xl ${bgColor} ${borderColor} max-w-sm w-full flex items-start gap-3`}
            >
                <div className="flex-shrink-0 mt-0.5">
                    {getIcon()}
                </div>
                <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold ${textColor}`}>
                        {notification.title}
                    </p>
                    <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        {notification.details ? notification.details.summary : notification.message}
                    </p>
                    {/* Feedback Buttons */}
                    <div className="flex items-center gap-2 mt-2">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onFeedback?.(notification.id, 'useful');
                                onDismiss();
                            }}
                            className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition-colors ${theme === 'dark' ? 'hover:bg-gray-700 text-gray-400 hover:text-green-400' : 'hover:bg-gray-100 text-gray-500 hover:text-green-600'
                                }`}
                            title="Useful"
                        >
                            <ThumbsUp size={14} />
                            <span>役に立った</span>
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onFeedback?.(notification.id, 'not_useful');
                                onDismiss();
                            }}
                            className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition-colors ${theme === 'dark' ? 'hover:bg-gray-700 text-gray-400 hover:text-red-400' : 'hover:bg-gray-100 text-gray-500 hover:text-red-600'
                                }`}
                            title="Not Useful"
                        >
                            <ThumbsDown size={14} />
                            <span>役に立たない</span>
                        </button>
                    </div>
                </div>
                <button
                    onClick={onDismiss}
                    className={`p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}
                >
                    <X size={16} />
                </button>
            </motion.div>
        </AnimatePresence>
    );
};
