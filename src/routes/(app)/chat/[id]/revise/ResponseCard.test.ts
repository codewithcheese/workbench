import { fireEvent, render, screen, waitFor } from "@testing-library/svelte";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ResponseCard from "./ResponseCard.svelte";
import { useDb } from "@/database/client";
import { useChat } from "$lib/ai/use-chat.svelte";

// Mock the dependencies
vi.mock("@/database/client", () => ({
  useDb: vi.fn(),
}));

vi.mock("$lib/use-chat.svelte", () => ({
  useChat: vi.fn(),
}));

vi.mock("svelte-french-toast", () => ({
  toast: {
    error: vi.fn(),
  },
}));

vi.mock("../$data", () => ({
  updateResponsePrompt: vi.fn(),
  // Include other exports from $data if necessary
  removeResponse: vi.fn(),
  updateMessages: vi.fn(),
}));

describe.skip("ResponseCard", () => {
  const mockResponse = {
    id: "1",
    model: { name: "TestModel" },
    error: null,
  };

  const mockInitialMessages = [
    { role: "user", content: "Hello" },
    { role: "assistant", content: "**Hi there!**" },
  ];

  const mockService = {
    providerId: "test-provider",
    baseURL: "https://api.test.com",
    apiKey: "test-api-key",
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock useChat
    vi.mocked(useChat).mockReturnValue({
      // @ts-expect-error messages type mismatch
      messages: mockInitialMessages,
      isLoading: false,
      reload: vi.fn(),
      stop: vi.fn(),
    });

    // Mock useDb
    vi.mocked(useDb).mockReturnValue({
      query: {
        // @ts-expect-error
        modelTable: {
          findFirst: vi.fn().mockResolvedValue({ id: "1", name: "TestModel" }),
        },
      },
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue({}),
        }),
      }),
    });
  });

  it("renders the component with initial messages", () => {
    render(ResponseCard, {
      // @ts-expect-error partial mock
      response: mockResponse,
      // @ts-expect-error partial mock
      initialMessages: mockInitialMessages,
      // @ts-expect-error partial mock
      service: mockService,
    });

    expect(screen.getByText("TestModel")).toBeTruthy();
    expect(screen.getByText("Hi there!")).toBeTruthy();
  });

  it("switches between markdown and text format", async () => {
    render(ResponseCard, {
      // @ts-expect-error partial mock
      response: mockResponse,
      // @ts-expect-error partial mock
      initialMessages: mockInitialMessages,
      // @ts-expect-error partial mock
      service: mockService,
    });

    const markdownBadge = screen.getByText("Markdown");
    const textBadge = screen.getByText("Text");

    await fireEvent.click(textBadge);
    expect(screen.getByText("**Hi there!**")).toBeTruthy();

    await fireEvent.click(markdownBadge);
    // You might need to adjust this expectation based on how your MessageMarkdown component renders content
    expect(screen.getByText("Hi there!")).toBeTruthy();
  });

  it.skip("handles refresh action", async () => {
    render(ResponseCard, {
      // @ts-expect-error partial mock
      response: mockResponse,
      // @ts-expect-error partial mock
      initialMessages: mockInitialMessages,
      // @ts-expect-error partial mock
      service: mockService,
    });

    // Use the aria-label to find the refresh button
    const refreshButton = screen.getByLabelText("refresh");
    await fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(useDb().update).toHaveBeenCalled();
      expect(useChat().reload).toHaveBeenCalled();
    });
  });

  it("displays error message when present", () => {
    const errorResponse = { ...mockResponse, error: "Test error message" };
    render(ResponseCard, {
      // @ts-expect-error partial mock
      response: errorResponse,
      // @ts-expect-error partial mock
      initialMessages: mockInitialMessages,
      // @ts-expect-error partial mock
      service: mockService,
    });

    expect(screen.getByText("Test error message")).toBeTruthy();
  });
});
