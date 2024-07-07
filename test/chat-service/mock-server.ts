import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { OpenAIStream, StreamingTextResponse } from "ai";

const openaiChatCompletionChunks = [
  {
    id: "chatcmpl-7RyNSW2BXkOQQh7NlBc65j5kX8AjC",
    object: "chat.completion.chunk",
    created: 1686901302,
    model: "gpt-3.5-turbo-0301",
    choices: [
      {
        delta: { role: "assistant" },
        index: 0,
        finish_reason: null,
      },
    ],
  },
  {
    id: "chatcmpl-7RyNSW2BXkOQQh7NlBc65j5kX8AjC",
    object: "chat.completion.chunk",
    created: 1686901302,
    model: "gpt-3.5-turbo-0301",
    choices: [
      {
        delta: { content: "Hello" },
        index: 0,
        finish_reason: null,
      },
    ],
  },
  {
    id: "chatcmpl-7RyNSW2BXkOQQh7NlBc65j5kX8AjC",
    object: "chat.completion.chunk",
    created: 1686901302,
    model: "gpt-3.5-turbo-0301",
    choices: [{ delta: { content: "," }, index: 0, finish_reason: null }],
  },
  {
    id: "chatcmpl-7RyNSW2BXkOQQh7NlBc65j5kX8AjC",
    object: "chat.completion.chunk",
    created: 1686901302,
    model: "gpt-3.5-turbo-0301",
    choices: [
      {
        delta: { content: " world" },
        index: 0,
        finish_reason: null,
      },
    ],
  },
  {
    id: "chatcmpl-7RyNSW2BXkOQQh7NlBc65j5kX8AjC",
    object: "chat.completion.chunk",
    created: 1686901302,
    model: "gpt-3.5-turbo-0301",
    choices: [{ delta: { content: "." }, index: 0, finish_reason: null }],
  },
  {
    id: "chatcmpl-7RyNSW2BXkOQQh7NlBc65j5kX8AjC",
    object: "chat.completion.chunk",
    created: 1686901302,
    model: "gpt-3.5-turbo-0301",
    choices: [{ delta: {}, index: 0, finish_reason: "stop" }],
  },
];

export const API_TEST_URL = "/api/chat";
export const OPENAI_TEST_URL = "https://api.openai.com/v1/chat/completions";

export function createMockServer() {
  return setupServer(
    // Handler for our API endpoint
    http.post(API_TEST_URL, async ({ request }) => {
      // @ts-ignore
      const { messages } = await request.json();

      // Simulate the call to OpenAI
      const openAIResponse = await fetch(OPENAI_TEST_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages }),
      });

      const stream = OpenAIStream(openAIResponse);
      return new StreamingTextResponse(stream);
    }),

    // Handler for the OpenAI API
    http.post(OPENAI_TEST_URL, () => {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          for (const chunk of openaiChatCompletionChunks) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
            await new Promise((resolve) => setTimeout(resolve, 10)); // Simulate delay
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        },
      });

      return new HttpResponse(stream, {
        headers: {
          "Content-Type": "text/event-stream",
        },
      });
    }),
  );
}
