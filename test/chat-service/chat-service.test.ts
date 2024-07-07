/* @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, waitFor } from "@testing-library/svelte";
import TestUseChatComponent from "./TestChatService.svelte";
import { createMockServer } from "./mock-server";

describe("ChatService in Svelte component", () => {
  const mockServer = createMockServer();

  beforeEach(() => {
    mockServer.listen();
  });

  afterEach(() => {
    mockServer.close();
    vi.restoreAllMocks();
  });

  it("should handle the complete request chain correctly", async () => {
    // @ts-expect-error render expects class component
    const { getByText, getByPlaceholderText, findByText } = render(TestUseChatComponent, {
      props: {},
    });

    // Type a message in the input
    const input = getByPlaceholderText("Type a message...");
    await fireEvent.input(input, { target: { value: "Hi there!" } });

    // Submit the form
    const submitButton = getByText("Send Message");
    await fireEvent.click(submitButton);

    // Wait for the loading state
    await findByText("Loading...");

    // Wait for the response to be rendered
    await waitFor(
      () => {
        expect(getByText("user: Hi there!")).toBeTruthy();
        expect(getByText("assistant: Hello, world.")).toBeTruthy();
      },
      { timeout: 500 },
    );
  });
});
