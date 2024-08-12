import type { PgliteDatabase } from "drizzle-orm/pglite";
import { newChat } from "../routes/(app)/$data";
import { sdkTable, serviceTable } from "@/database/schema";
import { useDb } from "@/database/client";

export const seed = {
  "0000_superb_jocasta": async (db: PgliteDatabase<any>) => {
    const sdks = [
      { id: "openai", slug: "openai", name: "OpenAI", type: "model", supported: 1 },
      { id: "azure", slug: "azure", name: "Azure", type: "model", supported: 0 },
      { id: "anthropic", slug: "anthropic", name: "Anthropic", type: "model", supported: 1 },
      { id: "amazon", slug: "amazon", name: "Amazon Bedrock", type: "model", supported: 0 },
      {
        id: "google-gen-ai",
        slug: "google-gen-ai",
        name: "Google Generative AI",
        type: "model",
        supported: 1,
      },
      {
        id: "google-vertex",
        slug: "google-vertex",
        name: "Google Vertex AI",
        type: "model",
        supported: 0,
      },
      { id: "mistral", slug: "mistral", name: "Mistral", type: "model", supported: 1 },
      { id: "cohere", slug: "cohere", name: "Cohere", type: "model", supported: 1 },
    ];

    await useDb().insert(sdkTable).values(sdks).onConflictDoNothing();

    console.log("AI SDKs inserted");

    // Insert AI Services
    const services = [
      { id: "openai", name: "OpenAI", sdkId: "openai", baseURL: "" },
      { id: "azure", name: "Azure OpenAI", sdkId: "azure", baseURL: "" },
      { id: "anthropic", name: "Anthropic", sdkId: "anthropic", baseURL: "" },
      { id: "amazon-bedrock", name: "Amazon Bedrock", sdkId: "amazon", baseURL: "" },
      { id: "google-gen-ai", name: "Google Generative AI", sdkId: "google-gen-ai", baseURL: "" },
      { id: "google-vertex", name: "Google Vertex AI", sdkId: "google-vertex", baseURL: "" },
      { id: "mistral", name: "Mistral", sdkId: "mistral", baseURL: "" },
      { id: "groq", name: "Groq", sdkId: "openai", baseURL: "https://api.groq.com/openai/v1" },
      {
        id: "perplexity",
        name: "Perplexity",
        sdkId: "openai",
        baseURL: "https://api.perplexity.ai/",
      },
      {
        id: "fireworks",
        name: "Fireworks",
        sdkId: "openai",
        baseURL: "https://api.fireworks.ai/inference/v1",
      },
      {
        id: "nvidia",
        name: "Nvidia",
        sdkId: "openai",
        baseURL: "https://integrate.api.nvidia.com/v1",
      },
      { id: "cohere", name: "Cohere", sdkId: "cohere", baseURL: "" },
    ];

    await useDb().insert(serviceTable).values(services).onConflictDoNothing();

    return newChat();
  },
};
