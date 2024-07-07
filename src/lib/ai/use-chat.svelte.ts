import type {
  ChatRequest,
  ChatRequestOptions,
  CreateMessage,
  FetchFunction,
  FunctionCallHandler,
  IdGenerator,
  JSONValue,
  Message,
  ToolCallHandler,
  UseChatOptions,
} from "@ai-sdk/ui-utils";
import { callChatApi, generateId as generateIdFunc, processChatStream } from "@ai-sdk/ui-utils";

export type { CreateMessage, Message, UseChatOptions };

/**
 Typed tool call that is returned by generateText and streamText.
 It contains the tool call ID, the tool name, and the tool arguments.
 */
interface ToolCall$1<NAME extends string, ARGS> {
  /**
   ID of the tool call. This ID is used to match the tool call with the tool result.
   */
  toolCallId: string;
  /**
   Name of the tool that is being called.
   */
  toolName: NAME;
  /**
   Arguments of the tool call. This is a JSON-serializable object that matches the tool's input schema.
   */
  args: ARGS;
}

type UseChatOptions = {
  /**
   * The API endpoint that accepts a `{ messages: Message[] }` object and returns
   * a stream of tokens of the AI chat response. Defaults to `/api/chat`.
   */
  api?: string;
  /**
   * A unique identifier for the chat. If not provided, a random one will be
   * generated. When provided, the `useChat` hook with the same `id` will
   * have shared states across components.
   */
  id?: string;
  /**
   * Initial messages of the chat. Useful to load an existing chat history.
   */
  initialMessages?: Message[];
  /**
   * Initial input of the chat.
   */
  initialInput?: string;
  /**
   * Edit index, is set then input will be set to the content of the message at the given index
   */
  editing?: { index: number };
  /**
   * @deprecated Use AI SDK 3.1 `streamText` and `onToolCall` instead.
   *
   * Callback function to be called when a function call is received.
   * If the function returns a `ChatRequest` object, the request will be sent
   * automatically to the API and will be used to update the chat.
   */
  experimental_onFunctionCall?: FunctionCallHandler;
  /**
   * @deprecated Use AI SDK 3.1 `streamText` and `onToolCall` instead.
   *
   * Callback function to be called when a tool call is received.
   * If the function returns a `ChatRequest` object, the request will be sent
   * automatically to the API and will be used to update the chat.
   */
  experimental_onToolCall?: ToolCallHandler;
  /**
   Optional callback function that is invoked when a tool call is received.
   Intended for automatic client-side tool execution.

   You can optionally return a result for the tool call,
   either synchronously or asynchronously.
   */
  onToolCall?: ({
    toolCall,
  }: {
    toolCall: ToolCall$1<string, unknown>;
  }) => void | Promise<unknown> | unknown;
  /**
   * Callback function to be called when the API response is received.
   */
  onResponse?: (response: Response) => void | Promise<void>;
  /**
   * Callback function to be called when the chat is finished streaming.
   */
  onFinish?: (message: Message) => void;
  /**
   * Callback function to be called when an error is encountered.
   */
  onError?: (error: Error) => void;
  /**
   * A way to provide a function that is going to be used for ids for messages.
   * If not provided nanoid is used by default.
   */
  generateId?: IdGenerator;
  /**
   * The credentials mode to be used for the fetch request.
   * Possible values are: 'omit', 'same-origin', 'include'.
   * Defaults to 'same-origin'.
   */
  credentials?: RequestCredentials;
  /**
   * HTTP headers to be sent with the API request.
   */
  headers?: Record<string, string> | Headers;
  /**
   * Extra body object to be sent with the API request.
   * @example
   * Send a `sessionId` to the API along with the messages.
   * ```js
   * useChat({
   *   body: {
   *     sessionId: '123',
   *   }
   * })
   * ```
   */
  body?: object;
  /**
   * Whether to send extra message fields such as `message.id` and `message.createdAt` to the API.
   * Defaults to `false`. When set to `true`, the API endpoint might need to
   * handle the extra fields before forwarding the request to the AI service.
   */
  sendExtraMessageFields?: boolean;
  /** Stream mode (default to "stream-data") */
  streamMode?: "stream-data" | "text";
  /**
   Custom fetch implementation. You can use it as a middleware to intercept requests,
   or to provide a custom fetch implementation for e.g. testing.
   */
  fetch?: FetchFunction;
};

