import type { ICalEvent } from '../types';

const unfold = (icalData: string): string => {
    return icalData.replace(/\r\n /g, '');
};

const parseDate = (dateStr: string): Date => {
    const year = parseInt(dateStr.substring(0, 4), 10);
    const month = parseInt(dateStr.substring(4, 6), 10) - 1;
    const day = parseInt(dateStr.substring(6, 8), 10);
    
    if (dateStr.length > 8) {
        const hour = parseInt(dateStr.substring(9, 11), 10);
        const minute = parseInt(dateStr.substring(11, 13), 10);
        const second = parseInt(dateStr.substring(13, 15), 10);
        
        if (dateStr.endsWith('Z')) {
            return new Date(Date.UTC(year, month, day, hour, minute, second));
        }
        return new Date(year, month, day, hour, minute, second);
    }
    
    return new Date(year, month, day);
};

const parseICal = (icalData: string): ICalEvent[] => {
    const unfoldedData = unfold(icalData);
    const lines = unfoldedData.split(/\r\n/);
    const events: ICalEvent[] = [];
    let currentEvent: any = null;

    for (const line of lines) {
        if (line === 'BEGIN:VEVENT') {
            currentEvent = {};
        } else if (line === 'END:VEVENT') {
            if (currentEvent && currentEvent.summary && currentEvent.dtstart) {
                const start = parseDate(currentEvent.dtstart);
                // If no end date, assume it's at least 30 minutes long for display purposes
                const end = currentEvent.dtend ? parseDate(currentEvent.dtend) : new Date(start.getTime() + 30 * 60000);
                
                events.push({
                    id: currentEvent.uid || `${currentEvent.summary}-${currentEvent.dtstart}`,
                    summary: currentEvent.summary,
                    start,
                    end,
                });
            }
            currentEvent = null;
        } else if (currentEvent) {
            const [key, ...valueParts] = line.split(':');
            const value = valueParts.join(':');
            
            if (key.includes(';')) {
                const mainKey = key.split(';')[0];
                if (mainKey === 'DTSTART') currentEvent.dtstart = value;
                if (mainKey === 'DTEND') currentEvent.dtend = value;
            } else {
                if (key === 'SUMMARY') currentEvent.summary = value;
                if (key === 'DTSTART') currentEvent.dtstart = value;
                if (key === 'DTEND') currentEvent.dtend = value;
                if (key === 'UID') currentEvent.uid = value;
            }
        }
    }
    return events;
};

export const fetchAndParseICal = async (url: string): Promise<ICalEvent[]> => {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch iCal data from ${url}`);
    }
    const icalData = await response.text();
    return parseICal(icalData);
};