ALTER TABLE `contacts` ADD `brevoSyncStatus` enum('not_synced','synced','error') DEFAULT 'not_synced';--> statement-breakpoint
ALTER TABLE `contacts` ADD `brevoLastSyncedAt` timestamp;--> statement-breakpoint
ALTER TABLE `contacts` ADD `brevoListId` int;--> statement-breakpoint
ALTER TABLE `contacts` ADD `brevoErrorMessage` text;--> statement-breakpoint
ALTER TABLE `contacts` ADD `inquiryType` enum('property_inquiry','owner_inquiry','insurance','property_management');