ALTER TABLE `properties` ADD `supervisorId` int;--> statement-breakpoint
ALTER TABLE `properties` ADD `ownerId` int;--> statement-breakpoint
ALTER TABLE `properties` ADD `ownerType` varchar(100);--> statement-breakpoint
ALTER TABLE `properties` ADD `buyerId` int;--> statement-breakpoint
ALTER TABLE `properties` ADD `notaryId` int;--> statement-breakpoint
ALTER TABLE `properties` ADD `propertyManagementId` int;--> statement-breakpoint
ALTER TABLE `properties` ADD `tenantId` int;--> statement-breakpoint
ALTER TABLE `properties` ADD `linkedContactIds` text;--> statement-breakpoint
ALTER TABLE `properties` ADD `portalExports` text;--> statement-breakpoint
ALTER TABLE `properties` ADD `is24ContactPerson` varchar(255);--> statement-breakpoint
ALTER TABLE `properties` ADD `is24Id` varchar(100);--> statement-breakpoint
ALTER TABLE `properties` ADD `is24GroupNumber` varchar(100);--> statement-breakpoint
ALTER TABLE `properties` ADD `translations` text;--> statement-breakpoint
ALTER TABLE `properties` ADD `assignmentType` varchar(100);--> statement-breakpoint
ALTER TABLE `properties` ADD `assignmentDuration` varchar(100);--> statement-breakpoint
ALTER TABLE `properties` ADD `assignmentFrom` timestamp;--> statement-breakpoint
ALTER TABLE `properties` ADD `assignmentTo` timestamp;--> statement-breakpoint
ALTER TABLE `properties` ADD `saleInfo` text;--> statement-breakpoint
ALTER TABLE `properties` ADD `internalCommissionPercent` varchar(50);--> statement-breakpoint
ALTER TABLE `properties` ADD `internalCommissionType` enum('percent','euro') DEFAULT 'percent';--> statement-breakpoint
ALTER TABLE `properties` ADD `externalCommissionInternalPercent` varchar(50);--> statement-breakpoint
ALTER TABLE `properties` ADD `externalCommissionInternalType` enum('percent','euro') DEFAULT 'percent';--> statement-breakpoint
ALTER TABLE `properties` ADD `totalCommission` int;--> statement-breakpoint
ALTER TABLE `properties` ADD `externalCommissionForExpose` varchar(255);--> statement-breakpoint
ALTER TABLE `properties` ADD `commissionNote` text;--> statement-breakpoint
ALTER TABLE `properties` ADD `billingInfo` text;--> statement-breakpoint
ALTER TABLE `properties` ADD `walkingTimeToPublicTransport` int;--> statement-breakpoint
ALTER TABLE `properties` ADD `distanceToPublicTransport` int;--> statement-breakpoint
ALTER TABLE `properties` ADD `drivingTimeToHighway` int;--> statement-breakpoint
ALTER TABLE `properties` ADD `distanceToHighway` int;--> statement-breakpoint
ALTER TABLE `properties` ADD `drivingTimeToMainStation` int;--> statement-breakpoint
ALTER TABLE `properties` ADD `distanceToMainStation` int;--> statement-breakpoint
ALTER TABLE `properties` ADD `drivingTimeToAirport` int;--> statement-breakpoint
ALTER TABLE `properties` ADD `distanceToAirport` int;