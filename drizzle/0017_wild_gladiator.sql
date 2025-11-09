CREATE TABLE `appConfig` (
	`configKey` varchar(255) NOT NULL,
	`configValue` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `appConfig_configKey` PRIMARY KEY(`configKey`)
);
