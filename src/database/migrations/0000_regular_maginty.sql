CREATE TABLE `document` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`content` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `model` (
	`id` text NOT NULL,
	`serviceId` text NOT NULL,
	`name` text NOT NULL,
	`visible` integer NOT NULL,
	PRIMARY KEY(`id`, `serviceId`)
);
--> statement-breakpoint
CREATE TABLE `project` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`prompt` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `responseMessage` (
	`id` text PRIMARY KEY NOT NULL,
	`index` integer NOT NULL,
	`responseId` text NOT NULL,
	`role` text NOT NULL,
	`content` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `response` (
	`id` text PRIMARY KEY NOT NULL,
	`projectId` text NOT NULL,
	`modelId` text NOT NULL,
	`error` text
);
--> statement-breakpoint
CREATE TABLE `service` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`providerId` text NOT NULL,
	`baseURL` text NOT NULL,
	`apiKey` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `document_name_unique` ON `document` (`name`);