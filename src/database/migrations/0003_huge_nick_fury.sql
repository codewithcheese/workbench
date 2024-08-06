CREATE TABLE IF NOT EXISTS `message` (
	`id` text PRIMARY KEY NOT NULL,
	`index` integer NOT NULL,
	`revisionId` text NOT NULL,
	`role` text NOT NULL,
	`content` text NOT NULL,
	`createdAt` text DEFAULT (CURRENT_TIMESTAMP),
	FOREIGN KEY (`revisionId`) REFERENCES `revision`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `revision` (
	`id` text PRIMARY KEY NOT NULL,
	`version` integer NOT NULL,
	`chatId` text NOT NULL,
	`error` text,
	`createdAt` text DEFAULT (CURRENT_TIMESTAMP),
	FOREIGN KEY (`chatId`) REFERENCES `chat`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `message_revisionId_idx` ON `message` (`revisionId`);--> statement-breakpoint
CREATE INDEX `revision_chatId_idx` ON `revision` (`chatId`);
--> statement-breakpoint
INSERT INTO revision ("id", "version", "chatId", "error", "createdAt")
SELECT
    r."id",
    (SELECT COUNT(*)
     FROM response r2
     WHERE r2."chatId" = r."chatId" AND r2."createdAt" <= r."createdAt") AS version,
    r."chatId",
    r."error",
    r."createdAt"
FROM response r;
--> statement-breakpoint
INSERT INTO message ("id", "index", "revisionId", "role", "content", "createdAt")
SELECT
    rm."id",
    rm."index",
    rm."responseId" AS revisionId,
    rm."role",
    rm."content",
    rm."createdAt"
FROM responseMessage rm;
