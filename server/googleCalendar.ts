/**
 * Google Calendar API Integration with OAuth 2.0
 * 
 * This module provides functions to interact with Google Calendar API using OAuth 2.0.
 * Requires Google OAuth 2.0 credentials (Client ID, Client Secret) configured in Settings.
 * 
 * Setup Instructions:
 * 1. Go to Google Cloud Console (console.cloud.google.com)
 * 2. Create a new project or select existing one
 * 3. Enable Google Calendar API
 * 4. Go to "APIs & Services" → "Credentials"
 * 5. Create OAuth 2.0 Client ID (Web application)
 * 6. Add authorized redirect URI: https://yourdomain.com/api/oauth/google/callback
 * 7. Copy Client ID and Client Secret to Settings page
 * 8. Users click "Connect Google Calendar" button to authorize
 */

import { google } from 'googleapis';
import type { Appointment } from '../drizzle/schema';

/**
 * Get OAuth2 client with credentials from environment
 */
function getOAuth2Client() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = `${process.env.BASE_URL || 'http://localhost:3000'}/api/oauth/google/callback`;

  if (!clientId || !clientSecret) {
    throw new Error('Google OAuth credentials not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in Settings.');
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

/**
 * Generate OAuth authorization URL
 * User should be redirected to this URL to grant calendar access
 */
export function getAuthUrl(): string {
  const oauth2Client = getOAuth2Client();
  
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events',
    ],
    prompt: 'consent', // Force consent screen to get refresh token
  });
}

/**
 * Exchange authorization code for access token
 * Call this after user authorizes and is redirected back with code
 */
export async function getTokensFromCode(code: string) {
  const oauth2Client = getOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

/**
 * Set credentials for OAuth2 client
 */
function setCredentials(oauth2Client: any, accessToken: string, refreshToken?: string) {
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
}

/**
 * Create a calendar event from appointment
 * 
 * @param appointment - The appointment to create in Google Calendar
 * @param accessToken - User's Google OAuth access token
 * @param refreshToken - User's Google OAuth refresh token (optional)
 * @returns Google Calendar event ID and link
 */
export async function createCalendarEvent(
  appointment: Partial<Appointment> & { location?: string },
  accessToken: string,
  refreshToken?: string
): Promise<{ eventId: string; eventLink: string }> {
  const oauth2Client = getOAuth2Client();
  setCredentials(oauth2Client, accessToken, refreshToken);

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  const event = {
    summary: appointment.title || 'Termin',
    description: appointment.description || appointment.notes || '',
    start: {
      dateTime: appointment.startTime?.toISOString(),
      timeZone: 'Europe/Berlin',
    },
    end: {
      dateTime: appointment.endTime?.toISOString(),
      timeZone: 'Europe/Berlin',
    },
    location: appointment.location || '',
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 }, // 1 day before
        { method: 'popup', minutes: 30 }, // 30 minutes before
      ],
    },
  };

  const response = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: event,
  });

  return {
    eventId: response.data.id!,
    eventLink: response.data.htmlLink!,
  };
}

/**
 * Update an existing calendar event
 * 
 * @param eventId - Google Calendar event ID
 * @param appointment - Updated appointment data
 * @param accessToken - User's Google OAuth access token
 * @param refreshToken - User's Google OAuth refresh token (optional)
 */
export async function updateCalendarEvent(
  eventId: string,
  appointment: Partial<Appointment> & { location?: string },
  accessToken: string,
  refreshToken?: string
): Promise<void> {
  const oauth2Client = getOAuth2Client();
  setCredentials(oauth2Client, accessToken, refreshToken);

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  const event = {
    summary: appointment.title || 'Termin',
    description: appointment.description || appointment.notes || '',
    start: {
      dateTime: appointment.startTime?.toISOString(),
      timeZone: 'Europe/Berlin',
    },
    end: {
      dateTime: appointment.endTime?.toISOString(),
      timeZone: 'Europe/Berlin',
    },
    location: appointment.location || '',
  };

  await calendar.events.update({
    calendarId: 'primary',
    eventId: eventId,
    requestBody: event,
  });
}

/**
 * Delete a calendar event
 * 
 * @param eventId - Google Calendar event ID
 * @param accessToken - User's Google OAuth access token
 * @param refreshToken - User's Google OAuth refresh token (optional)
 */
export async function deleteCalendarEvent(
  eventId: string,
  accessToken: string,
  refreshToken?: string
): Promise<void> {
  const oauth2Client = getOAuth2Client();
  setCredentials(oauth2Client, accessToken, refreshToken);

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  await calendar.events.delete({
    calendarId: 'primary',
    eventId: eventId,
  });
}

/**
 * List upcoming events from Google Calendar
 * 
 * @param accessToken - User's Google OAuth access token
 * @param refreshToken - User's Google OAuth refresh token (optional)
 * @param maxResults - Maximum number of events to return (default: 10)
 * @returns List of calendar events
 */
export async function listUpcomingEvents(
  accessToken: string,
  refreshToken?: string,
  maxResults: number = 10
) {
  const oauth2Client = getOAuth2Client();
  setCredentials(oauth2Client, accessToken, refreshToken);

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  const response = await calendar.events.list({
    calendarId: 'primary',
    timeMin: new Date().toISOString(),
    maxResults: maxResults,
    singleEvents: true,
    orderBy: 'startTime',
  });

  return response.data.items || [];
}
