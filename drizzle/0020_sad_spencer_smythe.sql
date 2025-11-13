ALTER TABLE `properties` MODIFY COLUMN `status` enum('acquisition','preparation','marketing','negotiation','reserved','sold','rented','inactive') NOT NULL DEFAULT 'acquisition';--> statement-breakpoint
ALTER TABLE `properties` DROP COLUMN `descriptionHighlights`;--> statement-breakpoint
ALTER TABLE `properties` DROP COLUMN `descriptionLocation`;--> statement-breakpoint
ALTER TABLE `properties` DROP COLUMN `descriptionFazit`;--> statement-breakpoint
ALTER TABLE `properties` DROP COLUMN `descriptionCTA`;--> statement-breakpoint
ALTER TABLE `properties` DROP COLUMN `auftragsart`;--> statement-breakpoint
ALTER TABLE `properties` DROP COLUMN `laufzeit`;--> statement-breakpoint
ALTER TABLE `properties` DROP COLUMN `auftragVonDate`;--> statement-breakpoint
ALTER TABLE `properties` DROP COLUMN `auftragBisDate`;