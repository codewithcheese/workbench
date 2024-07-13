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
      api: "/api/chat",
      initialMessages: [],
    });
  });

  it("should append input", async () => {
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

  it("should reload the last assistant message", async () => {
    // Initialize ChatService with some existing messages
    chatService = new ChatService({
      api: "/api/chat",
      initialMessages: [
        { role: "user", content: "Hello", id: "1" },
        { role: "assistant", content: "Hi there!", id: "2" },
      ],
    });

    // Test reloading the last AI response
    await chatService.reload();
    await vi.waitUntil(() => chatService.isLoading === false, { timeout: 1000 });

    expect(chatService.messages[0].content).toBe("Hello");
    expect(chatService.messages[1].content).toBe("Hello, world.");
    expect(chatService.error).toBeUndefined();

    // Test reloading after a new user message
    chatService.input = "New user message";
    await chatService.handleSubmit();
    await chatService.reload();
    await vi.waitUntil(() => chatService.isLoading === false, { timeout: 1000 });

    expect(chatService.messages[3].content).toBe("Hello, world.");
    expect(chatService.error).toBeUndefined();
  });

  it("should append attachments to the message", async () => {
    const message = "Hi there!";

    // Set the input
    chatService.input = message;
    chatService.attachments = [
      {
        type: "pasted",
        content: "This is a pasted attachment",
        attributes: {},
      },
    ];

    // Submit the message
    await chatService.handleSubmit();

    // Check if the message was added to the messages array
    expect(chatService.messages[0]).toEqual(
      expect.objectContaining({
        role: "user",
        content: message,
        attachments: [
          {
            type: "pasted",
            content: "This is a pasted attachment",
            attributes: {},
          },
        ],
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

  it("should handle multiple attachments of different types in chat request", async () => {
    chatService.input = "Message with multiple attachments";
    chatService.attachments = [
      { type: "pasted", content: "Pasted text content", attributes: {} },
      { type: "document", content: "Document content", attributes: { name: "example" } },
    ];
    await chatService.handleSubmit();

    const chatRequest = chatService.createChatRequest();
    expect(chatRequest.messages[0].content).toContain("<Pasted>");
    expect(chatRequest.messages[0].content).toContain('<Document name="example">');
    expect(chatRequest.messages[0].content).toContain("Message with multiple attachments");

    // Verify that the original message doesn't contain processed attachments
    expect(chatService.messages[0].content).toBe("Message with multiple attachments");
    expect(chatService.messages[0].attachments).toHaveLength(2);
  });

  it("should handle empty attachments gracefully in chat request", async () => {
    chatService.input = "Message with empty attachment";
    chatService.attachments = [{ type: "pasted", content: "", attributes: {} }];
    await chatService.handleSubmit();

    const chatRequest = chatService.createChatRequest();
    expect(chatRequest.messages[0].content).not.toContain("<Pasted>");
    expect(chatRequest.messages[0].content).toBe("Message with empty attachment");

    // Verify that the original message preserves the empty attachment
    expect(chatService.messages[0].content).toBe("Message with empty attachment");
    expect(chatService.messages[0].attachments).toHaveLength(1);
    expect(chatService.messages[0].attachments![0].content).toBe("");
  });

  it("should handle attachments with special characters in chat request", async () => {
    const specialContent = "Content with <tags> and \n newlines";
    chatService.input = "Message with special characters";
    chatService.attachments = [{ type: "pasted", content: specialContent, attributes: {} }];
    await chatService.handleSubmit();

    const chatRequest = chatService.createChatRequest();
    expect(chatRequest.messages[0].content).toContain("&lt;tags&gt;");
    expect(chatRequest.messages[0].content).toContain("\n newlines");

    // Verify that the original message preserves unescaped content
    expect(chatService.messages[0].content).toBe("Message with special characters");
    expect(chatService.messages[0].attachments![0].content).toBe(specialContent);
  });

  it("should preserve attachments when editing messages", async () => {
    chatService = new ChatService({
      api: "/api/chat",
      initialMessages: [
        {
          role: "user",
          content: "Original",
          id: "1",
          attachments: [{ type: "pasted", content: "Original attachment", attributes: {} }],
        },
      ],
      mode: { type: "edit", index: 0 },
    });
    chatService.input = "Edited message";
    await chatService.handleSubmit();

    const chatRequest = chatService.createChatRequest();
    expect(chatRequest.messages[0].content).toContain("Edited message");
    expect(chatRequest.messages[0].content).toContain("Original attachment");

    // Verify that the original message is updated but attachment is preserved
    expect(chatService.messages[0].content).toBe("Edited message");
    expect(chatService.messages[0].attachments![0].content).toBe("Original attachment");
  });

  it("should preserve attachments when reloading conversations", async () => {
    chatService = new ChatService({
      api: "/api/chat",
      initialMessages: [
        {
          role: "user",
          content: "Hello",
          id: "1",
          attachments: [
            { type: "document", content: "Attachment content", attributes: { name: "test" } },
          ],
        },
        { role: "assistant", content: "Hi there!", id: "2" },
      ],
    });
    await chatService.reload();

    const chatRequest = chatService.createChatRequest();
    expect(chatRequest.messages[0].content).toContain("Attachment content");
    expect(chatRequest.messages[0].content).toContain('name="test"');

    // Verify that the original message and attachment are preserved
    expect(chatService.messages[0].content).toBe("Hello");
    assert(chatService.messages[0].attachments![0].type === "document");
    expect(chatService.messages[0].attachments![0].attributes).toEqual({ name: "test" });
    expect(chatService.messages[0].attachments![0].content).toBe("Attachment content");
  });
});
