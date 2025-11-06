ALTER TABLE `appointments` ADD `googleCalendarEventId` varchar(255);--> statement-breakpoint
ALTER TABLE `appointments` ADD `googleCalendarLink` text;--> statement-breakpoint
ALTER TABLE `appointments` ADD `lastSyncedToGoogleCalendar` timestamp;