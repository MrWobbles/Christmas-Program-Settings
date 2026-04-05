/**
 * iCloud CalDAV Calendar Client
 *
 * Setup:
 * 1. Go to appleid.apple.com → Sign-In and Security → App-Specific Passwords
 * 2. Generate an app-specific password
 * 3. Enter your Apple ID email and the app password in settings
 */

const APPLE_ID_KEY = 'calendar_apple_id';
const APP_PASSWORD_KEY = 'calendar_app_password';
const CALENDAR_CACHE_KEY = 'calendar_events_cache';
const CALENDAR_CACHE_TIME_KEY = 'calendar_cache_time';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// iCloud CalDAV endpoint - use local proxy in dev to avoid CORS
const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const CALDAV_SERVER = isLocalDev ? '/caldav-proxy' : 'https://caldav.icloud.com';
const ICLOUD_CALDAV_HOST = 'https://caldav.icloud.com';

/**
 * Convert iCloud URLs to use local proxy if in dev mode
 */
function toProxyUrl(url: string): string {
  if (isLocalDev && url.startsWith(ICLOUD_CALDAV_HOST)) {
    return url.replace(ICLOUD_CALDAV_HOST, CALDAV_SERVER);
  }
  if (!url.startsWith('http')) {
    return CALDAV_SERVER + url;
  }
  return url;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  location?: string;
  description?: string;
  color?: string;
}

// Color palette for events
const EVENT_COLORS = [
  '#ff3b30', // Red
  '#ff9500', // Orange
  '#ffcc00', // Yellow
  '#34c759', // Green
  '#5b8def', // Blue
  '#af52de', // Purple
  '#ff2d55', // Pink
];

class CalendarClient {
  private appleId: string | null = null;
  private appPassword: string | null = null;
  private events: CalendarEvent[] = [];
  private lastFetch: number = 0;
  private principalUrl: string | null = null;
  private calendarHomeUrl: string | null = null;

  constructor() {
    this.loadStoredCredentials();
    this.loadCachedEvents();
  }

  private loadStoredCredentials(): void {
    this.appleId = localStorage.getItem(APPLE_ID_KEY);
    this.appPassword = localStorage.getItem(APP_PASSWORD_KEY);
  }

  private loadCachedEvents(): void {
    const cached = localStorage.getItem(CALENDAR_CACHE_KEY);
    const cacheTime = localStorage.getItem(CALENDAR_CACHE_TIME_KEY);

    if (cached && cacheTime) {
      const time = parseInt(cacheTime, 10);
      if (Date.now() - time < CACHE_DURATION) {
        try {
          this.events = JSON.parse(cached).map((e: CalendarEvent) => ({
            ...e,
            start: new Date(e.start),
            end: new Date(e.end)
          }));
          this.lastFetch = time;
        } catch {
          // Invalid cache, ignore
        }
      }
    }
  }

  private saveCache(): void {
    localStorage.setItem(CALENDAR_CACHE_KEY, JSON.stringify(this.events));
    localStorage.setItem(CALENDAR_CACHE_TIME_KEY, Date.now().toString());
  }

  /**
   * Set iCloud credentials
   */
  setCredentials(appleId: string, appPassword: string): void {
    this.appleId = appleId;
    this.appPassword = appPassword;
    localStorage.setItem(APPLE_ID_KEY, appleId);
    localStorage.setItem(APP_PASSWORD_KEY, appPassword);
    this.events = [];
    this.lastFetch = 0;
    this.principalUrl = null;
    this.calendarHomeUrl = null;
  }

  /**
   * Get stored Apple ID
   */
  getAppleId(): string | null {
    return this.appleId;
  }

  /**
   * Check if calendar is configured
   */
  isConfigured(): boolean {
    return !!(this.appleId && this.appPassword);
  }

  /**
   * Clear calendar configuration
   */
  clearCredentials(): void {
    this.appleId = null;
    this.appPassword = null;
    this.events = [];
    this.principalUrl = null;
    this.calendarHomeUrl = null;
    localStorage.removeItem(APPLE_ID_KEY);
    localStorage.removeItem(APP_PASSWORD_KEY);
    localStorage.removeItem(CALENDAR_CACHE_KEY);
    localStorage.removeItem(CALENDAR_CACHE_TIME_KEY);
  }

  /**
   * Get auth header
   */
  private getAuthHeader(): string {
    return 'Basic ' + btoa(`${this.appleId}:${this.appPassword}`);
  }

  /**
   * Make a CalDAV PROPFIND request
   */
  private async propfind(url: string, body: string, depth: string = '0'): Promise<Document> {
    const response = await fetch(url, {
      method: 'PROPFIND',
      headers: {
        'Authorization': this.getAuthHeader(),
        'Content-Type': 'application/xml; charset=utf-8',
        'Depth': depth,
      },
      body
    });

    if (!response.ok) {
      throw new Error(`CalDAV error: ${response.status}`);
    }

    const text = await response.text();
    const parser = new DOMParser();
    return parser.parseFromString(text, 'application/xml');
  }

