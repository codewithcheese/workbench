ALTER TABLE `project` RENAME TO `chat`;
--> statement-breakpoint
ALTER TABLE `response` RENAME COLUMN `projectId` TO `chatId`;
--> statement-breakpoint
DROP INDEX IF EXISTS `projectId_idx`;
--> statement-breakpoint
CREATE TABLE `new_response` (
    `id` text PRIMARY KEY NOT NULL,
    `chatId` text NOT NULL,
    `modelId` text NOT NULL,
    `error` text,
    `createdAt` text DEFAULT (CURRENT_TIMESTAMP),
    FOREIGN KEY (`chatId`) REFERENCES `chat`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `new_response` SELECT * FROM `response`;
--> statement-breakpoint
DROP TABLE `response`;
--> statement-breakpoint
ALTER TABLE `new_response` RENAME TO `response`;
--> statement-breakpoint
CREATE INDEX `chatId_idx` ON `response` (`chatId`);
--> statement-breakpoint
-- Must recreate responseMessage so that its foreign key references the new response table
CREATE TABLE `new_responseMessage` (
    `id` text PRIMARY KEY NOT NULL,
    `index` integer NOT NULL,
    `responseId` text NOT NULL,
    `role` text NOT NULL,
    `content` text NOT NULL,
    `createdAt` text DEFAULT (CURRENT_TIMESTAMP),
    FOREIGN KEY (`responseId`) REFERENCES `response`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
INSERT INTO `new_responseMessage` SELECT * FROM `responseMessage`;
--> statement-breakpoint
DROP TABLE `responseMessage`;
--> statement-breakpoint
ALTER TABLE `new_responseMessage` RENAME TO `responseMessage`;
--> statement-breakpoint
CREATE INDEX `responseId_idx` ON `responseMessage` (`responseId`);
