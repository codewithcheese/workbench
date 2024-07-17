import type {
  ChatRequest,
  ChatRequestOptions,
  CreateMessage,
  FetchFunction,
  FunctionCallHandler,
  IdGenerator,
  JSONValue,
  Message as AIMessage,
  ToolCallHandler,
} from "@ai-sdk/ui-utils";
import { callChatApi, processChatStream } from "@ai-sdk/ui-utils";
import { nanoid } from "nanoid";
import { toTitleCase } from "$lib/string";
import { untrack } from "svelte";

// todo remove tool and function calling until the library is stable and we need it

export type MessageAttachment = {
  id: string;
  type: string;
  name: string;
  content: string;
  attributes: {};
};
export type ChatMessage = AIMessage & {
  attachments: MessageAttachment[];
};

export type { CreateMessage };

type Mode = { type: "edit"; index: number } | { type: "append" };

interface ToolCall$1<NAME extends string, ARGS> {
  toolCallId: string;
  toolName: NAME;
  args: ARGS;
}

export type ChatOptions = {
  /**
   * A unique identifier for the chat. Changes will be cached to local storage using this id.
   */
  id: string;
  /**
   * The version of the chat. Changes will be cached to local storage using this version.
   */
  version: number;
  /**
   * The API endpoint that accepts a `{ messages: Message[] }` object and returns
   * a stream of tokens of the AI chat response. Defaults to `/api/chat`.
   */
  api?: string;
  /**
   * Initial messages of the chat. Useful to load an existing chat history.
   */
  initialMessages?: ChatMessage[];
  /**
   * Initial input of the chat.
   */
  initialInput?: string;
  /**
   * Mode of the chat. Can be "edit" or "append". If "edit" then index is required.
   */
  mode?: Mode;
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
   * Callback function to be called when the chat starts loading.
   */
  onLoading?: () => void;
  /**
   * Callback function to be called when the API response is received.
   */
  onResponse?: (response: Response) => void | Promise<void>;
  /**
   * Callback function to be called when the chat is finished streaming.
   */
  onFinish?: (message: ChatMessage) => void;
  /**
   * Callback function to be called when an error is encountered.
   */
  onError?: (error: Error) => void;
  /** Callback function to be called when a message is updated */
  onMessageUpdate?: (messages: ChatMessage[]) => void;
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
  mutate: (messages: ChatMessage[]) => void,
  mutateStreamData: (data: JSONValue[] | undefined) => void,
  existingData: JSONValue[] | undefined,
  extraMetadata: {
    credentials?: RequestCredentials;
    headers?: Record<string, string> | Headers;
    body?: any;
  },
  previousMessages: ChatMessage[],
  abortControllerRef: AbortController | null,
  generateId: IdGenerator,
  streamMode: "stream-data" | "text" | undefined,
  onFinish: ((message: ChatMessage) => void) | undefined,
  onResponse: ((response: Response) => void | Promise<void>) | undefined,
  sendExtraMessageFields: boolean | undefined,
  fetch: FetchFunction | undefined,
) => {
  // Do an optimistic update to the chat state to show the updated messages
  // immediately.
  // mutate(chatRequest.messages);

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
      mutate([...previousMessages, ...merged.map((m) => ({ ...m, attachments: [] }))]);
      mutateStreamData([...(existingData || []), ...(data || [])]);
    },
    onFinish: (message) => onFinish && onFinish({ ...message, attachments: [] }),
    generateId,
    onToolCall: undefined, // not implemented yet
    fetch,
  });
};

export class ChatService {
  messages: ChatMessage[] = $state([]);
  error: undefined | Error = $state(undefined);
  input: string = $state("");
  attachments: MessageAttachment[] = [];
  isLoading: boolean | undefined = $state(undefined);
  data: JSONValue[] | undefined = $state(undefined);
  metadata?: Object;
  hasChanges: boolean = $state(false);

  private id: string;
  private version: number;
  private api: string;
  private mode: { type: "edit"; index: number } | { type: "append" };
  private generateId: IdGenerator;
  private abortController: AbortController | null;
  private sendExtraMessageFields: boolean | undefined;
  private experimental_onFunctionCall: FunctionCallHandler | undefined;
  private experimental_onToolCall: ToolCallHandler | undefined;
  private streamMode: "stream-data" | "text" | undefined;
  private onLoading: (() => void) | undefined;
  private onResponse: ((response: Response) => void | Promise<void>) | undefined;
  private onFinish: ((message: ChatMessage) => void) | undefined;
  private onError: ((error: Error) => void) | undefined;
  private onMessageUpdate: ((messages: ChatMessage[]) => void) | undefined;
  private credentials: RequestCredentials | undefined;
  private headers: Record<string, string> | Headers | undefined;
  private fetch: FetchFunction | undefined;

  // initial snapshot of messages before any changes
  private initialSate: string | undefined;

