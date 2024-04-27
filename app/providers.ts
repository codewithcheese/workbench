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
];
