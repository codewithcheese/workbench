ALTER TABLE `sdk` ADD `supported` integer DEFAULT 1 NOT NULL;
--> statement-breakpoint
/* Disable Azure, Amazon Bedrock. No method to input extra options yet */
UPDATE `sdk` SET `supported` = 0 WHERE `id` = 'azure';
--> statement-breakpoint
UPDATE `sdk` SET `supported` = 0 WHERE `id` = 'amazon';
--> statement-breakpoint
UPDATE `sdk` SET `supported` = 0 WHERE `id` = 'google-vertex';
