import {
  afterAll,
  afterEach,
  assert,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
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
      id: "test-chat",
      version: 1,
      api: "/api/chat",
      initialMessages: [],
    });
  });

  it("should handle errors correctly", async () => {
    // Use MSW to mock a server error for this specific test
    mockServer.use(
      http.post("/api/chat", () => {
        return HttpResponse.json({ error: "API Error" }, { status: 500 });
      }),
    );

    await chatService.submit();

    // Wait for the error to be set
    await vi.waitUntil(() => chatService.error !== undefined, { timeout: 1000 });

    expect(chatService.error).toBeInstanceOf(Error);
    expect(chatService.isLoading).toBe(false);
  });

  it("should abort ongoing requests when stop is called", async () => {
    chatService.messages.push({
      id: "test-message",
      role: "user",
      content: "Long running request",
      attachments: [],
    });
    const submitPromise = chatService.submit();
    expect(chatService.messages.length).toBe(1);

    // Wait for the loading state to be true
    await vi.waitUntil(() => chatService.isLoading === true, { timeout: 1000 });

    chatService.stop();

    await submitPromise;

    expect(chatService.isLoading).toBe(false);
    expect(chatService.messages.length).toBe(1); // Only the user message should be present
  });

  it("should handle multiple attachments of different types in chat request", async () => {
    chatService.messages.push({
      id: "test-message",
      role: "user",
      content: "Message with multiple attachments",
      attachments: [
        {
          id: "test-attachment",
          name: "Pasted",
          type: "pasted",
          content: "Pasted text content",
          attributes: {},
        },
        {
          id: "test-attachment2",
          name: "Document",
          type: "document",
          content: "Document content",
          attributes: { name: "example" },
        },
      ],
    });
    await chatService.submit();

    const chatRequest = chatService.createChatRequest();
    expect(chatRequest.messages[0].content).toContain("<Pasted>");
    expect(chatRequest.messages[0].content).toContain('<Document name="example">');
    expect(chatRequest.messages[0].content).toContain("Message with multiple attachments");

    // Verify that the original message doesn't contain processed attachments
    expect(chatService.messages[0].content).toBe("Message with multiple attachments");
    expect(chatService.messages[0].attachments).toHaveLength(2);
  });

  it("should handle empty attachments gracefully in chat request", async () => {
    chatService.messages.push({
      id: "test-message",
      role: "user",
      content: "Message with empty attachment",
      attachments: [
        { id: "test-attachment", type: "pasted", content: "", attributes: {}, name: "Pasted" },
      ],
    });
    await chatService.submit();

    const chatRequest = chatService.createChatRequest();
    expect(chatRequest.messages[0].content).not.toContain("<Pasted>");
    expect(chatRequest.messages[0].content).toBe("Message with empty attachment");

    // Verify that the original message preserves the empty attachment
    expect(chatService.messages[0].content).toBe("Message with empty attachment");
    expect(chatService.messages[0].attachments).toHaveLength(1);
    expect(chatService.messages[0].attachments![0].content).toBe("");
  });

  it("should handle attachments with special characters in chat request", async () => {
    chatService.messages.push({
      id: "test-message",
      role: "user",
      content: "Message with special characters",
      attachments: [
        {
          id: "test-attachment",
          type: "pasted",
          content: "Content with <tags> and \n newlines",
          attributes: {},
          name: "Pasted",
        },
      ],
    });
    await chatService.submit();

    const chatRequest = chatService.createChatRequest();
    expect(chatRequest.messages[0].content).toContain("&lt;tags&gt;");
    expect(chatRequest.messages[0].content).toContain("\n newlines");
  });
});
