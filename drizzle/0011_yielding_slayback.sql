CREATE TABLE `inquiries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`propertyId` int,
	`contactId` int,
	`channel` enum('whatsapp','facebook','instagram','telegram','email','phone','form','other') NOT NULL,
	`superchatContactId` varchar(255),
	`superchatConversationId` varchar(255),
	`superchatMessageId` varchar(255),
	`contactName` varchar(255),
	`contactPhone` varchar(50),
	`contactEmail` varchar(320),
	`subject` varchar(500),
	`messageText` text,
	`status` enum('new','in_progress','replied','closed') DEFAULT 'new',
	`assignedTo` int,
	`firstResponseAt` timestamp,
	`lastResponseAt` timestamp,
	`responseCount` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `inquiries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `properties` ADD `externalId` varchar(255);--> statement-breakpoint
ALTER TABLE `properties` ADD `syncSource` varchar(100);--> statement-breakpoint
ALTER TABLE `properties` ADD `lastSyncedAt` timestamp;--> statement-breakpoint
ALTER TABLE `properties` ADD `petsAllowed` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `properties` ADD CONSTRAINT `properties_externalId_unique` UNIQUE(`externalId`);