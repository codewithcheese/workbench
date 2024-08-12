CREATE TABLE IF NOT EXISTS "attachment" (
	"id" text PRIMARY KEY NOT NULL,
	"message_id" text NOT NULL,
	"document_id" text NOT NULL,
	"created_at" text DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "message_document_unique" UNIQUE("message_id","document_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "chat" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"prompt" text NOT NULL,
	"created_at" text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "document" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" text DEFAULT 'document' NOT NULL,
	"description" text NOT NULL,
	"content" text NOT NULL,
	"attributes" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "key" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"service_id" text NOT NULL,
	"base_url" text,
	"api_key" text NOT NULL,
	"created_at" text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "message" (
	"id" text PRIMARY KEY NOT NULL,
	"index" integer NOT NULL,
	"revision_id" text NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"created_at" text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "model" (
	"id" text PRIMARY KEY NOT NULL,
	"key_id" text NOT NULL,
	"name" text NOT NULL,
	"visible" integer NOT NULL,
	"created_at" text DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "account_id_unique" UNIQUE("key_id","name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "revision" (
	"id" text PRIMARY KEY NOT NULL,
	"version" integer NOT NULL,
	"chat_id" text NOT NULL,
	"error" text,
	"created_at" text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sdk" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"type" text DEFAULT 'model' NOT NULL,
	"name" text NOT NULL,
	"supported" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "service" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"sdk_id" text NOT NULL,
	"base_url" text NOT NULL,
	"created_at" text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "attachment" ADD CONSTRAINT "attachment_message_id_message_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."message"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "attachment" ADD CONSTRAINT "attachment_document_id_document_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."document"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "message" ADD CONSTRAINT "message_revision_id_revision_id_fk" FOREIGN KEY ("revision_id") REFERENCES "public"."revision"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "model" ADD CONSTRAINT "model_key_id_key_id_fk" FOREIGN KEY ("key_id") REFERENCES "public"."key"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "revision" ADD CONSTRAINT "revision_chat_id_chat_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."chat"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "attachment_message_id_idx" ON "attachment" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "message_revision_id_idx" ON "message" USING btree ("revision_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "account_id_idx" ON "model" USING btree ("key_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "revision_chat_id_idx" ON "revision" USING btree ("chat_id");