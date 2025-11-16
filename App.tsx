import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useInterval } from './hooks/useInterval';
import { Header } from './components/Header';
import { Clock } from './components/Clock';
import { TimerList } from './components/TimerList';
import { AddTimerModal } from './components/AddTimerModal';
import { SettingsModal } from './components/SettingsModal';
import { EventView } from './components/EventView';
import { Notification } from './components/Notification';
import { ApiKeyModal } from './components/ApiKeyModal';
import { Icon } from './components/Icon';
import { THEMES, INITIAL_SETTINGS, ALARM_SOUNDS } from './constants';
import { fetchAndParseICal } from './services/icalService';
import type { Settings, Timer as TimerType, ICalEvent, NotificationPayload } from './types';

type ActiveTab = 'clock' | 'timers' | 'events';

const App: React.FC = () => {
    const [settings, setSettings] = useLocalStorage<Settings>('geeclock-settings', INITIAL_SETTINGS);
    const [timers, setTimers] = useLocalStorage<TimerType[]>('geeclock-timers', []);
    const [events, setEvents] = useLocalStorage<ICalEvent[]>('geeclock-events', []);
    const [notifiedEventIds, setNotifiedEventIds] = useLocalStorage<Record<string, { ten?: boolean, five?: boolean, now?: boolean }>>('geeclock-notified-events', {});
    const [activeTab, setActiveTab] = useState<ActiveTab>('clock');
    const [isAddTimerModalOpen, setAddTimerModalOpen] = useState(false);
    const [isSettingsModalOpen, setSettingsModalOpen] = useState(false);
    const [isApiKeyModalOpen, setApiKeyModalOpen] = useState(false);
    const [syncError, setSyncError] = useState<string | null>(null);
    const [notification, setNotification] = useState<NotificationPayload | null>(null);
    const notificationAudioRef = useRef<HTMLAudioElement>(null);
    
    const isAppReady = !!settings.apiKey;

    useEffect(() => {
        if (!settings.apiKey) {
            setApiKeyModalOpen(true);
        }
    }, [settings.apiKey]);


    useEffect(() => {
        const root = document.documentElement;
        const theme = THEMES[settings.theme]?.[settings.darkMode ? 'dark' : 'light'] || THEMES.default.dark;
      
        Object.entries(theme).forEach(([key, value]) => {
            root.style.setProperty(`--color-${key}`, value);
        });
      
        if (settings.darkMode) {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
    }, [settings]);

    const fetchCalendars = useCallback(async () => {
        setSyncError(null);
        if (!isAppReady || !settings.iCalSources || settings.iCalSources.length === 0) {
            setEvents([]);
            return;
        }

        try {
            const allEvents = await Promise.all(
                settings.iCalSources.map(source => fetchAndParseICal(source.url))
            );
            const flatEvents = allEvents.flat().sort((a, b) => a.start.getTime() - b.start.getTime());
            setEvents(flatEvents);
        } catch (error) {
            console.error("Failed to sync calendars:", error);
            setSyncError("Failed to sync one or more calendars. Check URLs and CORS policies.");
        }
    }, [settings.iCalSources, setEvents, isAppReady]);

    useEffect(() => {
        fetchCalendars();
    }, [fetchCalendars]);

    useInterval(fetchCalendars, 15 * 60 * 1000); // Sync every 15 minutes

    useInterval(() => {
        if (!isAppReady) return;
        const now = Date.now();
        
        // Clear old notified events (older than 1 day)
        const newNotified: Record<string, any> = {};
        for (const event of events) {
            if(now - event.start.getTime() < 24 * 3600 * 1000) {
                 if(notifiedEventIds[event.id]) {
                    newNotified[event.id] = notifiedEventIds[event.id];
                 }
            }
        }

        for (const event of events) {
            const startTime = event.start.getTime();
            const eventId = event.id;
            const notified = notifiedEventIds[eventId] || {};

            const tenMins = 10 * 60 * 1000;
            const fiveMins = 5 * 60 * 1000;

            if (startTime > now && !notified.ten && (startTime - now <= tenMins) && (startTime - now > fiveMins)) {
                setNotification({ event, message: `starts in ${Math.round((startTime - now)/60000)} minutes.` });
                newNotified[eventId] = {...notified, ten: true };
            } else if (startTime > now && !notified.five && (startTime - now <= fiveMins)) {
                setNotification({ event, message: `starts in ${Math.round((startTime - now)/60000)} minutes.` });
                newNotified[eventId] = {...notified, five: true };
            } else if (now >= startTime && now < event.end.getTime() && !notified.now) {
                setNotification({ event, message: `is starting now.` });
                newNotified[eventId] = {...notified, now: true };
            }
        }
        setNotifiedEventIds(newNotified);
    }, 15 * 1000); // Check every 15 seconds

    useEffect(() => {
        if (notification && notificationAudioRef.current) {
            notificationAudioRef.current.play().catch(e => console.error("Error playing notification sound", e));
        }
    }, [notification])

    const handleAddTimer = useCallback(({ label, duration }: { label: string; duration: number }) => {
        const newTimer: TimerType = {
            id: Date.now(),
            label,
            duration,
            remaining: duration,
            isRunning: false,
            startTime: null,
        };
        setTimers(prev => [...prev, newTimer]);
    }, [setTimers]);

    const handleDeleteTimer = useCallback((id: number) => {
        setTimers(prev => prev.filter(t => t.id !== id));
    }, [setTimers]);
    
    const handleToggleTimer = useCallback((id: number) => {
        setTimers(currentTimers => currentTimers.map(timer => {
            if (timer.id !== id) return timer;
            
            const isRunning = !timer.isRunning;
            if (isRunning) {
                const remaining = timer.remaining <= 0 ? timer.duration : timer.remaining;
                const startTime = Date.now() - ((timer.duration - remaining) * 1000);
                return { ...timer, isRunning: true, startTime, remaining };
            } else {
                if (!timer.startTime) return { ...timer, isRunning: false };
                const elapsed = (Date.now() - timer.startTime) / 1000;
                const remaining = timer.duration - elapsed;
                return { ...timer, isRunning: false, remaining: Math.max(0, remaining), startTime: null };
            }
        }));
    }, [setTimers]);

    const handleResetTimer = useCallback((id: number) => {
        setTimers(currentTimers => currentTimers.map(timer => {
            if (timer.id === id) {
                return { ...timer, isRunning: false, remaining: timer.duration, startTime: null };
            }
            return timer;
        }));
    }, [setTimers]);

    const alarmSoundUrl = settings.alarmSound === 'custom'
        ? settings.customAlarmSoundUrl
        : (ALARM_SOUNDS[settings.alarmSound]?.url || ALARM_SOUNDS.default.url);

    return (
        <div className="min-h-screen flex flex-col max-w-3xl mx-auto">
            <Header 
                onSettingsClick={() => setSettingsModalOpen(true)} 
                showDateTime={settings.showDateTimeInHeader} 
            />
            
            {isAppReady ? (
            <>
                <nav className="flex justify-center p-2">
                    <div className="flex items-center gap-2 bg-surface p-1.5 rounded-full animate-fade-in">
                        <button onClick={() => setActiveTab('clock')} className={`px-4 py-1.5 text-sm font-semibold rounded-full flex items-center gap-2 ${activeTab === 'clock' ? 'bg-primary text-white' : 'hover:bg-background/50'}`}>
                            <Icon name="clock" className="w-5 h-5" />Clock
                        </button>
                        <button onClick={() => setActiveTab('timers')} className={`px-4 py-1.5 text-sm font-semibold rounded-full flex items-center gap-2 ${activeTab === 'timers' ? 'bg-primary text-white' : 'hover:bg-background/50'}`}>
                            <Icon name="timer" className="w-5 h-5" />Timers
                        </button>
                        <button onClick={() => setActiveTab('events')} className={`px-4 py-1.5 text-sm font-semibold rounded-full flex items-center gap-2 ${activeTab === 'events' ? 'bg-primary text-white' : 'hover:bg-background/50'}`}>
                            <Icon name="calendar" className="w-5 h-5" />Events
                        </button>
                    </div>
                </nav>

                <main className="flex-1">
                    {activeTab === 'clock' && <Clock />}
                    {activeTab === 'timers' && (
                        <TimerList 
                            timers={timers} 
                            onAdd={() => setAddTimerModalOpen(true)} 
                            onDelete={handleDeleteTimer} 
                            onToggle={handleToggleTimer} 
                            onReset={handleResetTimer} 
                            alarmSoundUrl={alarmSoundUrl} 
                        />
                    )}
                    {activeTab === 'events' && <EventView events={events} error={syncError} />}
                </main>
                
                {activeTab === 'timers' && (
                    <div className="fixed bottom-6 right-6 z-20">
                        <button onClick={() => setAddTimerModalOpen(true)} className="p-4 bg-secondary text-white rounded-full shadow-lg hover:scale-105 transition-transform" aria-label="Add Timer">
                            <Icon name="plus" className="w-7 h-7" />
                        </button>
                    </div>
                )}
            </>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                    <Icon name="lock" className="w-16 h-16 text-primary mb-4" />
                    <h2 className="text-2xl font-bold">Application Locked</h2>
                    <p className="text-text-secondary mt-2">Please set your API key in the settings to unlock the app.</p>
                     <button onClick={() => setSettingsModalOpen(true)} className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-semibold hover:opacity-90 transition-opacity">
                        <Icon name="cog" className="w-5 h-5" />
                        Go to Settings
                    </button>
                </div>
            )}
            
            <AddTimerModal 
                isOpen={isAddTimerModalOpen} 
                onClose={() => setAddTimerModalOpen(false)} 
                onAddTimer={handleAddTimer}
            />
            <SettingsModal 
                isOpen={isSettingsModalOpen} 
                onClose={() => setSettingsModalOpen(false)} 
                settings={settings} 
                onSettingsChange={setSettings} 
            />
            <ApiKeyModal
                 isOpen={isApiKeyModalOpen} 
                 onClose={() => setApiKeyModalOpen(false)} 
                 settings={settings} 
                 onSettingsChange={setSettings} 
            />
            {notification && (
                <Notification 
                    payload={notification}
                    onClose={() => setNotification(null)}
                />
            )}
            <audio ref={notificationAudioRef} src={ALARM_SOUNDS.notification.url} preload="auto" />
        </div>
    );
};

export default App;