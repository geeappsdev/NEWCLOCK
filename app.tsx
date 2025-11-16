// This is a bundled file to optimize for GitHub Pages deployment.
// It combines all the necessary TypeScript and React components into a single file
// to reduce network requests and avoid module resolution issues with in-browser Babel transpilation.
const { useState, useEffect, useCallback, useRef, useMemo } = React;
const { createRoot } = ReactDOM;

// From: types.ts
interface ICalSource {
  id: string;
  url: string;
}

interface Settings {
  theme: string;
  darkMode: boolean;
  alarmSound: string;
  customAlarmSoundUrl: string;
  showDateTimeInHeader: boolean;
  iCalSources: ICalSource[];
  apiKey: string;
}

interface Timer {
  id: number;
  label: string;
  duration: number;
  remaining: number;
  isRunning: boolean;
  startTime: number | null;
}

interface ICalEvent {
  id: string;
  summary: string;
  start: Date;
  end: Date;
}

interface NotificationPayload {
  event: ICalEvent;
  message: string;
}

type ThemeColors = {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  'text-primary': string;
  'text-secondary': string;
};

type Theme = {
  dark: ThemeColors;
  light: ThemeColors;
};

type Themes = {
  [key: string]: Theme;
};

type AlarmSound = {
    name: string;
    url:string;
};

type AlarmSounds = {
    [key: string]: AlarmSound;
};

// From: constants.ts
const THEMES: Themes = {
    default: { dark: { primary: '79 70 229', secondary: '16 185 129', background: '17 24 39', surface: '31 41 55', 'text-primary': '249 250 251', 'text-secondary': '156 163 175', }, light: { primary: '79 70 229', secondary: '16 185 129', background: '243 244 246', surface: '255 255 255', 'text-primary': '17 24 39', 'text-secondary': '55 65 81', } },
    ocean: { dark: { primary: '59 130 246', secondary: '52 211 153', background: '15 23 42', surface: '30 41 59', 'text-primary': '241 245 249', 'text-secondary': '148 163 184', }, light: { primary: '59 130 246', secondary: '22 163 74', background: '240 249 255', surface: '255 255 255', 'text-primary': '30 41 59', 'text-secondary': '71 85 105', } },
    sunset: { dark: { primary: '249 115 22', secondary: '239 68 68', background: '28 25 23', surface: '41 37 36', 'text-primary': '250 250 249', 'text-secondary': '168 162 158', }, light: { primary: '234 88 12', secondary: '220 38 38', background: '254 252 251', surface: '255 255 255', 'text-primary': '28 25 23', 'text-secondary': '68 64 60', } },
    forest: { dark: { primary: '34 197 94', secondary: '202 138 4', background: '20 30 20', surface: '30 46 30', 'text-primary': '220 252 231', 'text-secondary': '163 230 170', }, light: { primary: '22 163 74', secondary: '202 138 4', background: '240 253 244', surface: '255 255 255', 'text-primary': '21 21 21', 'text-secondary': '63 63 63', } },
    graphite: { dark: { primary: '148 163 184', secondary: '100 116 139', background: '15 23 42', surface: '30 41 59', 'text-primary': '241 245 249', 'text-secondary': '148 163 184', }, light: { primary: '71 85 105', secondary: '100 116 139', background: '241 245 249', surface: '255 255 255', 'text-primary': '15 23 42', 'text-secondary': '51 65 85', } },
    rose: { dark: { primary: '251 113 133', secondary: '251 146 60', background: '53 23 29', surface: '79 32 43', 'text-primary': '255 241 242', 'text-secondary': '253 164 175', }, light: { primary: '244 63 94', secondary: '217 119 6', background: '255 241 242', surface: '255 255 255', 'text-primary': '131 24 67', 'text-secondary': '190 24 93', } }
};

const ALARM_SOUNDS: AlarmSounds = {
    default: { name: 'Alarm Clock', url: 'https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg' },
    digital: { name: 'Digital', url: 'https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg' },
    bell: { name: 'School Bell', url: 'https://actions.google.com/sounds/v1/alarms/school_bell.ogg' },
    rooster: { name: 'Rooster', url: 'https://actions.google.com/sounds/v1/animals/rooster_crowing.ogg' },
    notification: { name: 'Notification', url: 'https://actions.google.com/sounds/v1/notifications/card_received.ogg' },
};

const INITIAL_SETTINGS: Settings = { 
    theme: 'default', 
    darkMode: true, 
    alarmSound: 'default', 
    customAlarmSoundUrl: '', 
    showDateTimeInHeader: true,
    iCalSources: [],
    apiKey: '',
};

