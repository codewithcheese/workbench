ALTER TABLE `aiAccount` RENAME TO `key`;--> statement-breakpoint
ALTER TABLE `aiModel` RENAME TO `model`;--> statement-breakpoint
ALTER TABLE `aiSdk` RENAME TO `sdk`;--> statement-breakpoint
ALTER TABLE `aiService` RENAME TO `service`;--> statement-breakpoint
ALTER TABLE `key` RENAME COLUMN `aiServiceId` TO `serviceId`;--> statement-breakpoint
ALTER TABLE `model` RENAME COLUMN `aiAccountId` TO `keyId`;--> statement-breakpoint
ALTER TABLE `service` RENAME COLUMN `aiSdkId` TO `sdkId`;--> statement-breakpoint
/*
 SQLite does not support "Dropping foreign key" out of the box, we do not generate automatic migration for that, so it has to be done manually
 Please refer to: https://www.techonthenet.com/sqlite/tables/alter_table.php
                  https://www.sqlite.org/lang_altertable.html

 Due to that we don't generate migration automatically and it has to be done manually
*/--> statement-breakpoint
DROP INDEX IF EXISTS `accountId_idx`;--> statement-breakpoint
DROP INDEX IF EXISTS `accountId_unique`;--> statement-breakpoint
CREATE INDEX `accountId_idx` ON `model` (`keyId`);--> statement-breakpoint
CREATE UNIQUE INDEX `accountId_unique` ON `model` (`keyId`,`name`);--> statement-breakpoint
/*
 SQLite does not support "Creating foreign key on existing column" out of the box, we do not generate automatic migration for that, so it has to be done manually
 Please refer to: https://www.techonthenet.com/sqlite/tables/alter_table.php
                  https://www.sqlite.org/lang_altertable.html

 Due to that we don't generate migration automatically and it has to be done manually
*/
--> statement-breakpoint
ALTER TABLE `model` RENAME TO `model_old`;
--> statement-breakpoint
CREATE TABLE `model` (
  `id` TEXT PRIMARY KEY NOT NULL,
  `keyId` TEXT NOT NULL,
  `name` TEXT NOT NULL,
  `visible` INTEGER NOT NULL,
  `createdAt` TEXT DEFAULT (CURRENT_TIMESTAMP),
  FOREIGN KEY (`keyId`) REFERENCES `key`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
INSERT INTO `model` (`id`, `keyId`, `name`, `visible`, `createdAt`)
SELECT `id`, `keyId`, `name`, `visible`, `createdAt`
FROM `model_old`;
--> statement-breakpoint
DROP TABLE `model_old`;
--> statement-breakpoint
CREATE INDEX `keyId_idx` ON `model` (`keyId`);
--> statement-breakpoint
CREATE UNIQUE INDEX `keyId_unique` ON `model` (`keyId`,`name`);
--> statement-breakpoint
-- Make baseURL nullable in key table
CREATE TABLE `key_new` (
  `id` TEXT PRIMARY KEY NOT NULL,
  `name` TEXT NOT NULL,
  `serviceId` TEXT NOT NULL,
  `baseURL` TEXT,
  `apiKey` TEXT NOT NULL,
  `createdAt` TEXT DEFAULT (CURRENT_TIMESTAMP)
);
--> statement-breakpoint
INSERT INTO `key_new` SELECT * FROM `key`;
--> statement-breakpoint
DROP TABLE `key`;
--> statement-breakpoint
ALTER TABLE `key_new` RENAME TO `key`;