export type UseChatHelpers = {
  /** Current messages in the chat */
  // messages: Readable<Message[]>;
  messages: Message[];
  /** The error object of the API request */
  // error: Readable<undefined | Error>;
  error: undefined | Error;
  /**
   * Append a user message to the chat list. This triggers the API call to fetch
   * the assistant's response.
   * @param message The message to append
   * @param chatRequestOptions Additional options to pass to the API call
   */
  append: (
    message: Message | CreateMessage,
    chatRequestOptions?: ChatRequestOptions,
  ) => Promise<string | null | undefined>;
  /**
   * Reload the last AI chat response for the given chat history. If the last
   * message isn't from the assistant, it will request the API to generate a
   * new response.
   */
  reload: (chatRequestOptions?: ChatRequestOptions) => Promise<string | null | undefined>;
  /**
   * Abort the current request immediately, keep the generated tokens if any.
   */
  stop: () => void;
  /**
   * Update the `messages` state locally. This is useful when you want to
   * edit the messages on the client, and then trigger the `reload` method
   * manually to regenerate the AI response.
   */
  setMessages: (messages: Message[]) => void;
  /** The current value of the input */
  input: string;

  /** Form submission handler to automatically reset input and append a user message  */
  handleSubmit: (
    event?: { preventDefault?: () => void },
    chatRequestOptions?: ChatRequestOptions,
  ) => void;
  metadata?: Object;
  /** Whether the API request is in progress */
  isLoading: boolean | undefined;

  /** Additional data added on the server via StreamData */
  data: JSONValue[] | undefined;
};

const getStreamedResponse = async (
  api: string,
  chatRequest: ChatRequest,
  mutate: (messages: Message[]) => void,
  mutateStreamData: (data: JSONValue[] | undefined) => void,
  existingData: JSONValue[] | undefined,
  extraMetadata: {
    credentials?: RequestCredentials;
    headers?: Record<string, string> | Headers;
    body?: any;
  },
  previousMessages: Message[],
  abortControllerRef: AbortController | null,
  generateId: IdGenerator,
  streamMode: "stream-data" | "text" | undefined,
  onFinish: ((message: Message) => void) | undefined,
  onResponse: ((response: Response) => void | Promise<void>) | undefined,
  sendExtraMessageFields: boolean | undefined,
  fetch: FetchFunction | undefined,
) => {
  // Do an optimistic update to the chat state to show the updated messages
  // immediately.
  mutate(chatRequest.messages);

  const constructedMessagesPayload = sendExtraMessageFields
    ? chatRequest.messages
    : chatRequest.messages.map(
        ({ role, content, name, data, annotations, function_call, tool_calls, tool_call_id }) => ({
          role,
          content,
          ...(name !== undefined && { name }),
          ...(data !== undefined && { data }),
          ...(annotations !== undefined && { annotations }),
          // outdated function/tool call handling (TODO deprecate):
          tool_call_id,
          ...(function_call !== undefined && { function_call }),
          ...(tool_calls !== undefined && { tool_calls }),
        }),
      );

  return await callChatApi({
    api,
    body: {
      messages: constructedMessagesPayload,
      data: chatRequest.data,
      ...extraMetadata.body,
      ...chatRequest.options?.body,
      ...(chatRequest.functions !== undefined && {
        functions: chatRequest.functions,
      }),
      ...(chatRequest.function_call !== undefined && {
        function_call: chatRequest.function_call,
      }),
      ...(chatRequest.tools !== undefined && {
        tools: chatRequest.tools,
      }),
      ...(chatRequest.tool_choice !== undefined && {
        tool_choice: chatRequest.tool_choice,
      }),
    },
    streamMode,
    credentials: extraMetadata.credentials,
    headers: {
      ...extraMetadata.headers,
      ...chatRequest.options?.headers,
    },
    abortController: () => abortControllerRef,
    restoreMessagesOnFailure() {
      mutate(previousMessages);
    },
    onResponse,
    onUpdate(merged, data) {
      mutate([...chatRequest.messages, ...merged]);
      mutateStreamData([...(existingData || []), ...(data || [])]);
    },
    onFinish,
    generateId,
    onToolCall: undefined, // not implemented yet
    fetch,
  });
};

let uniqueId = 0;

const store: Record<string, Message[] | undefined> = {};

