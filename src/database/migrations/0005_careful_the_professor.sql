CREATE TABLE `attachment` (
	`id` text PRIMARY KEY NOT NULL,
	`messageId` text NOT NULL,
	`documentId` text NOT NULL,
	`createdAt` text DEFAULT (CURRENT_TIMESTAMP),
	FOREIGN KEY (`messageId`) REFERENCES `message`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`documentId`) REFERENCES `document`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `document` ADD `type` text DEFAULT 'document' NOT NULL;--> statement-breakpoint
CREATE INDEX `attachment_messageId_idx` ON `attachment` (`messageId`);--> statement-breakpoint
CREATE UNIQUE INDEX `messageDocument_unique` ON `attachment` (`messageId`,`documentId`);