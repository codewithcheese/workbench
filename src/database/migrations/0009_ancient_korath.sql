CREATE TABLE `aiSdk` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `aiService` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`aiSdkId` text NOT NULL,
	`baseURL` text NULL,
	`createdAt` text DEFAULT (CURRENT_TIMESTAMP)
);
--> statement-breakpoint
INSERT INTO aiSdk (id, slug, name) VALUES
('openai', 'openai', 'OpenAI'),
('azure', 'azure', 'Azure'),
('anthropic', 'anthropic', 'Anthropic'),
('amazon', 'amazon', 'Amazon Bedrock'),
('google-gen-ai', 'google-gen-ai', 'Google Generative AI'),
('google-vertex', 'google-vertex', 'Google Vertex AI'),
('mistral', 'mistral', 'Mistral'),
('cohere', 'cohere', 'Cohere');
--> statement-breakpoint
INSERT INTO aiService (id, name, aiSdkId, baseURL) VALUES
('openai', 'OpenAI', 'openai', NULL),
('azure', 'Azure OpenAI', 'azure', NULL),
('anthropic', 'Anthropic', 'anthropic', NULL),
('amazon-bedrock', 'Amazon Bedrock', 'amazon', NULL),
('google-gen-ai', 'Google Generative AI', 'google-gen-ai', NULL),
('google-vertex', 'Google Vertex AI', 'google-vertex', NULL),
('mistral', 'Mistral', 'mistral', NULL),
('groq', 'Groq', 'openai', 'https://api.groq.com/openai/v1'),
('perplexity', 'Perplexity', 'openai', 'https://api.perplexity.ai/'),
('fireworks', 'Fireworks', 'openai', 'https://api.fireworks.ai/inference/v1'),
('cohere', 'Cohere', 'cohere', NULL);

