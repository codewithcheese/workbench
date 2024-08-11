ALTER TABLE `sdk` ADD `type` text DEFAULT 'model' NOT NULL;
--> statement-breakpoint
INSERT INTO sdk (id, slug, type, name) VALUES
('unstructured', 'unstructured', 'document', 'Unstructured');
--> statement-breakpoint
INSERT INTO service (id, name, sdkId, baseURL) VALUES
('unstructured', 'Unstructured', 'unstructured', 'https://api.unstructured.io/general/v0/general');
