ALTER TABLE `properties` MODIFY COLUMN `status` enum('acquisition','preparation','marketing','reserved','notary','sold','completed') NOT NULL DEFAULT 'acquisition';--> statement-breakpoint
ALTER TABLE `properties` ADD `descriptionHighlights` text;--> statement-breakpoint
ALTER TABLE `properties` ADD `descriptionLocation` text;--> statement-breakpoint
ALTER TABLE `properties` ADD `descriptionFazit` text;--> statement-breakpoint
ALTER TABLE `properties` ADD `descriptionCTA` text;--> statement-breakpoint
ALTER TABLE `properties` ADD `auftragsart` varchar(100);--> statement-breakpoint
ALTER TABLE `properties` ADD `laufzeit` varchar(100);--> statement-breakpoint
ALTER TABLE `properties` ADD `auftragVonDate` timestamp;--> statement-breakpoint
ALTER TABLE `properties` ADD `auftragBisDate` timestamp;