  constructor({
    id,
    version,
    api = "/api/chat",
    initialMessages = [],
    initialInput = "",
    mode = { type: "append" },
    sendExtraMessageFields,
    experimental_onFunctionCall,
    experimental_onToolCall,
    streamMode,
    onLoading,
    onResponse,
    onFinish,
    onError,
    onMessageUpdate,
    credentials,
    headers,
    generateId = () => nanoid(10),
    fetch,
  }: ChatOptions) {
    // assign options
    this.id = id;
    this.version = version;
    this.api = api;
    this.mode = mode;
    this.sendExtraMessageFields = sendExtraMessageFields;
    this.experimental_onFunctionCall = experimental_onFunctionCall;
    this.experimental_onToolCall = experimental_onToolCall;
    this.streamMode = streamMode;
    this.onLoading = onLoading;
    this.onResponse = onResponse;
    this.onFinish = onFinish;
    this.onError = onError;
    this.onMessageUpdate = onMessageUpdate;
    this.credentials = credentials;
    this.headers = headers;
    this.messages = initialMessages || [];
    this.data = [];
    this.metadata = undefined;
    this.isLoading = false;
    this.error = undefined;
    this.abortController = new AbortController();
    this.generateId = generateId;
    this.fetch = fetch;
    console.log("mode", mode);
    if (mode.type === "edit" && !initialMessages[mode.index]) {
      throw new Error(`Message to edit at index ${mode.index} not found`);
    }
    this.input = mode.type === "edit" ? initialMessages[mode.index].content : initialInput;
    $effect(() => {
      const currentState = JSON.stringify(this.messages);
      // on startup, check cache for changes
      if (!this.initialSate) {
        this.initialSate = currentState;
        const cachedState = localStorage.getItem(this.cacheKey);
        if (cachedState) {
          // if the last user message is empty, remove it
          const messages = JSON.parse(cachedState);
          const lastMessage = messages[messages.length - 1];
          if (lastMessage.role === "user" && lastMessage.content.trim() === "") {
            messages.pop();
          }
          this.messages = messages;
          this.hasChanges = true;
        }
        return;
      }
      untrack(() => {
        this.hasChanges = this.initialSate !== currentState;
        if (this.hasChanges) {
          // cache changes to local storage
          localStorage.setItem(this.cacheKey, JSON.stringify(this.messages));
        }
      });
    });
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
    message: ChatMessage | CreateMessage,
    requestOptions: ChatRequestOptions = {},
  ): Promise<string | null | undefined> {
    if (!message.id) {
      message.id = this.generateId();
    }
    this.messages.push(message as ChatMessage);

    return this.triggerRequest(this.createChatRequest(requestOptions));
  }

  revise(requestBody: Record<string, any>) {
    if (this.messages[this.messages.length - 1].role === "assistant") {
      this.messages.splice(-1);
    }
    console.log("revise", this.messages);
    return this.triggerRequest(this.createChatRequest({ options: { body: requestBody } }));
  }

  /**
   * Reload the last AI chat response for the given chat history. If the last
   * message isn't from the assistant, it will request the API to generate a
   * new response.
   */
  async reload(requestOptions: ChatRequestOptions = {}): Promise<string | null | undefined> {
    // remove messages after edit
    if (this.messages[this.messages.length - 1].role === "assistant") {
      this.messages.splice(this.messages.length - 1);
    }
    return this.triggerRequest(this.createChatRequest(requestOptions));
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
  setMessages(key: string, messages: ChatMessage[]): void {
    this.messages = messages;
    if (this.onMessageUpdate) {
      this.onMessageUpdate(messages);
    }
  }

  createChatRequest({
    options,
    functions,
    function_call,
    tools,
    tool_choice,
    data,
  }: ChatRequestOptions = {}) {
    // inline attachments into message content surrounded by tags
    const messages = this.messages.map((message) => {
      let content = message.content;
      if (message.attachments) {
        const attachmentContent = message.attachments
          .filter((attachment) => attachment.content.trim() !== "") // Exclude empty attachments
          .map((attachment) => {
            const escapedContent = attachment.content.replace(/</g, "&lt;").replace(/>/g, "&gt;");
            const attributes = Object.entries(attachment.attributes)
              .map(([key, value]) => `${key}="${value}"`)
              .join(" ");
            return `<${toTitleCase(attachment.type)}${attributes ? " " : ""}${attributes}>\n${escapedContent}\n</${toTitleCase(attachment.type)}>`;
          })
          .join("\n\n");
        if (attachmentContent.length > 0) {
          content = `${attachmentContent}\n\n${content}`;
        }
      }
      return { ...message, content };
    });
    return {
      messages,
      options,
      data,
      ...(functions !== undefined && { functions }),
      ...(function_call !== undefined && { function_call }),
      ...(tools !== undefined && { tools }),
      ...(tool_choice !== undefined && { tool_choice }),
    };
  }

  submit(requestBody: Record<string, any>) {
    if (this.mode.type === "edit") {
      return this.revise({ options: { body: requestBody } });
    } else {
      const inputContent = this.input;
      const inputAttachments = this.attachments;
      if (!inputContent) return;
      this.input = "";
      return this.append(
        {
          content: inputContent,
          role: "user",
          attachments: inputAttachments,
        },
        { options: { body: requestBody } },
      );
    }
  }

  resetChanges() {
    localStorage.removeItem(this.cacheKey);
    this.initialSate = JSON.stringify(this.messages);
    this.hasChanges = false;
  }

  get cacheKey() {
    return `chat-${this.id}-v${this.version}`;
  }

  private async triggerRequest(chatRequest: ChatRequest): Promise<string | null | undefined> {
    try {
      this.error = undefined;
      this.isLoading = true;

      // Call the onLoading handler if it is defined
      if (this.onLoading) {
        this.onLoading();
      }

      this.abortController = new AbortController();

      const extraMetadata = {
        credentials: this.credentials,
        headers: this.headers,
      };

      await processChatStream({
        getStreamedResponse: () =>
          getStreamedResponse(
            this.api || "/api/chat",
            chatRequest,
            (messages: ChatMessage[]) => this.setMessages(this.key, messages),
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
