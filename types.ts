export interface ICalSource {
  id: string;
  url: string;
}

export interface Settings {
  theme: string;
  darkMode: boolean;
  alarmSound: string;
  customAlarmSoundUrl: string;
  showDateTimeInHeader: boolean;
  iCalSources: ICalSource[];
  apiKey: string;
}

export interface Timer {
  id: number;
  label: string;
  duration: number;
  remaining: number;
  isRunning: boolean;
  startTime: number | null;
}

export interface ICalEvent {
  id: string;
  summary: string;
  start: Date;
  end: Date;
}

export interface NotificationPayload {
  event: ICalEvent;
  message: string;
}

export type ThemeColors = {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  'text-primary': string;
  'text-secondary': string;
};

export type Theme = {
  dark: ThemeColors;
  light: ThemeColors;
};

export type Themes = {
  [key: string]: Theme;
};

export type AlarmSound = {
    name: string;
    url:string;
};

export type AlarmSounds = {
    [key: string]: AlarmSound;
};