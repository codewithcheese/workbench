import { type Message, useChat as useChatv4 } from "ai/svelte";

export function useChat({
  initialMessages,
  body,
}: {
  initialMessages: Message[];
  body: Record<string, unknown>;
}) {
  const { messages, reload, isLoading, stop, error } = useChatv4({
    initialMessages,
    body,
  });
  return {
    messages,
    reload,
    isLoading,
    stop,
    error,
  };
}
