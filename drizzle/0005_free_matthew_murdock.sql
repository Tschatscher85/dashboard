ALTER TABLE `properties` ADD `energyCertificateAvailability` varchar(100);--> statement-breakpoint
ALTER TABLE `properties` ADD `energyCertificateCreationDate` varchar(50);--> statement-breakpoint
ALTER TABLE `properties` ADD `energyCertificateIssueDate` varchar(20);--> statement-breakpoint
ALTER TABLE `properties` ADD `energyCertificateValidUntil` varchar(20);--> statement-breakpoint
ALTER TABLE `properties` ADD `energyCertificateType` varchar(50);--> statement-breakpoint
ALTER TABLE `properties` ADD `energyConsumptionElectricity` int;--> statement-breakpoint
ALTER TABLE `properties` ADD `energyConsumptionHeat` int;--> statement-breakpoint
ALTER TABLE `properties` ADD `co2Emissions` int;--> statement-breakpoint
ALTER TABLE `properties` ADD `includesWarmWater` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `properties` ADD `mainEnergySource` varchar(100);--> statement-breakpoint
ALTER TABLE `properties` ADD `buildingYearUnknown` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `properties` ADD `heatingSystemYear` int;