// From: hooks/useLocalStorage.ts
function useLocalStorage<T,>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue];
}

// From: hooks/useInterval.ts
function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef<(() => void) | null>(null);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    function tick() {
      if (savedCallback.current) {
        savedCallback.current();
      }
    }
    if (delay !== null) {
      let id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}

// From: services/icalService.ts
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

const fetchAndParseICal = async (url: string): Promise<ICalEvent[]> => {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch iCal data from ${url}`);
    }
    const icalData = await response.text();
    return parseICal(icalData);
};

// From: components/Icon.tsx
type IconName = 'clock' | 'timer' | 'plus' | 'cog' | 'chat' | 'x' | 'play' | 'pause' | 'trash' | 'send' | 'reset' | 'image' | 'sparkles' | 'thumb-up' | 'thumb-down' | 'calendar' | 'key' | 'lock';
interface IconProps { name: IconName; className?: string; }
const ICONS: Record<IconName, React.ReactNode> = {
    clock: <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />,
    timer: <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />,
    plus: <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />,
    cog: <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-1.007 1.11-.962l5.123.48c.55.052.994.546.942 1.096l-.48 5.123c-.044.472-.47.84-1.096.942l-5.123-.48c-.55-.052-.994-.546-.942-1.096L9.594 3.94zM15 12a3 3 0 11-6 0 3 3 0 016 0z" />,
    chat: <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m3.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />,
    x: <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />,
    play: <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />,
    pause: <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-6-13.5v13.5" />,
    trash: <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.226 2.077H8.062a2.25 2.25 0 01-2.226-2.077L3.882 5.79m18.12-1.02A1.125 1.125 0 0020.25 5.25h-4.5M12 5.25V3m-4.5 2.25H3.75m0 0A1.125 1.125 0 012.625 4.125h18.75c.621 0 1.125.504 1.125 1.125v0" />,
    send: <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />,
    reset: <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0011.667 0l3.181-3.183m-4.991-2.691L7.98 12.54M16.023 9.348L12.057 5l-4.066 4.067" />,
    image: <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />,
    sparkles: <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.562L16.25 21.75l-.648-1.188a2.25 2.25 0 00-1.476-1.476L12.938 18l1.188-.648a2.25 2.25 0 001.476-1.476L16.25 15l.648 1.188a2.25 2.25 0 001.476 1.476L19.563 18l-1.188.648a2.25 2.25 0 00-1.476 1.476z" />,
    'thumb-up': <path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.5c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75A2.25 2.25 0 0116.5 4.5c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23H6.633a1.875 1.875 0 01-1.875-1.875V11.25a1.875 1.875 0 011.875-1.875z" />,
    'thumb-down': <path strokeLinecap="round" strokeLinejoin="round" d="M7.867 10.5c.806 0 1.533.446 2.031 1.08a9.041 9.041 0 002.861 2.4c.723.384 1.35.956 1.653 1.715a4.498 4.498 0 01.322 1.672V21a.75.75 0 00.75.75A2.25 2.25 0 0016.5 19.5c0-1.152-.26-2.243-.723-3.218-.266-.558.107-1.282.725-1.282h3.126c1.026 0 1.945-.694 2.054-1.715.045-.422.068-.85.068-1.285a11.95 11.95 0 00-2.649-7.521c-.388-.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114 1.04a4.501 4.501 0 01-1.423-.23H6.633a1.875 1.875 0 00-1.875 1.875v7.5a1.875 1.875 0 001.875 1.875z" />,
    calendar: <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0h18M-4.5 12h22.5" />,
    key: <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />,
    lock: <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />,
};
const Icon: React.FC<IconProps> = ({ name, className }) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      {ICONS[name]}
    </svg>
  );
};

// From: components/Modal.tsx
interface ModalProps { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode; onTitleClick?: () => void; size?: 'default' | 'fullscreen'; }
const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, onTitleClick, size = 'default' }) => {
  if (!isOpen) return null;
  const isFullscreen = size === 'fullscreen';
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 bg-background z-50 animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="bg-surface shadow-lg w-full h-full flex flex-col">
          <header className="flex justify-between items-center p-4 border-b border-white/10 flex-shrink-0">
            <h2 id="modal-title" className="text-lg font-semibold" onClick={onTitleClick} style={{ cursor: onTitleClick ? 'pointer' : 'default' }}>{title}</h2>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10" aria-label="Close modal"><Icon name="x" className="w-5 h-5" /></button>
          </header>
          <main className="flex-1 overflow-hidden">{children}</main>
        </div>
      </div>
    );
  }
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="bg-surface rounded-xl shadow-lg w-full max-w-md m-4 animate-slide-in" onClick={e => e.stopPropagation()}>
        <header className="flex justify-between items-center p-4 border-b border-white/10">
          <h2 id="modal-title" className="text-lg font-semibold" onClick={onTitleClick} style={{ cursor: onTitleClick ? 'pointer' : 'default' }}>{title}</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10" aria-label="Close modal"><Icon name="x" className="w-5 h-5" /></button>
        </header>
        <main className="p-4">{children}</main>
      </div>
    </div>
  );
};

// From: components/Header.tsx
const HeaderClock: React.FC = () => {
    const [time, setTime] = useState(new Date());
    useEffect(() => {
        const timerId = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timerId);
    }, []);
    return (
        <div className="text-right hidden sm:block">
            <div className="font-mono text-lg font-semibold text-text-primary tracking-tight">
                {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
            </div>
            <div className="text-xs text-text-secondary">
                {time.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
            </div>
        </div>
    );
};
interface HeaderProps { onSettingsClick: () => void; showDateTime: boolean; }
const Header: React.FC<HeaderProps> = ({ onSettingsClick, showDateTime }) => {
  return (
    <header className="flex justify-between items-center p-4 md:p-6 animate-fade-in">
      <h1 className="text-2xl font-bold tracking-tighter text-text-primary">GeeClock</h1>
      <div className="flex items-center gap-4">
        {showDateTime && <HeaderClock />}
        <div className="flex items-center gap-2">
          <button onClick={onSettingsClick} className="p-2 rounded-full hover:bg-surface transition-colors" aria-label="Open Settings"><Icon name="cog" className="w-6 h-6" /></button>
        </div>
      </div>
    </header>
  );
};

// From: components/Clock.tsx
const Clock: React.FC = () => {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
      const timerId = setInterval(() => setTime(new Date()), 1000);
      return () => clearInterval(timerId);
  }, []);
  return (
      <div className="flex flex-col items-center justify-center p-8 animate-fade-in">
          <div className="font-mono text-6xl md:text-8xl lg:text-9xl font-bold tracking-tighter text-primary">
              {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
          </div>
          <div className="mt-2 text-lg md:text-xl text-text-secondary">
              {time.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
      </div>
  );
};

// From: components/Timer.tsx
const formatTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
};
interface TimerProps { timer: Timer; onDelete: (id: number) => void; onToggle: (id: number) => void; onReset: (id: number) => void; alarmSoundUrl: string; }
const TimerComponent: React.FC<TimerProps> = ({ timer, onDelete, onToggle, onReset, alarmSoundUrl }) => {
    const [remaining, setRemaining] = useState(timer.remaining);
    const [isFinished, setIsFinished] = useState(false);
    const audioRef = useRef<HTMLAudioElement>(null);
    useEffect(() => {
        setRemaining(timer.remaining);
        if (timer.remaining > 0 && isFinished) setIsFinished(false);
    }, [timer.remaining, isFinished]);
    useEffect(() => {
        if (timer.remaining === timer.duration) setIsFinished(false);
    }, [timer.remaining, timer.duration])
    useInterval(() => {
        if (timer.isRunning && timer.startTime) {
            const elapsed = (Date.now() - timer.startTime) / 1000;
            const newRemaining = timer.duration - elapsed;
            if (newRemaining <= 0) {
                setRemaining(0);
                if (!isFinished) {
                    if (audioRef.current) audioRef.current.play().catch(e => console.error("Error playing alarm sound:", e));
                    setIsFinished(true);
                }
                onToggle(timer.id);
            } else {
                setRemaining(newRemaining);
                setIsFinished(false);
            }
        }
    }, timer.isRunning ? 1000 : null);
    const progress = timer.duration > 0 ? ((timer.duration - remaining) / timer.duration) * 100 : 0;
    const isDone = remaining <= 0;
    return (
       <div className={`bg-surface rounded-lg p-4 flex flex-col gap-4 relative overflow-hidden animate-fade-in ${isDone ? 'animate-pulse-bg' : ''}`}>
          <div className="absolute top-0 left-0 h-full bg-primary/10" style={{ width: `${progress}%`, transition: 'width 1s linear' }} />
          <div className="relative z-10 flex justify-between items-center">
              <span className="font-semibold text-text-primary">{timer.label}</span>
              <div className="flex items-center">
                <button onClick={() => onToggle(timer.id)} className="p-2 rounded-full hover:bg-text-secondary/20 transition-colors" aria-label={timer.isRunning ? 'Pause timer' : 'Start timer'}><Icon name={timer.isRunning ? 'pause' : 'play'} className="w-5 h-5 text-primary" /></button>
                <button onClick={() => onReset(timer.id)} className="p-2 rounded-full hover:bg-text-secondary/10 text-text-secondary transition-colors" aria-label="Reset timer"><Icon name="reset" className="w-5 h-5" /></button>
                <button onClick={() => onDelete(timer.id)} className="p-2 rounded-full hover:bg-text-secondary/10 text-text-secondary transition-colors" aria-label="Delete timer"><Icon name="trash" className="w-5 h-5" /></button>
              </div>
          </div>
          <div className="relative z-10 text-center py-4"><span className="font-mono text-6xl font-bold text-primary tracking-tight">{formatTime(Math.max(0, Math.round(remaining)))}</span></div>
          <audio ref={audioRef} src={alarmSoundUrl} preload="auto" />
      </div>
    );
};

// From: components/TimerList.tsx
interface TimerListProps { timers: Timer[]; onAdd: () => void; onDelete: (id: number) => void; onToggle: (id: number) => void; onReset: (id: number) => void; alarmSoundUrl: string; }
const TimerList: React.FC<TimerListProps> = ({ timers, onAdd, onDelete, onToggle, onReset, alarmSoundUrl }) => {
    return (
        <div className="p-4 md:p-6 space-y-4 animate-fade-in">
            {timers.length === 0 ? (
                <div className="text-center py-16 text-text-secondary">
                    <p>No timers yet.</p>
                    <button onClick={onAdd} className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"><Icon name="plus" className="w-5 h-5" />Add Timer</button>
                </div>
            ) : (
                timers.map(timer => (
                    <TimerComponent key={timer.id} timer={timer} onDelete={onDelete} onToggle={onToggle} onReset={onReset} alarmSoundUrl={alarmSoundUrl} />
                ))
            )}
        </div>
    );
};

// From: components/AddTimerModal.tsx
interface AddTimerModalProps { isOpen: boolean; onClose: () => void; onAddTimer: (timer: { label: string; duration: number }) => void; }
const AddTimerModal: React.FC<AddTimerModalProps> = ({ isOpen, onClose, onAddTimer }) => {
    const [label, setLabel] = useState('');
    const [hours, setHours] = useState(0);
    const [minutes, setMinutes] = useState(5);
    const [seconds, setSeconds] = useState(0);
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const duration = (hours * 3600) + (minutes * 60) + seconds;
        if (duration > 0) {
            onAddTimer({ label: label || 'New Timer', duration });
            setLabel(''); setHours(0); setMinutes(5); setSeconds(0);
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
                    <div className="flex-1"><label htmlFor="hours" className="block text-sm font-medium text-text-secondary">Hours</label><input type="number" id="hours" value={hours} onChange={e => setHours(parseInt(e.target.value, 10))} min="0" max="99" className="mt-1 w-full p-2 rounded-md bg-background border border-surface focus:ring-2 focus:ring-primary outline-none" /></div>
                    <div className="flex-1"><label htmlFor="minutes" className="block text-sm font-medium text-text-secondary">Minutes</label><input type="number" id="minutes" value={minutes} onChange={e => setMinutes(parseInt(e.target.value, 10))} min="0" max="59" className="mt-1 w-full p-2 rounded-md bg-background border border-surface focus:ring-2 focus:ring-primary outline-none" /></div>
                    <div className="flex-1"><label htmlFor="seconds" className="block text-sm font-medium text-text-secondary">Seconds</label><input type="number" id="seconds" value={seconds} onChange={e => setSeconds(parseInt(e.target.value, 10))} min="0" max="59" className="mt-1 w-full p-2 rounded-md bg-background border border-surface focus:ring-2 focus:ring-primary outline-none" /></div>
                </div>
                <button type="submit" className="w-full p-2 bg-primary text-white font-semibold rounded-md hover:opacity-90 transition-opacity">Add Timer</button>
            </form>
        </Modal>
    );
};

// From: components/ManageCalendarsModal.tsx
interface ManageCalendarsModalProps { isOpen: boolean; onClose: () => void; settings: Settings; onSettingsChange: (settings: Settings) => void; }
const ManageCalendarsModal: React.FC<ManageCalendarsModalProps> = ({ isOpen, onClose, settings, onSettingsChange }) => {
    const [newUrl, setNewUrl] = useState('');
    const handleAddSource = (e: React.FormEvent) => {
        e.preventDefault();
        if (newUrl.trim() && newUrl.startsWith('http')) {
            const newSource: ICalSource = { id: crypto.randomUUID(), url: newUrl.trim() };
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
                    <input type="url" value={newUrl} onChange={e => setNewUrl(e.target.value)} placeholder="https://.../calendar.ics" className="flex-1 p-2 rounded-md bg-background border border-surface focus:ring-2 focus:ring-primary outline-none" />
                    <button type="submit" className="p-2 bg-primary text-white rounded-md hover:opacity-90 disabled:opacity-50" disabled={!newUrl.trim()}><Icon name="plus" className="w-5 h-5" /></button>
                </form>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                    {settings.iCalSources && settings.iCalSources.length > 0 ? (
                        settings.iCalSources.map(source => (
                            <div key={source.id} className="flex items-center justify-between p-2 bg-background rounded-md">
                                <span className="text-sm truncate text-text-secondary flex-1 pr-2">{source.url}</span>
                                <button onClick={() => handleRemoveSource(source.id)} className="p-1 text-red-400 hover:bg-surface rounded-full"><Icon name="trash" className="w-4 h-4" /></button>
                            </div>
                        ))
                    ) : (<p className="text-center text-sm text-text-secondary py-4">No calendars added yet.</p>)}
                </div>
                <div className="text-xs text-text-secondary/70 p-2 bg-background rounded-md"><strong>Note:</strong> Calendar URLs must be publicly accessible and have a permissive CORS policy for the app to be able to fetch event data.</div>
            </div>
        </Modal>
    );
};

// From: components/ApiKeyModal.tsx
interface ApiKeyModalProps { isOpen: boolean; onClose: () => void; settings: Settings; onSettingsChange: (settings: Settings) => void; }
const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, settings, onSettingsChange }) => {
    const [apiKey, setApiKey] = useState(settings.apiKey || '');
    useEffect(() => {
        if (isOpen) setApiKey(settings.apiKey || '');
    }, [isOpen, settings.apiKey]);
    const handleSave = () => {
        onSettingsChange({ ...settings, apiKey });
        onClose();
    };
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Set Gemini API Key">
            <div className="space-y-4">
                <div>
                    <label htmlFor="api-key" className="block text-sm font-medium text-text-secondary">Your API Key</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><Icon name="key" className="h-5 w-5 text-gray-400" /></div>
                        <input type="password" id="api-key" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="Enter your API key" className="block w-full rounded-md border-surface bg-background p-2 pl-10 focus:border-primary focus:ring-primary sm:text-sm" />
                    </div>
                </div>
                <div className="text-xs text-text-secondary/70 p-2 bg-background rounded-md"><p>Your API key is stored only in your browser's local storage and is not sent to any server other than the Google AI API.</p></div>
                <button onClick={handleSave} className="w-full p-2 bg-primary text-white font-semibold rounded-md hover:opacity-90 transition-opacity disabled:opacity-50" disabled={!apiKey.trim()}>Save and Continue</button>
            </div>
        </Modal>
    );
};

// From: components/SettingsModal.tsx
interface SettingsModalProps { isOpen: boolean; onClose: () => void; settings: Settings; onSettingsChange: (settings: Settings) => void; }
const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onSettingsChange }) => {
  const [isCalendarModalOpen, setCalendarModalOpen] = useState(false);
  const [isApiKeyModalOpen, setApiKeyModalOpen] = useState(false);
  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Settings">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-text-secondary">Theme</label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {Object.keys(THEMES).map(themeKey => (<button key={themeKey} onClick={() => onSettingsChange({...settings, theme: themeKey })} className={`p-2 rounded-md text-sm capitalize border-2 ${settings.theme === themeKey ? 'border-primary' : 'border-surface'}`}>{themeKey}</button>))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary">Appearance</label>
            <div className="mt-2 flex rounded-md bg-background p-1">
                <button onClick={() => onSettingsChange({...settings, darkMode: false})} className={`flex-1 p-1.5 rounded text-sm ${!settings.darkMode ? 'bg-surface shadow' : ''}`}>Light</button>
                <button onClick={() => onSettingsChange({...settings, darkMode: true})} className={`flex-1 p-1.5 rounded text-sm ${settings.darkMode ? 'bg-surface shadow' : ''}`}>Dark</button>
            </div>
          </div>
          <div className="flex items-center justify-between">
              <label htmlFor="show-datetime" className="text-sm font-medium text-text-secondary">Show Time in Header<p className="text-xs text-text-secondary/70">Display time and date in the header.</p></label>
              <button id="show-datetime" role="switch" aria-checked={settings.showDateTimeInHeader} onClick={() => onSettingsChange({...settings, showDateTimeInHeader: !settings.showDateTimeInHeader})} className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-surface ${settings.showDateTimeInHeader ? 'bg-primary' : 'bg-gray-600'}`}><span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${settings.showDateTimeInHeader ? 'translate-x-5' : 'translate-x-0'}`} /></button>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary">Alarm Sound</label>
            <select value={settings.alarmSound} onChange={e => onSettingsChange({ ...settings, alarmSound: e.target.value, customAlarmSoundUrl: e.target.value === 'custom' ? settings.customAlarmSoundUrl : '' })} className="mt-1 w-full p-2 rounded-md bg-background border border-surface focus:ring-2 focus:ring-primary outline-none" aria-label="Select alarm sound">
              {Object.entries(ALARM_SOUNDS).filter(([key]) => key !== 'notification').map(([key, { name }]) => (<option key={key} value={key}>{name}</option>))}
              <option value="custom">Custom URL</option>
            </select>
          </div>
          {settings.alarmSound === 'custom' && (
            <div className="animate-fade-in">
              <label htmlFor="custom-alarm-url" className="block text-sm font-medium text-text-secondary">Custom Sound URL</label>
              <input type="url" id="custom-alarm-url" value={settings.customAlarmSoundUrl} onChange={e => onSettingsChange({ ...settings, customAlarmSoundUrl: e.target.value })} placeholder="https://example.com/sound.mp3" className="mt-1 w-full p-2 rounded-md bg-background border border-surface focus:ring-2 focus:ring-primary outline-none"/>
            </div>
          )}
          <div className="pt-4 mt-4 border-t border-surface">
              <h3 className="text-md font-semibold text-text-primary">API Key</h3>
              <p className="text-xs text-text-secondary/70 mb-4">Set your Gemini API key to use AI features.</p>
              <button onClick={() => setApiKeyModalOpen(true)} className="w-full p-2 bg-surface text-text-primary font-semibold rounded-md hover:bg-background transition-colors">Set API Key</button>
          </div>
          <div className="pt-4 mt-4 border-t border-surface">
              <h3 className="text-md font-semibold text-text-primary">Calendars</h3>
              <p className="text-xs text-text-secondary/70 mb-4">Sync iCal calendars to get event notifications.</p>
              <button onClick={() => setCalendarModalOpen(true)} className="w-full p-2 bg-surface text-text-primary font-semibold rounded-md hover:bg-background transition-colors">Manage Calendars</button>
          </div>
        </div>
      </Modal>
      <ManageCalendarsModal isOpen={isCalendarModalOpen} onClose={() => setCalendarModalOpen(false)} settings={settings} onSettingsChange={onSettingsChange}/>
      <ApiKeyModal isOpen={isApiKeyModalOpen} onClose={() => setApiKeyModalOpen(false)} settings={settings} onSettingsChange={onSettingsChange}/>
    </>
  );
};

// From: components/EventView.tsx
interface EventViewProps { events: ICalEvent[]; error: string | null; }
const formatEventTime = (date: Date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
const EventItem: React.FC<{ event: ICalEvent }> = ({ event }) => (
    <div className="flex items-start gap-4 p-4 bg-surface rounded-lg">
        <div className="font-mono text-sm text-center"><div className="font-semibold text-primary">{formatEventTime(event.start)}</div><div className="text-text-secondary text-xs">to {formatEventTime(event.end)}</div></div>
        <div className="flex-1 border-l-2 border-primary/20 pl-4"><p className="font-semibold text-text-primary">{event.summary}</p></div>
    </div>
);
const EventView: React.FC<EventViewProps> = ({ events, error }) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfterTomorrow = new Date(tomorrow); dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);
    const todayEvents = events.filter(e => e.start >= today && e.start < tomorrow);
    const tomorrowEvents = events.filter(e => e.start >= tomorrow && e.start < dayAfterTomorrow);
    const hasEvents = todayEvents.length > 0 || tomorrowEvents.length > 0;
    return (
        <div className="p-4 md:p-6 space-y-6 animate-fade-in">
            {error && (<div className="bg-red-500/10 text-red-400 p-4 rounded-lg text-center">{error}</div>)}
            {todayEvents.length > 0 && (
                <section>
                    <h2 className="text-xl font-bold mb-4">Today</h2>
                    <div className="space-y-3">{todayEvents.map(event => <EventItem key={event.id} event={event} />)}</div>
                </section>
            )}
            {tomorrowEvents.length > 0 && (
                <section>
                    <h2 className="text-xl font-bold mb-4">Tomorrow</h2>
                    <div className="space-y-3">{tomorrowEvents.map(event => <EventItem key={event.id} event={event} />)}</div>
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

// From: components/Notification.tsx
interface NotificationProps { payload: NotificationPayload; onClose: () => void; }
const Notification: React.FC<NotificationProps> = ({ payload, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => onClose(), 8000);
        return () => clearTimeout(timer);
    }, [onClose]);
    return (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-full max-w-sm bg-surface shadow-lg rounded-lg p-4 z-50 animate-slide-in" role="alert" aria-live="assertive">
            <div className="flex items-start gap-3">
                <div className="flex-shrink-0 pt-1"><Icon name="calendar" className="w-5 h-5 text-primary" /></div>
                <div className="flex-1"><p className="font-semibold text-text-primary">{payload.event.summary}</p><p className="text-sm text-text-secondary">{payload.message}</p></div>
                <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10" aria-label="Close notification"><Icon name="x" className="w-4 h-4" /></button>
            </div>
        </div>
    );
};

// From: App.tsx
type ActiveTab = 'clock' | 'timers' | 'events';
const App: React.FC = () => {
    const [settings, setSettings] = useLocalStorage<Settings>('geeclock-settings', INITIAL_SETTINGS);
    const [timers, setTimers] = useLocalStorage<Timer[]>('geeclock-timers', []);
    const [storedEvents, setStoredEvents] = useLocalStorage<ICalEvent[]>('geeclock-events', []);
    const [notifiedEventIds, setNotifiedEventIds] = useLocalStorage<Record<string, { ten?: boolean, five?: boolean, now?: boolean }>>('geeclock-notified-events', {});
    const [activeTab, setActiveTab] = useState<ActiveTab>('clock');
    const [isAddTimerModalOpen, setAddTimerModalOpen] = useState(false);
    const [isSettingsModalOpen, setSettingsModalOpen] = useState(false);
    const [isApiKeyModalOpen, setApiKeyModalOpen] = useState(false);
    const [syncError, setSyncError] = useState<string | null>(null);
    const [notification, setNotification] = useState<NotificationPayload | null>(null);
    const notificationAudioRef = useRef<HTMLAudioElement>(null);
    
    const events = useMemo(() => storedEvents.map(e => ({ ...e, start: new Date(e.start), end: new Date(e.end), })), [storedEvents]);
    const isAppReady = !!settings.apiKey;

    useEffect(() => {
        if (!settings.apiKey) setApiKeyModalOpen(true);
    }, [settings.apiKey]);

    useEffect(() => {
        const root = document.documentElement;
        const theme = THEMES[settings.theme]?.[settings.darkMode ? 'dark' : 'light'] || THEMES.default.dark;
        Object.entries(theme).forEach(([key, value]) => root.style.setProperty(`--color-${key}`, value));
        if (settings.darkMode) root.classList.add('dark'); else root.classList.remove('dark');
    }, [settings]);

    const fetchCalendars = useCallback(async () => {
        setSyncError(null);
        if (!isAppReady || !settings.iCalSources || settings.iCalSources.length === 0) {
            setStoredEvents([]); return;
        }
        try {
            const allEvents = await Promise.all(settings.iCalSources.map(source => fetchAndParseICal(source.url)));
            const flatEvents = allEvents.flat().sort((a, b) => a.start.getTime() - b.start.getTime());
            setStoredEvents(flatEvents);
        } catch (error) {
            console.error("Failed to sync calendars:", error);
            setSyncError("Failed to sync one or more calendars. Check URLs and CORS policies.");
        }
    }, [settings.iCalSources, setStoredEvents, isAppReady]);

    useEffect(() => { fetchCalendars(); }, [fetchCalendars]);

    useInterval(() => {
        if (!isAppReady) return;
        const now = Date.now();
        const newNotified: Record<string, any> = {};
        for (const event of events) {
            if(now - event.start.getTime() < 24 * 3600 * 1000) {
                 if(notifiedEventIds[event.id]) newNotified[event.id] = notifiedEventIds[event.id];
            }
        }
        for (const event of events) {
            const startTime = event.start.getTime();
            const eventId = event.id;
            const notified = notifiedEventIds[eventId] || {};
            const tenMins = 10 * 60 * 1000, fiveMins = 5 * 60 * 1000;
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
    }, 15 * 1000);

    useEffect(() => {
        if (notification && notificationAudioRef.current) {
            notificationAudioRef.current.play().catch(e => console.error("Error playing notification sound", e));
        }
    }, [notification])

    const handleAddTimer = useCallback(({ label, duration }: { label: string; duration: number }) => {
        const newTimer: Timer = { id: Date.now(), label, duration, remaining: duration, isRunning: false, startTime: null };
        setTimers(prev => [...prev, newTimer]);
    }, [setTimers]);

    const handleDeleteTimer = useCallback((id: number) => { setTimers(prev => prev.filter(t => t.id !== id)); }, [setTimers]);
    
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
            if (timer.id === id) return { ...timer, isRunning: false, remaining: timer.duration, startTime: null };
            return timer;
        }));
    }, [setTimers]);

    const alarmSoundUrl = settings.alarmSound === 'custom' ? settings.customAlarmSoundUrl : (ALARM_SOUNDS[settings.alarmSound]?.url || ALARM_SOUNDS.default.url);

    return (
        <div className="min-h-screen flex flex-col max-w-3xl mx-auto">
            <Header onSettingsClick={() => setSettingsModalOpen(true)} showDateTime={settings.showDateTimeInHeader} />
            {isAppReady ? (
            <>
                <nav className="flex justify-center p-2">
                    <div className="flex items-center gap-2 bg-surface p-1.5 rounded-full animate-fade-in">
                        <button onClick={() => setActiveTab('clock')} className={`px-4 py-1.5 text-sm font-semibold rounded-full flex items-center gap-2 ${activeTab === 'clock' ? 'bg-primary text-white' : 'hover:bg-background/50'}`}><Icon name="clock" className="w-5 h-5" />Clock</button>
                        <button onClick={() => setActiveTab('timers')} className={`px-4 py-1.5 text-sm font-semibold rounded-full flex items-center gap-2 ${activeTab === 'timers' ? 'bg-primary text-white' : 'hover:bg-background/50'}`}><Icon name="timer" className="w-5 h-5" />Timers</button>
                        <button onClick={() => setActiveTab('events')} className={`px-4 py-1.5 text-sm font-semibold rounded-full flex items-center gap-2 ${activeTab === 'events' ? 'bg-primary text-white' : 'hover:bg-background/50'}`}><Icon name="calendar" className="w-5 h-5" />Events</button>
                    </div>
                </nav>
                <main className="flex-1">
                    {activeTab === 'clock' && <Clock />}
                    {activeTab === 'timers' && <TimerList timers={timers} onAdd={() => setAddTimerModalOpen(true)} onDelete={handleDeleteTimer} onToggle={handleToggleTimer} onReset={handleResetTimer} alarmSoundUrl={alarmSoundUrl} />}
                    {activeTab === 'events' && <EventView events={events} error={syncError} />}
                </main>
                {activeTab === 'timers' && (
                    <div className="fixed bottom-6 right-6 z-20"><button onClick={() => setAddTimerModalOpen(true)} className="p-4 bg-secondary text-white rounded-full shadow-lg hover:scale-105 transition-transform" aria-label="Add Timer"><Icon name="plus" className="w-7 h-7" /></button></div>
                )}
            </>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                    <Icon name="lock" className="w-16 h-16 text-primary mb-4" />
                    <h2 className="text-2xl font-bold">Application Locked</h2>
                    <p className="text-text-secondary mt-2">Please set your API key in the settings to unlock the app.</p>
                     <button onClick={() => setSettingsModalOpen(true)} className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"><Icon name="cog" className="w-5 h-5" />Go to Settings</button>
                </div>
            )}
            <AddTimerModal isOpen={isAddTimerModalOpen} onClose={() => setAddTimerModalOpen(false)} onAddTimer={handleAddTimer} />
            <SettingsModal isOpen={isSettingsModalOpen} onClose={() => setSettingsModalOpen(false)} settings={settings} onSettingsChange={setSettings} />
            <ApiKeyModal isOpen={isApiKeyModalOpen} onClose={() => setApiKeyModalOpen(false)} settings={settings} onSettingsChange={setSettings} />
            {notification && (<Notification payload={notification} onClose={() => setNotification(null)} />)}
            <audio ref={notificationAudioRef} src={ALARM_SOUNDS.notification.url} preload="auto" />
        </div>
    );
};

// From: index.tsx
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}
const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);