import { experimental_streamText, StreamingTextResponse } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { messages, providerId, apiKey, baseURL, modelId } =
    (await req.json()) as {
      messages: any[];
      providerId: string;
      baseURL: string;
      apiKey: string;
      modelId: string;
    };

  if (!providerId || !baseURL || !modelId) {
    return new Response(`Malformed request`, {
      status: 400,
    });
  }

  let provider;
  if (providerId === "openai") {
    provider = createOpenAI({ apiKey, baseURL });
  } else if (providerId === "anthropic") {
    provider = createAnthropic({ apiKey });
  } else {
    return new Response("Unsupported service", {
      status: 400,
    });
  }

  try {
    const result = await experimental_streamText({
      model: provider.chat(modelId),
      messages,
    });
    return new StreamingTextResponse(result.toAIStream());
  } catch (e: unknown) {
    return new Response(e instanceof Error ? e.message : "Unknown error", {
      status: 500,
    });
  }
}
