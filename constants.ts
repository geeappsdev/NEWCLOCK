import type { Themes, AlarmSounds, Settings } from './types';

export const THEMES: Themes = {
    default: { dark: { primary: '79 70 229', secondary: '16 185 129', background: '17 24 39', surface: '31 41 55', 'text-primary': '249 250 251', 'text-secondary': '156 163 175', }, light: { primary: '79 70 229', secondary: '16 185 129', background: '243 244 246', surface: '255 255 255', 'text-primary': '17 24 39', 'text-secondary': '55 65 81', } },
    ocean: { dark: { primary: '59 130 246', secondary: '52 211 153', background: '15 23 42', surface: '30 41 59', 'text-primary': '241 245 249', 'text-secondary': '148 163 184', }, light: { primary: '59 130 246', secondary: '22 163 74', background: '240 249 255', surface: '255 255 255', 'text-primary': '30 41 59', 'text-secondary': '71 85 105', } },
    sunset: { dark: { primary: '249 115 22', secondary: '239 68 68', background: '28 25 23', surface: '41 37 36', 'text-primary': '250 250 249', 'text-secondary': '168 162 158', }, light: { primary: '234 88 12', secondary: '220 38 38', background: '254 252 251', surface: '255 255 255', 'text-primary': '28 25 23', 'text-secondary': '68 64 60', } },
    forest: { dark: { primary: '34 197 94', secondary: '202 138 4', background: '20 30 20', surface: '30 46 30', 'text-primary': '220 252 231', 'text-secondary': '163 230 170', }, light: { primary: '22 163 74', secondary: '202 138 4', background: '240 253 244', surface: '255 255 255', 'text-primary': '21 21 21', 'text-secondary': '63 63 63', } },
    graphite: { dark: { primary: '148 163 184', secondary: '100 116 139', background: '15 23 42', surface: '30 41 59', 'text-primary': '241 245 249', 'text-secondary': '148 163 184', }, light: { primary: '71 85 105', secondary: '100 116 139', background: '241 245 249', surface: '255 255 255', 'text-primary': '15 23 42', 'text-secondary': '51 65 85', } },
    rose: { dark: { primary: '251 113 133', secondary: '251 146 60', background: '53 23 29', surface: '79 32 43', 'text-primary': '255 241 242', 'text-secondary': '253 164 175', }, light: { primary: '244 63 94', secondary: '217 119 6', background: '255 241 242', surface: '255 255 255', 'text-primary': '131 24 67', 'text-secondary': '190 24 93', } }
};

export const ALARM_SOUNDS: AlarmSounds = {
    default: { name: 'Alarm Clock', url: 'https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg' },
    digital: { name: 'Digital', url: 'https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg' },
    bell: { name: 'School Bell', url: 'https://actions.google.com/sounds/v1/alarms/school_bell.ogg' },
    rooster: { name: 'Rooster', url: 'https://actions.google.com/sounds/v1/animals/rooster_crowing.ogg' },
    notification: { name: 'Notification', url: 'https://actions.google.com/sounds/v1/notifications/card_received.ogg' },
};

export const INITIAL_SETTINGS: Settings = { 
    theme: 'default', 
    darkMode: true, 
    alarmSound: 'default', 
    customAlarmSoundUrl: '', 
    showDateTimeInHeader: true,
    iCalSources: [],
    apiKey: '',
};