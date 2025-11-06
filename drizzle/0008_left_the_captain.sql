ALTER TABLE `insurancePolicies` MODIFY COLUMN `premium` int NOT NULL;--> statement-breakpoint
ALTER TABLE `insurancePolicies` MODIFY COLUMN `paymentInterval` enum('monthly','quarterly','yearly') NOT NULL;--> statement-breakpoint
ALTER TABLE `insurancePolicies` MODIFY COLUMN `startDate` timestamp NOT NULL;