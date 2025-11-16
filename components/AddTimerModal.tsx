import React, { useState } from 'react';
import { Modal } from './Modal';

interface AddTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTimer: (timer: { label: string; duration: number }) => void;
}

export const AddTimerModal: React.FC<AddTimerModalProps> = ({ isOpen, onClose, onAddTimer }) => {
    const [label, setLabel] = useState('');
    const [hours, setHours] = useState(0);
    const [minutes, setMinutes] = useState(5);
    const [seconds, setSeconds] = useState(0);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const duration = (hours * 3600) + (minutes * 60) + seconds;
        if (duration > 0) {
            onAddTimer({ label: label || 'New Timer', duration });
            setLabel('');
            setHours(0);
            setMinutes(5);
            setSeconds(0);
            onClose();
        }
    };
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add New Timer">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="label" className="block text-sm font-medium text-text-secondary">Label</label>
                    <input type="text" id="label" value={label} onChange={e => setLabel(e.target.value)} placeholder="e.g., Cooking Pasta" className="mt-1 w-full p-2 rounded-md bg-background border border-surface focus:ring-2 focus:ring-primary outline-none" />
                </div>
                <div className="flex gap-2">
                    <div className="flex-1">
                        <label htmlFor="hours" className="block text-sm font-medium text-text-secondary">Hours</label>
                        <input type="number" id="hours" value={hours} onChange={e => setHours(parseInt(e.target.value, 10))} min="0" max="99" className="mt-1 w-full p-2 rounded-md bg-background border border-surface focus:ring-2 focus:ring-primary outline-none" />
                    </div>
                    <div className="flex-1">
                        <label htmlFor="minutes" className="block text-sm font-medium text-text-secondary">Minutes</label>
                        <input type="number" id="minutes" value={minutes} onChange={e => setMinutes(parseInt(e.target.value, 10))} min="0" max="59" className="mt-1 w-full p-2 rounded-md bg-background border border-surface focus:ring-2 focus:ring-primary outline-none" />
                    </div>
                    <div className="flex-1">
                        <label htmlFor="seconds" className="block text-sm font-medium text-text-secondary">Seconds</label>
                        <input type="number" id="seconds" value={seconds} onChange={e => setSeconds(parseInt(e.target.value, 10))} min="0" max="59" className="mt-1 w-full p-2 rounded-md bg-background border border-surface focus:ring-2 focus:ring-primary outline-none" />
                    </div>
                </div>
                <button type="submit" className="w-full p-2 bg-primary text-white font-semibold rounded-md hover:opacity-90 transition-opacity">Add Timer</button>
            </form>
        </Modal>
    );
};