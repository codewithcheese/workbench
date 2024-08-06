ALTER TABLE `service` RENAME TO `aiAccount`;--> statement-breakpoint
ALTER TABLE `model` RENAME TO `aiModel`;--> statement-breakpoint
ALTER TABLE `aiModel` RENAME COLUMN `serviceId` TO `aiAccountId`;--> statement-breakpoint
ALTER TABLE `aiAccount` RENAME COLUMN `providerId` TO `aiServiceId`;--> statement-breakpoint

DROP INDEX IF EXISTS `serviceId_idx`;--> statement-breakpoint
DROP INDEX IF EXISTS `serviceName_unique`;--> statement-breakpoint
CREATE INDEX `aiAccountId_idx` ON `aiModel` (`aiAccountId`);--> statement-breakpoint
CREATE UNIQUE INDEX `aiAccountId_unique` ON `aiModel` (`aiAccountId`,`name`);
--> statement-breakpoint
ALTER TABLE `aiModel` RENAME TO `aiModel_old`;
--> statement-breakpoint
CREATE TABLE `aiModel` (
  `id` TEXT PRIMARY KEY NOT NULL,
  `aiAccountId` TEXT NOT NULL,
  `name` TEXT NOT NULL,
  `visible` INTEGER NOT NULL,
  `createdAt` TEXT DEFAULT (CURRENT_TIMESTAMP),
  FOREIGN KEY (`aiAccountId`) REFERENCES `aiAccount`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
INSERT INTO `aiModel` (`id`, `aiAccountId`, `name`, `visible`, `createdAt`)
SELECT `id`, `aiAccountId`, `name`, `visible`, `createdAt`
FROM `aiModel_old`;
--> statement-breakpoint
DROP TABLE `aiModel_old`;
--> statement-breakpoint
CREATE INDEX `aiAccountId_idx` ON `aiModel` (`aiAccountId`);
--> statement-breakpoint
CREATE UNIQUE INDEX `aiAccountId_unique` ON `aiModel` (`aiAccountId`,`name`);
--> statement-breakpoint
-- Make baseURL nullable in aiAccount table
CREATE TABLE `aiAccount_new` (
  `id` TEXT PRIMARY KEY NOT NULL,
  `name` TEXT NOT NULL,
  `aiServiceId` TEXT NOT NULL,
  `baseURL` TEXT,
  `apiKey` TEXT NOT NULL,
  `createdAt` TEXT DEFAULT (CURRENT_TIMESTAMP)
);
--> statement-breakpoint
INSERT INTO `aiAccount_new` SELECT * FROM `aiAccount`;
--> statement-breakpoint
DROP TABLE `aiAccount`;
--> statement-breakpoint
ALTER TABLE `aiAccount_new` RENAME TO `aiAccount`;
