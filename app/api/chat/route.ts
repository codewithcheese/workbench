import { experimental_streamText, StreamingTextResponse } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { SupportedServices } from "@/app/services";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { messages, serviceId, modelId, apiKey } = await req.json();

  const service = Object.values(SupportedServices).find(
    (s) => s.id === serviceId
  );

  if (!service) {
    return new Response(`Unsupported service ${serviceId}`, {
      status: 400,
    });
  }

  let provider;
  if (service.compatability === "openai") {
    provider = createOpenAI({ apiKey: apiKey, baseURL: service.baseUrl });
  } else if (service.compatability === "anthropic") {
    provider = createAnthropic({ apiKey: apiKey });
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
