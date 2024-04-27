export type SupportedService = {
  id: string;
  name: string;
  compatability: "openai" | "anthropic";
  baseUrl: string;
};

export const SupportedServices: SupportedService[] = [
  {
    id: "openai",
    name: "OpenAI",
    compatability: "openai",
    baseUrl: "https://api.openai.com/v1",
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    compatability: "openai",
    baseUrl: "https://openrouter.ai/api/v1",
  },
  {
    id: "anthropic",
    name: "Anthropic",
    compatability: "anthropic",
    baseUrl: "https://api.anthropic.com",
  },
];