export function useChat({
  api = "/api/chat",
  id,
  initialMessages = [],
  initialInput = "",
  editing,
  sendExtraMessageFields,
  experimental_onFunctionCall,
  experimental_onToolCall,
  streamMode,
  onResponse,
  onFinish,
  onError,
  credentials,
  headers,
  body,
  generateId = generateIdFunc,
  fetch,
}: UseChatOptions = {}): UseChatHelpers {
  // Generate a unique id for the chat if not provided.
  const chatId = id || `chat-${uniqueId++}`;

  const key = `${api}|${chatId}`;

  const state = $state<UseChatHelpers>({
    messages: initialMessages,
    input: editing ? initialMessages[editing.index].content : initialInput,
    data: [],
    metadata: undefined,
    isLoading: false,
    error: undefined,
    reload: async () => null,
    stop: () => {},
    setMessages: () => {},
    append: async () => null,
    handleSubmit: () => {},
  });

  const mutate = (data: Message[]) => {
    store[key] = data;
    state.messages = data;
    return data;
  };

  // Abort controller to cancel the current API call.
  let abortController: AbortController | null = null;

  const extraMetadata = {
    credentials,
    headers,
    body,
  };

  // Actual mutation hook to send messages to the API endpoint and update the
  // chat state.
  async function triggerRequest(chatRequest: ChatRequest) {
    try {
      state.error = undefined;
      state.isLoading = true;
      abortController = new AbortController();

      await processChatStream({
        getStreamedResponse: () =>
          getStreamedResponse(
            api,
            chatRequest,
            mutate,
            (data) => {
              state.data = data;
            },
            state.data,
            extraMetadata,
            state.messages,
            abortController,
            generateId,
            streamMode,
            onFinish,
            onResponse,
            sendExtraMessageFields,
            fetch,
          ),
        experimental_onFunctionCall,
        experimental_onToolCall,
        updateChatRequest: (chatRequestParam) => {
          chatRequest = chatRequestParam;
        },
        getCurrentMessages: () => state.messages,
      });

      abortController = null;

      return null;
    } catch (err) {
      // Ignore abort errors as they are expected.
      if ((err as any).name === "AbortError") {
        abortController = null;
        return null;
      }

      if (onError && err instanceof Error) {
        onError(err);
      }

      state.error = err as Error;
    } finally {
      state.isLoading = false;
    }
  }

  state.append = async (
    message: Message | CreateMessage,
    { options, functions, function_call, tools, tool_choice, data }: ChatRequestOptions = {},
  ) => {
    if (!message.id) {
      message.id = generateId();
    }

    const chatRequest: ChatRequest = {
      messages: state.messages.concat(message as Message),
      options,
      data,
      ...(functions !== undefined && { functions }),
      ...(function_call !== undefined && { function_call }),
      ...(tools !== undefined && { tools }),
      ...(tool_choice !== undefined && { tool_choice }),
    };
    return triggerRequest(chatRequest);
  };

  state.reload = async ({
    options,
    functions,
    function_call,
    tools,
    tool_choice,
  }: ChatRequestOptions = {}) => {
    const messagesSnapshot = state.messages;
    if (messagesSnapshot.length === 0) return null;

    // Remove last assistant message and retry last user message.
    const lastMessage = messagesSnapshot.at(-1);
    if (lastMessage?.role === "assistant") {
      const chatRequest: ChatRequest = {
        messages: messagesSnapshot.slice(0, -1),
        options,
        ...(functions !== undefined && { functions }),
        ...(function_call !== undefined && { function_call }),
        ...(tools !== undefined && { tools }),
        ...(tool_choice !== undefined && { tool_choice }),
      };

      return triggerRequest(chatRequest);
    }
    const chatRequest: ChatRequest = {
      messages: messagesSnapshot,
      options,
      ...(functions !== undefined && { functions }),
      ...(function_call !== undefined && { function_call }),
      ...(tools !== undefined && { tools }),
      ...(tool_choice !== undefined && { tool_choice }),
    };

    return triggerRequest(chatRequest);
  };

  state.stop = () => {
    if (abortController) {
      abortController.abort();
      abortController = null;
    }
  };

  state.setMessages = (messages: Message[]) => {
    mutate(messages);
  };

  state.handleSubmit = (
    event?: { preventDefault?: () => void },
    options: ChatRequestOptions = {},
  ) => {
    event?.preventDefault?.();
    const inputValue = state.input;
    if (!inputValue) return;

    state.append(
      {
        content: inputValue,
        role: "user",
        createdAt: new Date(),
      },
      options,
    );
    state.input = "";
  };

  return state;
}
