ALTER TABLE `properties` ADD `is24ExternalId` varchar(100);--> statement-breakpoint
ALTER TABLE `properties` ADD `is24PublishStatus` enum('draft','published','unpublished','error') DEFAULT 'draft';--> statement-breakpoint
ALTER TABLE `properties` ADD `is24LastSyncedAt` timestamp;--> statement-breakpoint
ALTER TABLE `properties` ADD `is24ContactId` varchar(100);--> statement-breakpoint
ALTER TABLE `properties` ADD `is24ErrorMessage` text;--> statement-breakpoint
ALTER TABLE `properties` ADD `interiorQuality` enum('simple','normal','sophisticated','luxury');--> statement-breakpoint
ALTER TABLE `properties` ADD `numberOfBathrooms` int;--> statement-breakpoint
ALTER TABLE `properties` ADD `numberOfBedrooms` int;--> statement-breakpoint
ALTER TABLE `properties` ADD `freeFrom` timestamp;