  /**
   * Make a CalDAV REPORT request
   */
  private async report(url: string, body: string): Promise<Document> {
    const response = await fetch(url, {
      method: 'REPORT',
      headers: {
        'Authorization': this.getAuthHeader(),
        'Content-Type': 'application/xml; charset=utf-8',
        'Depth': '1',
      },
      body
    });

    if (!response.ok) {
      throw new Error(`CalDAV error: ${response.status}`);
    }

    const text = await response.text();
    const parser = new DOMParser();
    return parser.parseFromString(text, 'application/xml');
  }

  /**
   * Discover the principal URL
   */
  private async discoverPrincipal(): Promise<string> {
    if (this.principalUrl) return this.principalUrl;

    const body = `<?xml version="1.0" encoding="utf-8"?>
      <d:propfind xmlns:d="DAV:">
        <d:prop>
          <d:current-user-principal/>
        </d:prop>
      </d:propfind>`;

    const doc = await this.propfind(CALDAV_SERVER, body);
    const href = doc.querySelector('current-user-principal href');
    if (!href?.textContent) {
      throw new Error('Could not discover principal URL');
    }

    this.principalUrl = toProxyUrl(href.textContent);
    return this.principalUrl;
  }

  /**
   * Discover the calendar home URL
   */
  private async discoverCalendarHome(): Promise<string> {
    if (this.calendarHomeUrl) return this.calendarHomeUrl;

    const principalUrl = await this.discoverPrincipal();

    const body = `<?xml version="1.0" encoding="utf-8"?>
      <d:propfind xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav">
        <d:prop>
          <c:calendar-home-set/>
        </d:prop>
      </d:propfind>`;

    const doc = await this.propfind(principalUrl, body);
    const href = doc.querySelector('calendar-home-set href');
    if (!href?.textContent) {
      throw new Error('Could not discover calendar home');
    }

    this.calendarHomeUrl = toProxyUrl(href.textContent);
    return this.calendarHomeUrl;
  }

  /**
   * Get list of calendars
   */
  private async getCalendars(): Promise<string[]> {
    const homeUrl = await this.discoverCalendarHome();

    const body = `<?xml version="1.0" encoding="utf-8"?>
      <d:propfind xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav" xmlns:cs="http://calendarserver.org/ns/">
        <d:prop>
          <d:resourcetype/>
          <d:displayname/>
          <cs:getctag/>
        </d:prop>
      </d:propfind>`;

    const doc = await this.propfind(homeUrl, body, '1');
    const calendars: string[] = [];

    doc.querySelectorAll('response').forEach(response => {
      const resourceType = response.querySelector('resourcetype calendar');
      if (resourceType) {
        const href = response.querySelector('href');
        if (href?.textContent) {
          calendars.push(toProxyUrl(href.textContent));
        }
      }
    });

    return calendars;
  }

  /**
   * Parse ICS date string
   */
  private parseICSDate(dateStr: string, isAllDay: boolean = false): Date {
    const cleanDate = dateStr.replace(/.*:/, '');

    if (isAllDay || cleanDate.length === 8) {
      const year = parseInt(cleanDate.substring(0, 4));
      const month = parseInt(cleanDate.substring(4, 6)) - 1;
      const day = parseInt(cleanDate.substring(6, 8));
      return new Date(year, month, day);
    }

    const year = parseInt(cleanDate.substring(0, 4));
    const month = parseInt(cleanDate.substring(4, 6)) - 1;
    const day = parseInt(cleanDate.substring(6, 8));
    const hour = parseInt(cleanDate.substring(9, 11));
    const minute = parseInt(cleanDate.substring(11, 13));
    const second = parseInt(cleanDate.substring(13, 15)) || 0;

    if (cleanDate.endsWith('Z')) {
      return new Date(Date.UTC(year, month, day, hour, minute, second));
    }

    return new Date(year, month, day, hour, minute, second);
  }

