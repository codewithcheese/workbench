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
} from "@ai-sdk/ui-utils";
import { callChatApi, generateId as generateIdFunc, processChatStream } from "@ai-sdk/ui-utils";
import { nanoid } from "nanoid";

// todo remove tool and function calling until the library is stable and we need it

export type { CreateMessage };

interface ToolCall$1<NAME extends string, ARGS> {
  toolCallId: string;
  toolName: NAME;
  args: ARGS;
}

export type ChatOptions = {
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
  /** Callback function to be called when an input is submitted */
  onSubmit?: (message: Message) => void | Promise<void>;
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
  /** Callback function to be called when a message is updated */
  onMessageUpdate?: (messages: Message[]) => void;
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

export class ChatService {
  messages: Message[] = $state([]);
  error: undefined | Error = $state(undefined);
  input: string = $state("");
  isLoading: boolean | undefined = $state(undefined);
  data: JSONValue[] | undefined = $state(undefined);
  metadata?: Object;

  private id: string;
  private api: string;
  private editing: { index: number } | undefined;
  private generateId: IdGenerator;
  private abortController: AbortController | null;
  private sendExtraMessageFields: boolean | undefined;
  private experimental_onFunctionCall: FunctionCallHandler | undefined;
  private experimental_onToolCall: ToolCallHandler | undefined;
  private streamMode: "stream-data" | "text" | undefined;
  private onSubmit: ((message: Message) => void | Promise<void>) | undefined;
  private onResponse: ((response: Response) => void | Promise<void>) | undefined;
  private onFinish: ((message: Message) => void) | undefined;
  private onError: ((error: Error) => void) | undefined;
  private onMessageUpdate: ((messages: Message[]) => void) | undefined;
  private credentials: RequestCredentials | undefined;
  private headers: Record<string, string> | Headers | undefined;
  private body: object | undefined;
  private fetch: FetchFunction | undefined;

  constructor({
    api = "/api/chat",
    id,
    initialMessages = [],
    initialInput = "",
    editing,
    sendExtraMessageFields,
    experimental_onFunctionCall,
    experimental_onToolCall,
    streamMode,
    onSubmit,
    onResponse,
    onFinish,
    onError,
    onMessageUpdate,
    credentials,
    headers,
    body,
    generateId = () => nanoid(10),
    fetch,
  }: ChatOptions) {
    // assign options
    this.api = api;
    this.id = id || `chat-${uniqueId++}`;
    this.editing = editing;
    this.sendExtraMessageFields = sendExtraMessageFields;
    this.experimental_onFunctionCall = experimental_onFunctionCall;
    this.experimental_onToolCall = experimental_onToolCall;
    this.streamMode = streamMode;
    this.onSubmit = onSubmit;
    this.onResponse = onResponse;
    this.onFinish = onFinish;
    this.onError = onError;
    this.onMessageUpdate = onMessageUpdate;
    this.credentials = credentials;
    this.headers = headers;
    this.body = body;
    this.messages = initialMessages || [];
    this.data = [];
    this.metadata = undefined;
    this.isLoading = false;
    this.error = undefined;
    this.abortController = new AbortController();
    this.generateId = generateId;
    this.editing = editing;
    this.fetch = fetch;
    // if editing, set initial input to the content of the message at the given index
    console.log("editing", editing);
    if (editing && initialMessages) {
      this.input = initialMessages[editing.index].content;
      console.log("initial input", this.input);
    } else {
      this.input = initialInput || "";
    }
  }

  get key() {
    return `${this.api}|${this.id}`;
  }

  /**
   * Append a user message to the chat list. This triggers the API call to fetch
   * the assistant's response.
   * @param message The message to append
   * @param chatRequestOptions Additional options to pass to the API call
   */
  append(
    message: Message | CreateMessage,
    { options, functions, function_call, tools, tool_choice, data }: ChatRequestOptions = {},
  ): Promise<string | null | undefined> {
    if (!message.id) {
      message.id = this.generateId();
    }

    const chatRequest: ChatRequest = {
      messages: this.messages.concat(message as Message),
      options,
      data,
      ...(functions !== undefined && { functions }),
      ...(function_call !== undefined && { function_call }),
      ...(tools !== undefined && { tools }),
      ...(tool_choice !== undefined && { tool_choice }),
    };
    return this.triggerRequest(chatRequest);
  }

  edit(
    content: string,
    index: number,
    { options, functions, function_call, tools, tool_choice, data }: ChatRequestOptions = {},
  ) {
    console.log("edit", content, index, this.messages);
    let messagesSnapshot = structuredClone($state.snapshot(this.messages));
    messagesSnapshot[index].content = content;
    // remove messages after edit
    messagesSnapshot = messagesSnapshot.slice(0, index + 1);
    console.log("edit", messagesSnapshot);
    const chatRequest: ChatRequest = {
      messages: messagesSnapshot,
      options,
      data,
      ...(functions !== undefined && { functions }),
      ...(function_call !== undefined && { function_call }),
      ...(tools !== undefined && { tools }),
      ...(tool_choice !== undefined && { tool_choice }),
    };
    return this.triggerRequest(chatRequest);
  }

  /**
   * Reload the last AI chat response for the given chat history. If the last
   * message isn't from the assistant, it will request the API to generate a
   * new response.
   */
  async reload({
    options,
    functions,
    function_call,
    tools,
    tool_choice,
  }: ChatRequestOptions = {}): Promise<string | null | undefined> {
    let messagesSnapshot = structuredClone(this.messages);
    if (messagesSnapshot.length === 0) {
      return null;
    }

    // Remove last assistant message and retry last user message.
    const lastMessage = messagesSnapshot.at(-1);
    if (lastMessage?.role === "assistant") {
      messagesSnapshot = messagesSnapshot.slice(0, -1);
    }

    const chatRequest: ChatRequest = {
      messages: messagesSnapshot,
      options,
      ...(functions !== undefined && { functions }),
      ...(function_call !== undefined && { function_call }),
      ...(tools !== undefined && { tools }),
      ...(tool_choice !== undefined && { tool_choice }),
    };

    return this.triggerRequest(chatRequest);
  }

  /**
   * Abort the current request immediately, keep the generated tokens if any.
   */
  stop(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  /**
   * Update the `messages` state locally. This is useful when you want to
   * edit the messages on the client, and then trigger the `reload` method
   * manually to regenerate the AI response.
   */
  setMessages(key: string, messages: Message[]): void {
    console.log("setMessages", key, messages);
    store[key] = messages;
    this.messages = messages;
    if (this.onMessageUpdate) {
      this.onMessageUpdate(messages);
    }
  }

  /** Form submission handler to automatically reset input and append a user message  */
  handleSubmit(event?: { preventDefault?: () => void }, chatRequestOptions?: ChatRequestOptions) {
    try {
      event?.preventDefault?.();
      const inputValue = this.input;
      if (!inputValue) return;

      if (this.editing) {
        let message = this.messages[this.editing.index];
        message.content = inputValue;
        return this.edit(inputValue, this.editing.index, chatRequestOptions);
      } else {
        this.input = "";
        return this.append(
          {
            content: inputValue,
            role: "user",
          },
          chatRequestOptions,
        );
      }
    } catch (e) {
      console.error(e);
    }
  }

  private async triggerRequest(chatRequest: ChatRequest): Promise<string | null | undefined> {
    try {
      this.error = undefined;
      this.isLoading = true;
      this.abortController = new AbortController();

      const extraMetadata = {
        credentials: this.credentials,
        headers: this.headers,
        body: this.body,
      };

      await processChatStream({
        getStreamedResponse: () =>
          getStreamedResponse(
            this.api || "/api/chat",
            chatRequest,
            (messages: Message[]) => this.setMessages(this.key, messages),
            (data) => {
              this.data = data;
            },
            this.data,
            extraMetadata,
            this.messages,
            this.abortController,
            this.generateId,
            this.streamMode,
            this.onFinish,
            this.onResponse,
            this.sendExtraMessageFields,
            this.fetch,
          ),
        experimental_onFunctionCall: this.experimental_onFunctionCall,
        experimental_onToolCall: this.experimental_onToolCall,
        updateChatRequest: (chatRequestParam) => {
          chatRequest = chatRequestParam;
        },
        getCurrentMessages: () => this.messages,
      });
      this.abortController = null;
      return null;
    } catch (err) {
      // Ignore abort errors as they are expected.
      if ((err as any).name === "AbortError") {
        this.abortController = null;
        return null;
      }

      if (this.onError && err instanceof Error) {
        this.onError(err);
      }

      this.error = err as Error;
    } finally {
      this.isLoading = false;
    }
  }
}
