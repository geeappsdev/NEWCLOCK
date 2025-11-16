import React from 'react';
import type { ICalEvent } from '../types';
import { Icon } from './Icon';

interface EventViewProps {
    events: ICalEvent[];
    error: string | null;
}

const formatEventTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
};

const EventItem: React.FC<{ event: ICalEvent }> = ({ event }) => (
    <div className="flex items-start gap-4 p-4 bg-surface rounded-lg">
        <div className="font-mono text-sm text-center">
            <div className="font-semibold text-primary">{formatEventTime(event.start)}</div>
            <div className="text-text-secondary text-xs">to {formatEventTime(event.end)}</div>
        </div>
        <div className="flex-1 border-l-2 border-primary/20 pl-4">
            <p className="font-semibold text-text-primary">{event.summary}</p>
        </div>
    </div>
);

export const EventView: React.FC<EventViewProps> = ({ events, error }) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

    const todayEvents = events.filter(e => e.start >= today && e.start < tomorrow);
    const tomorrowEvents = events.filter(e => e.start >= tomorrow && e.start < dayAfterTomorrow);

    const hasEvents = todayEvents.length > 0 || tomorrowEvents.length > 0;

    return (
        <div className="p-4 md:p-6 space-y-6 animate-fade-in">
            {error && (
                <div className="bg-red-500/10 text-red-400 p-4 rounded-lg text-center">
                    {error}
                </div>
            )}
            
            {todayEvents.length > 0 && (
                <section>
                    <h2 className="text-xl font-bold mb-4">Today</h2>
                    <div className="space-y-3">
                        {todayEvents.map(event => <EventItem key={event.id} event={event} />)}
                    </div>
                </section>
            )}

            {tomorrowEvents.length > 0 && (
                <section>
                    <h2 className="text-xl font-bold mb-4">Tomorrow</h2>
                    <div className="space-y-3">
                        {tomorrowEvents.map(event => <EventItem key={event.id} event={event} />)}
                    </div>
                </section>
            )}
            
            {!hasEvents && (
                 <div className="text-center py-16 text-text-secondary">
                    <Icon name="calendar" className="w-12 h-12 mx-auto mb-4" />
                    <p>No upcoming events for today or tomorrow.</p>
                    <p className="text-sm">Add a calendar in Settings to see your events.</p>
                </div>
            )}
        </div>
    );
};