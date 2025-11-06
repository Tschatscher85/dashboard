ALTER TABLE `properties` ADD `bathroomFeatures` text;--> statement-breakpoint
ALTER TABLE `properties` ADD `flooringTypes` text;--> statement-breakpoint
ALTER TABLE `properties` DROP COLUMN `bathShower`;--> statement-breakpoint
ALTER TABLE `properties` DROP COLUMN `bathTub`;--> statement-breakpoint
ALTER TABLE `properties` DROP COLUMN `bathWindow`;--> statement-breakpoint
ALTER TABLE `properties` DROP COLUMN `flooringTiles`;--> statement-breakpoint
ALTER TABLE `properties` DROP COLUMN `flooringLaminate`;--> statement-breakpoint
ALTER TABLE `properties` DROP COLUMN `flooringPVC`;--> statement-breakpoint
ALTER TABLE `properties` DROP COLUMN `flooringParquet`;--> statement-breakpoint
ALTER TABLE `properties` DROP COLUMN `flooringVinyl`;
