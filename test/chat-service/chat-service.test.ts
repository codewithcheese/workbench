import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { ChatService } from "../../src/lib/chat-service.svelte";
import { createMockServer } from "./mock-server";
import { http, HttpResponse } from "msw";

describe("ChatService", () => {
  const mockServer = createMockServer();
  let chatService: ChatService;

  // Set up the mock server before all tests
  beforeAll(() => {
    mockServer.listen({ onUnhandledRequest: "error" });
  });

  // Reset handlers after each test
  afterEach(() => {
    mockServer.resetHandlers();
  });

  // Clean up after all tests are done
  afterAll(() => {
    mockServer.close();
  });

  beforeEach(() => {
    chatService = new ChatService({
      api: "/api/chat",
      initialMessages: [],
    });
  });

  it("should handle the complete request chain correctly", async () => {
    const message = "Hi there!";

    // Set the input
    chatService.input = message;

    // Submit the message
    await chatService.handleSubmit();

    // Check if the message was added to the messages array
    expect(chatService.messages[0]).toEqual(
      expect.objectContaining({
        role: "user",
        content: message,
      }),
    );

    // Wait for the response
    await vi.waitUntil(() => chatService.messages.length === 2, { timeout: 1000 });

    // Check if the assistant's response was added
    expect(chatService.messages[1]).toEqual(
      expect.objectContaining({
        role: "assistant",
        content: "Hello, world.",
      }),
    );

    // Verify that loading state is reset
    expect(chatService.isLoading).toBe(false);
  });

  it("should handle errors correctly", async () => {
    // Use MSW to mock a server error for this specific test
    mockServer.use(
      http.post("/api/chat", () => {
        return HttpResponse.json({ error: "API Error" }, { status: 500 });
      }),
    );

    chatService.input = "Trigger an error";

    await chatService.handleSubmit();

    // Wait for the error to be set
    await vi.waitUntil(() => chatService.error !== undefined, { timeout: 1000 });

    expect(chatService.error).toBeInstanceOf(Error);
    expect(chatService.isLoading).toBe(false);
  });

  it("should abort ongoing requests when stop is called", async () => {
    chatService.input = "Long running request";

    const submitPromise = chatService.handleSubmit();
    expect(chatService.messages.length).toBe(1);

    // Wait for the loading state to be true
    await vi.waitUntil(() => chatService.isLoading === true, { timeout: 1000 });

    chatService.stop();

    await submitPromise;

    expect(chatService.isLoading).toBe(false);
    expect(chatService.messages.length).toBe(1); // Only the user message should be present
  });

  it("should handle editing of previous messages", async () => {
    // Initialize ChatService in edit mode
    chatService = new ChatService({
      api: "/api/chat",
      initialMessages: [
        { role: "user", content: "Hello", id: "1" },
        { role: "assistant", content: "Hi there!", id: "2" },
      ],
      mode: { type: "edit", index: 0 },
    });

    // Set the new content for the edit
    chatService.input = "Hello, how are you?";

    // Trigger the edit
    chatService.handleSubmit();

    expect(chatService.messages).toHaveLength(1);

    // Verify that the message was updated
    expect(chatService.messages[0]).toEqual(
      expect.objectContaining({
        role: "user",
        content: "Hello, how are you?",
      }),
    );

    // Wait for the API call to complete
    await vi.waitUntil(() => chatService.isLoading === false, { timeout: 1000 });

    // Verify that the assistant message was updated
    expect(chatService.messages[1]).toEqual(
      expect.objectContaining({
        role: "assistant",
        content: "Hello, world.",
      }),
    );

    // Verify that the loading state is reset
    expect(chatService.isLoading).toBe(false);

    // Verify that there are no errors
    expect(chatService.error).toBeUndefined();

    // Verify that messages after the edit were removed
    expect(chatService.messages.length).toBe(2);
  });
});
