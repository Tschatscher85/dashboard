ALTER TABLE `properties` MODIFY COLUMN `status` enum('acquisition','preparation','marketing','reserved','sold','rented','inactive') NOT NULL DEFAULT 'acquisition';--> statement-breakpoint
ALTER TABLE `properties` ADD `unitNumber` varchar(100);--> statement-breakpoint
ALTER TABLE `properties` ADD `apartmentNumber` varchar(50);--> statement-breakpoint
ALTER TABLE `properties` ADD `parkingNumber` varchar(50);--> statement-breakpoint
ALTER TABLE `properties` ADD `headline` varchar(500);--> statement-breakpoint
ALTER TABLE `properties` ADD `headlineScore` int;--> statement-breakpoint
ALTER TABLE `properties` ADD `project` varchar(255);--> statement-breakpoint
ALTER TABLE `properties` ADD `features` text;--> statement-breakpoint
ALTER TABLE `properties` ADD `warning` text;--> statement-breakpoint
ALTER TABLE `properties` ADD `archived` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `properties` ADD `internalNotes` text;--> statement-breakpoint
ALTER TABLE `properties` ADD `category` varchar(100);--> statement-breakpoint
ALTER TABLE `properties` ADD `subType` varchar(100);--> statement-breakpoint
ALTER TABLE `properties` ADD `region` varchar(100);--> statement-breakpoint
ALTER TABLE `properties` ADD `latitude` varchar(50);--> statement-breakpoint
ALTER TABLE `properties` ADD `longitude` varchar(50);--> statement-breakpoint
ALTER TABLE `properties` ADD `hideStreetOnPortals` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `properties` ADD `districtCourt` varchar(255);--> statement-breakpoint
ALTER TABLE `properties` ADD `landRegisterSheet` varchar(100);--> statement-breakpoint
ALTER TABLE `properties` ADD `landRegisterOf` varchar(255);--> statement-breakpoint
ALTER TABLE `properties` ADD `cadastralDistrict` varchar(100);--> statement-breakpoint
ALTER TABLE `properties` ADD `corridor` varchar(100);--> statement-breakpoint
ALTER TABLE `properties` ADD `parcel` varchar(100);--> statement-breakpoint
ALTER TABLE `properties` ADD `usableArea` int;--> statement-breakpoint
ALTER TABLE `properties` ADD `balconyArea` int;--> statement-breakpoint
ALTER TABLE `properties` ADD `gardenArea` int;--> statement-breakpoint
ALTER TABLE `properties` ADD `floorLevel` varchar(100);--> statement-breakpoint
ALTER TABLE `properties` ADD `priceOnRequest` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `properties` ADD `priceByNegotiation` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `properties` ADD `coldRent` int;--> statement-breakpoint
ALTER TABLE `properties` ADD `warmRent` int;--> statement-breakpoint
ALTER TABLE `properties` ADD `heatingIncludedInAdditional` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `properties` ADD `nonRecoverableCosts` int;--> statement-breakpoint
ALTER TABLE `properties` ADD `houseMoney` int;--> statement-breakpoint
ALTER TABLE `properties` ADD `maintenanceReserve` int;--> statement-breakpoint
ALTER TABLE `properties` ADD `parkingPrice` int;--> statement-breakpoint
ALTER TABLE `properties` ADD `monthlyRentalIncome` int;--> statement-breakpoint
ALTER TABLE `properties` ADD `isBarrierFree` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `properties` ADD `hasGuestToilet` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `properties` ADD `hasBuiltInKitchen` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `properties` ADD `hasLoggia` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `properties` ADD `isMonument` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `properties` ADD `suitableAsHoliday` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `properties` ADD `hasStorageRoom` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `properties` ADD `hasFireplace` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `properties` ADD `hasPool` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `properties` ADD `hasSauna` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `properties` ADD `hasAlarm` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `properties` ADD `hasWinterGarden` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `properties` ADD `hasAirConditioning` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `properties` ADD `parkingCount` int;--> statement-breakpoint
ALTER TABLE `properties` ADD `parkingType` varchar(100);--> statement-breakpoint
ALTER TABLE `properties` ADD `bathShower` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `properties` ADD `bathTub` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `properties` ADD `bathWindow` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `properties` ADD `flooringTiles` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `properties` ADD `flooringLaminate` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `properties` ADD `flooringPVC` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `properties` ADD `flooringParquet` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `properties` ADD `flooringVinyl` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `properties` ADD `lastModernization` int;--> statement-breakpoint
ALTER TABLE `properties` ADD `buildingPhase` varchar(100);--> statement-breakpoint
ALTER TABLE `properties` ADD `equipmentQuality` varchar(100);--> statement-breakpoint
ALTER TABLE `properties` ADD `isRented` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `properties` ADD `autoExpose` boolean DEFAULT true;