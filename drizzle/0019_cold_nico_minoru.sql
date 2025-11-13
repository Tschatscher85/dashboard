ALTER TABLE `properties` MODIFY COLUMN `status` enum('acquisition','preparation','marketing','reserved','notary','sold','completed') NOT NULL DEFAULT 'acquisition';--> statement-breakpoint
ALTER TABLE `properties` ADD `descriptionHighlights` text;--> statement-breakpoint
ALTER TABLE `properties` ADD `descriptionLocation` text;--> statement-breakpoint
ALTER TABLE `properties` ADD `descriptionFazit` text;--> statement-breakpoint
ALTER TABLE `properties` ADD `descriptionCTA` text;