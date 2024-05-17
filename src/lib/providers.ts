export type Provider = {
  id: string;
  name: string;
  defaultBaseURL: string;
};

export const Providers: Provider[] = [
  {
    id: "openai",
    name: "OpenAI",
    defaultBaseURL: "https://api.openai.com/v1",
  },
  {
    id: "anthropic",
    name: "Anthropic",
    defaultBaseURL: "https://api.anthropic.com/v1",
  },
  {
    id: "mistral",
    name: "Mistral",
    defaultBaseURL: "https://api.mistral.ai/v1",
  },
  {
    id: "google",
    name: "Google",
    defaultBaseURL: "https://generativelanguage.googleapis.com/v1beta",
  },
];

export const providersById = Providers.reduce<Record<string, Provider>>((acc, provider) => {
  acc[provider.id] = provider;
  return acc;
}, {});
