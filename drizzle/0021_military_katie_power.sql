CREATE TABLE `propertyLinks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`propertyId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`url` text NOT NULL,
	`showOnLandingPage` boolean NOT NULL DEFAULT false,
	`displayOrder` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `propertyLinks_id` PRIMARY KEY(`id`)
);
