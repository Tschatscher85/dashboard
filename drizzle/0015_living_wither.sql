ALTER TABLE `documents` ADD `category` varchar(100);--> statement-breakpoint
ALTER TABLE `documents` ADD `tags` text;--> statement-breakpoint
ALTER TABLE `documents` ADD `showOnLandingPage` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `documents` ADD `isFloorPlan` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `documents` ADD `useInExpose` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `documents` ADD `sortOrder` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `propertyImages` ADD `category` varchar(100);--> statement-breakpoint
ALTER TABLE `propertyImages` ADD `displayName` varchar(255);--> statement-breakpoint
ALTER TABLE `propertyImages` ADD `showOnLandingPage` int DEFAULT 1;