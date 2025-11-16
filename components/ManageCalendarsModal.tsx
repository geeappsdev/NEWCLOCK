import React, { useState } from 'react';
import { Modal } from './Modal';
import { Icon } from './Icon';
import type { Settings, ICalSource } from '../types';

interface ManageCalendarsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: Settings;
  onSettingsChange: (settings: Settings) => void;
}

export const ManageCalendarsModal: React.FC<ManageCalendarsModalProps> = ({ isOpen, onClose, settings, onSettingsChange }) => {
    const [newUrl, setNewUrl] = useState('');

    const handleAddSource = (e: React.FormEvent) => {
        e.preventDefault();
        if (newUrl.trim() && newUrl.startsWith('http')) {
            const newSource: ICalSource = {
                id: crypto.randomUUID(),
                url: newUrl.trim(),
            };
            const updatedSources = [...(settings.iCalSources || []), newSource];
            onSettingsChange({ ...settings, iCalSources: updatedSources });
            setNewUrl('');
        }
    };

    const handleRemoveSource = (id: string) => {
        const updatedSources = settings.iCalSources.filter(source => source.id !== id);
        onSettingsChange({ ...settings, iCalSources: updatedSources });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Manage Calendars">
            <div className="space-y-4">
                <form onSubmit={handleAddSource} className="flex gap-2">
                    <input 
                        type="url"
                        value={newUrl}
                        onChange={e => setNewUrl(e.target.value)}
                        placeholder="https://.../calendar.ics"
                        className="flex-1 p-2 rounded-md bg-background border border-surface focus:ring-2 focus:ring-primary outline-none"
                    />
                    <button type="submit" className="p-2 bg-primary text-white rounded-md hover:opacity-90 disabled:opacity-50" disabled={!newUrl.trim()}>
                        <Icon name="plus" className="w-5 h-5" />
                    </button>
                </form>

                <div className="space-y-2 max-h-60 overflow-y-auto">
                    {settings.iCalSources && settings.iCalSources.length > 0 ? (
                        settings.iCalSources.map(source => (
                            <div key={source.id} className="flex items-center justify-between p-2 bg-background rounded-md">
                                <span className="text-sm truncate text-text-secondary flex-1 pr-2">{source.url}</span>
                                <button onClick={() => handleRemoveSource(source.id)} className="p-1 text-red-400 hover:bg-surface rounded-full">
                                    <Icon name="trash" className="w-4 h-4" />
                                </button>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-sm text-text-secondary py-4">No calendars added yet.</p>
                    )}
                </div>

                <div className="text-xs text-text-secondary/70 p-2 bg-background rounded-md">
                    <strong>Note:</strong> Calendar URLs must be publicly accessible and have a permissive CORS policy for the app to be able to fetch event data.
                </div>
            </div>
        </Modal>
    );
};