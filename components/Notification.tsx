import React, { useEffect } from 'react';
import type { NotificationPayload } from '../types';
import { Icon } from './Icon';

interface NotificationProps {
    payload: NotificationPayload;
    onClose: () => void;
}

export const Notification: React.FC<NotificationProps> = ({ payload, onClose }) => {
    
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 8000); // Notification stays for 8 seconds

        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div 
            className="fixed bottom-4 left-1/2 -translate-x-1/2 w-full max-w-sm bg-surface shadow-lg rounded-lg p-4 z-50 animate-slide-in"
            role="alert"
            aria-live="assertive"
        >
            <div className="flex items-start gap-3">
                <div className="flex-shrink-0 pt-1">
                    <Icon name="calendar" className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                    <p className="font-semibold text-text-primary">{payload.event.summary}</p>
                    <p className="text-sm text-text-secondary">{payload.message}</p>
                </div>
                <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10" aria-label="Close notification">
                    <Icon name="x" className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};