  /**
   * Parse ICS content into events
   */
  private parseICS(icsContent: string, colorIndex: number): CalendarEvent[] {
    const events: CalendarEvent[] = [];
    const lines = icsContent.replace(/\r\n /g, '').split(/\r?\n/);

    let currentEvent: Partial<CalendarEvent> | null = null;

    for (const line of lines) {
      if (line === 'BEGIN:VEVENT') {
        currentEvent = {
          color: EVENT_COLORS[colorIndex % EVENT_COLORS.length]
        };
      } else if (line === 'END:VEVENT' && currentEvent) {
        if (currentEvent.id && currentEvent.title && currentEvent.start) {
          events.push(currentEvent as CalendarEvent);
        }
        currentEvent = null;
      } else if (currentEvent) {
        const colonIndex = line.indexOf(':');
        if (colonIndex === -1) continue;

        const key = line.substring(0, colonIndex);
        const value = line.substring(colonIndex + 1);

        if (key === 'UID') {
          currentEvent.id = value;
        } else if (key === 'SUMMARY') {
          currentEvent.title = value.replace(/\\,/g, ',').replace(/\\n/g, '\n');
        } else if (key.startsWith('DTSTART')) {
          const isAllDay = key.includes('VALUE=DATE') && !key.includes('VALUE=DATE-TIME');
          currentEvent.start = this.parseICSDate(value, isAllDay);
          currentEvent.allDay = isAllDay;
        } else if (key.startsWith('DTEND')) {
          const isAllDay = key.includes('VALUE=DATE') && !key.includes('VALUE=DATE-TIME');
          currentEvent.end = this.parseICSDate(value, isAllDay);
        } else if (key === 'LOCATION') {
          currentEvent.location = value.replace(/\\,/g, ',');
        } else if (key === 'DESCRIPTION') {
          currentEvent.description = value.replace(/\\,/g, ',').replace(/\\n/g, '\n');
        }
      }
    }

    return events;
  }

  /**
   * Fetch events from a calendar for a date range
   */
  private async fetchCalendarEvents(calendarUrl: string, start: Date, end: Date, colorIndex: number): Promise<CalendarEvent[]> {
    const startStr = start.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const endStr = end.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

    const body = `<?xml version="1.0" encoding="utf-8"?>
      <c:calendar-query xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav">
        <d:prop>
          <d:getetag/>
          <c:calendar-data/>
        </d:prop>
        <c:filter>
          <c:comp-filter name="VCALENDAR">
            <c:comp-filter name="VEVENT">
              <c:time-range start="${startStr}" end="${endStr}"/>
            </c:comp-filter>
          </c:comp-filter>
        </c:filter>
      </c:calendar-query>`;

    const doc = await this.report(calendarUrl, body);
    const events: CalendarEvent[] = [];

    doc.querySelectorAll('response').forEach(response => {
      const calendarData = response.querySelector('calendar-data');
      if (calendarData?.textContent) {
        events.push(...this.parseICS(calendarData.textContent, colorIndex));
      }
    });

    return events;
  }

  /**
   * Fetch all events from all calendars
   */
  async fetchEvents(): Promise<CalendarEvent[]> {
    if (!this.isConfigured()) {
      return [];
    }

    // Use cache if fresh
    if (Date.now() - this.lastFetch < CACHE_DURATION && this.events.length > 0) {
      return this.events;
    }

    try {
      const calendars = await this.getCalendars();

      // Get events for the next 7 days
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 7);

      const allEvents: CalendarEvent[] = [];

      for (let i = 0; i < calendars.length; i++) {
        const events = await this.fetchCalendarEvents(calendars[i], start, end, i);
        allEvents.push(...events);
      }

      this.events = allEvents;
      this.lastFetch = Date.now();
      this.saveCache();

      return this.events;
    } catch (error) {
      console.error('Calendar fetch error:', error);
      return this.events;
    }
  }

  /**
   * Get today's events
   */
  async getTodayEvents(): Promise<CalendarEvent[]> {
    const events = await this.fetchEvents();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return events
      .filter(event => {
        const eventStart = new Date(event.start);
        const eventEnd = new Date(event.end);
        return eventStart < tomorrow && eventEnd > today;
      })
      .sort((a, b) => {
        if (a.allDay && !b.allDay) return -1;
        if (!a.allDay && b.allDay) return 1;
        return a.start.getTime() - b.start.getTime();
      });
  }

  /**
   * Get events for a specific number of days starting from today
   */
  async getEventsForDays(numDays: number): Promise<Map<string, CalendarEvent[]>> {
    const events = await this.fetchEvents();
    const result = new Map<string, CalendarEvent[]>();

    for (let i = 0; i < numDays; i++) {
      const dayStart = new Date();
      dayStart.setHours(0, 0, 0, 0);
      dayStart.setDate(dayStart.getDate() + i);

      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const dateKey = dayStart.toISOString().split('T')[0];

      const dayEvents = events
        .filter(event => {
          const eventStart = new Date(event.start);
          const eventEnd = new Date(event.end);
          return eventStart < dayEnd && eventEnd > dayStart;
        })
        .sort((a, b) => {
          if (a.allDay && !b.allDay) return -1;
          if (!a.allDay && b.allDay) return 1;
          return a.start.getTime() - b.start.getTime();
        });

      result.set(dateKey, dayEvents);
    }

    return result;
  }

  /**
   * Test connection
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.discoverPrincipal();
      return true;
    } catch {
      return false;
    }
  }
}

export const calendarClient = new CalendarClient();
