/**
 * Application-wide constants and configuration
 */

// Room Configuration
export const ROOMS = {
  EMMANUEL: 'room-emmanuel',
  TWILIGHT: 'room-twilight',
  FAITHFUL: 'room-faithful',
  JOY: 'room-joy',
} as const;

export const ROOM_NAMES: Record<string, string> = {
  [ROOMS.EMMANUEL]: 'Room 1: Emmanuel',
  [ROOMS.TWILIGHT]: 'Room 2: Twilight',
  [ROOMS.FAITHFUL]: 'Room 3: Faithful',
  [ROOMS.JOY]: 'Room 4: Joy',
};

export const ROOM_FILES: Record<string, string> = {
  [ROOMS.EMMANUEL]: 'room1.html',
  [ROOMS.TWILIGHT]: 'room2.html',
  [ROOMS.FAITHFUL]: 'room3.html',
  [ROOMS.JOY]: 'room4.html',
};

// localStorage Keys
export const LOCAL_STORAGE_KEYS = {
  SYNC_CODES: 'christmas_sync_codes',
  SYNC_COMMAND: 'christmas_sync_command',
  SYNC_STATUS: (roomId: string) => `christmas_sync_status_${roomId}`,
  LAST_COMMAND_ID: 'christmas_last_command_id',
} as const;

// Timing Constants (milliseconds)
export const TIMINGS = {
  STATUS_POLL_INTERVAL: 1000, // 1 second
  LOCAL_TIMER_UPDATE: 500, // 500ms
  ROOM_CLEANUP_TIMEOUT: 10000, // 10 seconds
  COMMAND_EXPIRY: 30000, // 30 seconds
  HEARTBEAT_INTERVAL: 5000, // 5 seconds
  COPY_SUCCESS_TIMEOUT: 2000, // 2 seconds
} as const;

// Command Types
export const COMMANDS = {
  PLAY: 'play',
  PAUSE: 'pause',
  STOP: 'stop',
  RESET: 'reset',
  ACTIVATE: 'activate',
} as const;

// Status Values
export const STATUS = {
  GREEN: 'green',
  YELLOW: 'yellow',
  RED: 'red',
} as const;
