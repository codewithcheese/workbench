CREATE TABLE `document` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`content` text NOT NULL,
	`createdAt` text DEFAULT (CURRENT_TIMESTAMP)
);
--> statement-breakpoint
CREATE TABLE `model` (
	`id` text PRIMARY KEY NOT NULL,
	`serviceId` text NOT NULL,
	`name` text NOT NULL,
	`visible` integer NOT NULL,
	`createdAt` text DEFAULT (CURRENT_TIMESTAMP),
	FOREIGN KEY (`serviceId`) REFERENCES `service`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `project` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`prompt` text NOT NULL,
	`createdAt` text DEFAULT (CURRENT_TIMESTAMP)
);
--> statement-breakpoint
CREATE TABLE `responseMessage` (
	`id` text PRIMARY KEY NOT NULL,
	`index` integer NOT NULL,
	`responseId` text NOT NULL,
	`role` text NOT NULL,
	`content` text NOT NULL,
	`createdAt` text DEFAULT (CURRENT_TIMESTAMP),
	FOREIGN KEY (`responseId`) REFERENCES `response`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `response` (
	`id` text PRIMARY KEY NOT NULL,
	`projectId` text NOT NULL,
	`modelId` text NOT NULL,
	`error` text,
	`createdAt` text DEFAULT (CURRENT_TIMESTAMP),
	FOREIGN KEY (`projectId`) REFERENCES `project`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`modelId`) REFERENCES `model`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `service` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`providerId` text NOT NULL,
	`baseURL` text NOT NULL,
	`apiKey` text NOT NULL,
	`createdAt` text DEFAULT (CURRENT_TIMESTAMP)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `document_name_unique` ON `document` (`name`);--> statement-breakpoint
CREATE INDEX `serviceId_idx` ON `model` (`serviceId`);--> statement-breakpoint
CREATE INDEX `responseId_idx` ON `responseMessage` (`responseId`);--> statement-breakpoint
CREATE INDEX `projectId_idx` ON `response` (`projectId`);