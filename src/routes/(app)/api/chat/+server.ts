import { StreamingTextResponse, streamText } from "ai";
import type { RequestHandler } from "./$types";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createMistral } from "@ai-sdk/mistral";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

export const POST = (async ({ request }) => {
  let { messages, sdkId, apiKey, baseURL, modelName } = (await request.json()) as {
    messages: any[];
    sdkId: string;
    baseURL: string;
    apiKey: string;
    modelName: string;
  };

  baseURL = baseURL ?? undefined;

  if (!sdkId || !modelName) {
    return new Response(`Malformed request`, {
      status: 400,
    });
  }

  let provider;
  switch (sdkId) {
    case "openai":
      provider = createOpenAI({ apiKey, baseURL });
      break;
    case "anthropic":
      provider = createAnthropic({ apiKey });
      break;
    case "mistral":
      provider = createMistral({ apiKey, baseURL });
      break;
    case "google":
      provider = createGoogleGenerativeAI({ apiKey, baseURL });
      break;
    default:
      return new Response(`Unsupported sdk ${sdkId}`, {
        status: 400,
      });
  }

  try {
    const result = await streamText({
      model: provider.chat(modelName),
      messages,
    });
    return new StreamingTextResponse(result.toAIStream());
  } catch (e: unknown) {
    return new Response(e instanceof Error ? e.message : "Unknown error", {
      status: 500,
    });
  }
}) satisfies RequestHandler;
