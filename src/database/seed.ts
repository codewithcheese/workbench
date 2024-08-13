import { sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { PgTransaction } from "drizzle-orm/pg-core";

export const seed = {
  "0000": async (tx: PgTransaction<any>) => {
    await tx.execute(sql`INSERT INTO sdk (id, slug, name, type, supported) VALUES
      ('openai', 'openai', 'OpenAI', 'model', 1),
      ('azure', 'azure', 'Azure', 'model', 0),
      ('anthropic', 'anthropic', 'Anthropic', 'model', 1),
      ('amazon', 'amazon', 'Amazon Bedrock', 'model', 0),
      ('google-gen-ai', 'google-gen-ai', 'Google Generative AI', 'model', 1),
      ('google-vertex', 'google-vertex', 'Google Vertex AI', 'model', 0),
      ('mistral', 'mistral', 'Mistral', 'model', 1),
      ('cohere', 'cohere', 'Cohere', 'model', 1),
      ('unstructured', 'unstructured', 'Unstructured', 'document', 1);
      `);

    await tx.execute(sql`INSERT INTO service (id, name, sdk_id, base_url) VALUES
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
      ('nvidia', 'Nvidia', 'openai', 'https://integrate.api.nvidia.com/v1'),
      ('cohere', 'Cohere', 'cohere', NULL),
      ('unstructured', 'Unstructured', 'unstructured', NULL);
      `);

    const chatId = nanoid(10);
    await tx.execute(sql`INSERT INTO chat (id, name, prompt) VALUES
      (${chatId}, 'Untitled', '');`);
    await tx.execute(sql`INSERT INTO revision (id, version, chat_id) VALUES
      (${nanoid(10)}, 1, ${chatId});`);
  },
};
