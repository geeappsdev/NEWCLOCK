import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Icon } from './Icon';
import type { Settings } from '../types';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: Settings;
  onSettingsChange: (settings: Settings) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, settings, onSettingsChange }) => {
    const [apiKey, setApiKey] = useState(settings.apiKey || '');

    useEffect(() => {
        if (isOpen) {
            setApiKey(settings.apiKey || '');
        }
    }, [isOpen, settings.apiKey]);

    const handleSave = () => {
        onSettingsChange({ ...settings, apiKey });
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Set Gemini API Key">
            <div className="space-y-4">
                <div>
                    <label htmlFor="api-key" className="block text-sm font-medium text-text-secondary">
                        Your API Key
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <Icon name="key" className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="password"
                            id="api-key"
                            value={apiKey}
                            onChange={e => setApiKey(e.target.value)}
                            placeholder="Enter your API key"
                            className="block w-full rounded-md border-surface bg-background p-2 pl-10 focus:border-primary focus:ring-primary sm:text-sm"
                        />
                    </div>
                </div>
                <div className="text-xs text-text-secondary/70 p-2 bg-background rounded-md">
                    <p>Your API key is stored only in your browser's local storage and is not sent to any server other than the Google AI API.</p>
                </div>
                <button
                    onClick={handleSave}
                    className="w-full p-2 bg-primary text-white font-semibold rounded-md hover:opacity-90 transition-opacity disabled:opacity-50"
                    disabled={!apiKey.trim()}
                >
                    Save and Continue
                </button>
            </div>
        </Modal>
    );
};
