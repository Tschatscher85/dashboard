CREATE TABLE `brokerContracts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contractNumber` varchar(100),
	`contractType` enum('exclusive','simple','qualified_exclusive') NOT NULL,
	`contactId` int NOT NULL,
	`propertyId` int NOT NULL,
	`commissionRate` int,
	`commissionAmount` int,
	`commissionType` enum('percentage','fixed'),
	`startDate` timestamp NOT NULL,
	`endDate` timestamp,
	`status` enum('active','completed','cancelled') DEFAULT 'active',
	`notes` text,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `brokerContracts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `insurancePolicies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`policyNumber` varchar(100),
	`insuranceType` enum('building','liability','legal','household','elemental','glass','other') NOT NULL,
	`provider` varchar(255),
	`contactId` int,
	`propertyId` int,
	`premium` int,
	`paymentInterval` enum('monthly','quarterly','yearly'),
	`startDate` timestamp,
	`endDate` timestamp,
	`status` enum('active','expired','cancelled') DEFAULT 'active',
	`notes` text,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `insurancePolicies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `maintenanceRecords` (
	`id` int AUTO_INCREMENT NOT NULL,
	`propertyId` int NOT NULL,
	`date` timestamp NOT NULL,
	`description` text NOT NULL,
	`category` enum('repair','inspection','cleaning','renovation','other') NOT NULL,
	`cost` int,
	`vendor` varchar(255),
	`status` enum('scheduled','in_progress','completed','cancelled') DEFAULT 'scheduled',
	`notes` text,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `maintenanceRecords_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `propertyManagementContracts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contractNumber` varchar(100),
	`propertyId` int NOT NULL,
	`managerId` int NOT NULL,
	`monthlyFee` int,
	`services` text,
	`startDate` timestamp NOT NULL,
	`endDate` timestamp,
	`status` enum('active','expired','cancelled') DEFAULT 'active',
	`notes` text,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `propertyManagementContracts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `utilityBills` (
	`id` int AUTO_INCREMENT NOT NULL,
	`propertyId` int NOT NULL,
	`year` int NOT NULL,
	`month` int,
	`type` enum('heating','water','electricity','gas','waste','cleaning','maintenance','insurance','property_tax','other') NOT NULL,
	`amount` int NOT NULL,
	`paidBy` enum('owner','tenant','management'),
	`status` enum('pending','paid','overdue') DEFAULT 'pending',
	`notes` text,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `utilityBills_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `contacts` ADD `tags` text;