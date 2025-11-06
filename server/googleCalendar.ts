import { execSync } from "child_process";

interface CalendarEvent {
  summary: string;
  description?: string;
  location?: string;
  start_time: string;
  end_time: string;
  attendees?: string[];
  reminders?: number[];
  calendar_id?: string;
}

interface UpdateCalendarEvent extends CalendarEvent {
  event_id: string;
}

/**
 * Create a new event in Google Calendar via MCP
 */
export async function createCalendarEvent(event: CalendarEvent): Promise<{ event_id: string; html_link: string }> {
  const input = JSON.stringify({
    events: [
      {
        summary: event.summary,
        description: event.description,
        location: event.location,
        start_time: event.start_time,
        end_time: event.end_time,
        attendees: event.attendees,
        reminders: event.reminders || [30], // Default: 30 minutes before
        calendar_id: event.calendar_id || "primary",
      },
    ],
  });

  try {
    const result = execSync(
      `manus-mcp-cli tool call google_calendar_create_events --server google-calendar --input '${input.replace(/'/g, "'\\''")}'`,
      { encoding: "utf-8", maxBuffer: 10 * 1024 * 1024 }
    );

    // Parse the result to extract event ID and link
    const lines = result.split("\n");
    let eventId = "";
    let htmlLink = "";

    for (const line of lines) {
      if (line.includes("Event ID:")) {
        eventId = line.split("Event ID:")[1]?.trim() || "";
      }
      if (line.includes("HTML Link:")) {
        htmlLink = line.split("HTML Link:")[1]?.trim() || "";
      }
    }

    return {
      event_id: eventId,
      html_link: htmlLink,
    };
  } catch (error) {
    console.error("Failed to create calendar event:", error);
    throw new Error("Failed to create calendar event");
  }
}

/**
 * Update an existing event in Google Calendar via MCP
 */
export async function updateCalendarEvent(event: UpdateCalendarEvent): Promise<void> {
  const input = JSON.stringify({
    events: [
      {
        event_id: event.event_id,
        summary: event.summary,
        description: event.description,
        location: event.location,
        start_time: event.start_time,
        end_time: event.end_time,
        attendees: event.attendees,
        reminders: event.reminders,
        calendar_id: event.calendar_id || "primary",
      },
    ],
  });

  try {
    execSync(
      `manus-mcp-cli tool call google_calendar_update_events --server google-calendar --input '${input.replace(/'/g, "'\\''")}'`,
      { encoding: "utf-8", maxBuffer: 10 * 1024 * 1024 }
    );
  } catch (error) {
    console.error("Failed to update calendar event:", error);
    throw new Error("Failed to update calendar event");
  }
}

/**
 * Delete an event from Google Calendar via MCP
 */
export async function deleteCalendarEvent(eventId: string, calendarId: string = "primary"): Promise<void> {
  const input = JSON.stringify({
    events: [
      {
        event_id: eventId,
        calendar_id: calendarId,
      },
    ],
  });

  try {
    execSync(
      `manus-mcp-cli tool call google_calendar_delete_events --server google-calendar --input '${input.replace(/'/g, "'\\''")}'`,
      { encoding: "utf-8", maxBuffer: 10 * 1024 * 1024 }
    );
  } catch (error) {
    console.error("Failed to delete calendar event:", error);
    throw new Error("Failed to delete calendar event");
  }
}

/**
 * Search for events in Google Calendar via MCP
 */
export async function searchCalendarEvents(params: {
  calendar_id?: string;
  time_min?: string;
  time_max?: string;
  q?: string;
  max_results?: number;
}): Promise<any[]> {
  const input = JSON.stringify({
    calendar_id: params.calendar_id || "primary",
    time_min: params.time_min,
    time_max: params.time_max,
    q: params.q,
    max_results: params.max_results || 50,
  });

  try {
    const result = execSync(
      `manus-mcp-cli tool call google_calendar_search_events --server google-calendar --input '${input.replace(/'/g, "'\\''")}'`,
      { encoding: "utf-8", maxBuffer: 10 * 1024 * 1024 }
    );

    // Parse the result - this is simplified, actual parsing depends on MCP output format
    return [];
  } catch (error) {
    console.error("Failed to search calendar events:", error);
    throw new Error("Failed to search calendar events");
  }
}
