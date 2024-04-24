import { StreamingTextResponse, experimental_streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { messages, model } = await req.json();

  const result = await experimental_streamText({
    model: anthropic.chat(model),
    messages,
  });

  return new StreamingTextResponse(result.toAIStream());
}
