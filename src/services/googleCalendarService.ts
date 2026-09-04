import { AcademicEvent, GoogleCalendarEvent, GoogleCalendarEventInput, GoogleCalendarItem } from '../types';

const BASE_URL = 'https://www.googleapis.com/calendar/v3';

export class GoogleCalendarError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'GoogleCalendarError';
    this.status = status;
  }
}

/**
 * Fetch the user's Google Calendars list
 */
export async function fetchCalendarList(accessToken: string): Promise<GoogleCalendarItem[]> {
  try {
    const res = await fetch(`${BASE_URL}/users/me/calendarList`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new GoogleCalendarError(
        errData.error?.message || `Failed to fetch calendars (${res.status})`,
        res.status
      );
    }

    const data = await res.json();
    return (data.items || []).map((item: any) => ({
      id: item.id,
      summary: item.summary,
      description: item.description,
      primary: Boolean(item.primary),
      backgroundColor: item.backgroundColor || '#4f46e5',
      foregroundColor: item.foregroundColor || '#ffffff',
      selected: Boolean(item.selected),
    }));
  } catch (error: any) {
    console.error('fetchCalendarList error:', error);
    throw error;
  }
}

/**
 * Fetch events from a specified calendar
 */
export async function fetchCalendarEvents(
  accessToken: string,
  calendarId = 'primary',
  options: { timeMin?: string; timeMax?: string; maxResults?: number } = {}
): Promise<GoogleCalendarEvent[]> {
  try {
    const params = new URLSearchParams({
      singleEvents: 'true',
      orderBy: 'startTime',
      maxResults: String(options.maxResults || 100),
    });

    if (options.timeMin) {
      params.append('timeMin', options.timeMin);
    } else {
      // Default to 1 month in the past to show recent and future events
      const past = new Date();
      past.setDate(past.getDate() - 30);
      params.append('timeMin', past.toISOString());
    }

    if (options.timeMax) {
      params.append('timeMax', options.timeMax);
    }

    const res = await fetch(
      `${BASE_URL}/calendars/${encodeURIComponent(calendarId)}/events?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
      }
    );

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new GoogleCalendarError(
        errData.error?.message || `Failed to fetch events (${res.status})`,
        res.status
      );
    }

    const data = await res.json();
    return (data.items || []).map((item: any) => ({
      id: item.id,
      summary: item.summary || '(No title)',
      description: item.description || '',
      location: item.location || '',
      start: {
        dateTime: item.start?.dateTime,
        date: item.start?.date,
        timeZone: item.start?.timeZone,
      },
      end: {
        dateTime: item.end?.dateTime,
        date: item.end?.date,
        timeZone: item.end?.timeZone,
      },
      htmlLink: item.htmlLink,
      status: item.status,
      colorId: item.colorId,
      attendees: item.attendees,
    }));
  } catch (error: any) {
    console.error('fetchCalendarEvents error:', error);
    throw error;
  }
}

/**
 * Create a new event on the user's Google Calendar
 */
export async function createCalendarEvent(
  accessToken: string,
  calendarId: string,
  eventData: GoogleCalendarEventInput
): Promise<GoogleCalendarEvent> {
  try {
    const res = await fetch(
      `${BASE_URL}/calendars/${encodeURIComponent(calendarId)}/events`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(eventData),
      }
    );

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new GoogleCalendarError(
        errData.error?.message || `Failed to create calendar event (${res.status})`,
        res.status
      );
    }

    const item = await res.json();
    return {
      id: item.id,
      summary: item.summary || '(No title)',
      description: item.description || '',
      location: item.location || '',
      start: item.start,
      end: item.end,
      htmlLink: item.htmlLink,
      status: item.status,
    };
  } catch (error: any) {
    console.error('createCalendarEvent error:', error);
    throw error;
  }
}

/**
 * Update an existing event on Google Calendar (User confirmation required prior to calling)
 */
export async function updateCalendarEvent(
  accessToken: string,
  calendarId: string,
  eventId: string,
  eventData: Partial<GoogleCalendarEventInput>
): Promise<GoogleCalendarEvent> {
  try {
    const res = await fetch(
      `${BASE_URL}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(eventData),
      }
    );

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new GoogleCalendarError(
        errData.error?.message || `Failed to update calendar event (${res.status})`,
        res.status
      );
    }

    const item = await res.json();
    return {
      id: item.id,
      summary: item.summary || '(No title)',
      description: item.description || '',
      location: item.location || '',
      start: item.start,
      end: item.end,
      htmlLink: item.htmlLink,
      status: item.status,
    };
  } catch (error: any) {
    console.error('updateCalendarEvent error:', error);
    throw error;
  }
}

/**
 * Delete an event from Google Calendar (User confirmation required prior to calling)
 */
export async function deleteCalendarEvent(
  accessToken: string,
  calendarId: string,
  eventId: string
): Promise<boolean> {
  try {
    const res = await fetch(
      `${BASE_URL}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!res.ok && res.status !== 404 && res.status !== 410) {
      const errData = await res.json().catch(() => ({}));
      throw new GoogleCalendarError(
        errData.error?.message || `Failed to delete calendar event (${res.status})`,
        res.status
      );
    }

    return true;
  } catch (error: any) {
    console.error('deleteCalendarEvent error:', error);
    throw error;
  }
}

/**
 * Formats and pushes an AcademicEvent to Google Calendar
 */
export async function pushAcademicEventToGoogle(
  accessToken: string,
  academicEvent: AcademicEvent,
  calendarId = 'primary'
): Promise<GoogleCalendarEvent> {
  // Format start and end
  const isDateOnly = !academicEvent.time;
  let startPayload: { date?: string; dateTime?: string };
  let endPayload: { date?: string; dateTime?: string };

  if (isDateOnly) {
    startPayload = { date: academicEvent.date };
    // Google Calendar whole-day events need end date to be next day or endDate
    if (academicEvent.endDate && academicEvent.endDate !== academicEvent.date) {
      endPayload = { date: academicEvent.endDate };
    } else {
      // Calculate next day
      const nextDay = new Date(academicEvent.date);
      nextDay.setDate(nextDay.getDate() + 1);
      endPayload = { date: nextDay.toISOString().substring(0, 10) };
    }
  } else {
    // Has time (e.g. 14:00)
    const time = academicEvent.time || '10:00';
    const startIso = `${academicEvent.date}T${time}:00`;
    const startDateObj = new Date(startIso);
    // 1 hour duration default
    const endDateObj = new Date(startDateObj.getTime() + 60 * 60 * 1000);
    startPayload = { dateTime: startDateObj.toISOString() };
    endPayload = { dateTime: endDateObj.toISOString() };
  }

  const summary = `[${academicEvent.category.toUpperCase()}] ${academicEvent.title}`;
  const description = [
    `Category: ${academicEvent.category}`,
    `Priority: ${academicEvent.priority}`,
    academicEvent.semester ? `Semester: ${academicEvent.semester}` : null,
    academicEvent.notes ? `\nNotes: ${academicEvent.notes}` : null,
    '\nSynced via Student OS Academic Dashboard',
  ]
    .filter(Boolean)
    .join('\n');

  const payload: GoogleCalendarEventInput = {
    summary,
    description,
    start: startPayload,
    end: endPayload,
  };

  return createCalendarEvent(accessToken, calendarId, payload);
}
