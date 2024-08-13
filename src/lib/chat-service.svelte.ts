import type {
  ChatRequest,
  ChatRequestOptions,
  CreateMessage,
  FetchFunction,
  FunctionCallHandler,
  IdGenerator,
  JSONValue,
  Message as AIMessage,
  Attachment as AIAttachment,
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
  attributes: Record<string, any>;
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
   * Callback function to be called when response should append to the current revision
   */
  onAppend?: () => void;
  /**
   * Callback function to be called when response should create a new revision
   */
  onRevision?: () => void;
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
  streamProtocol?: "data" | "text";
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
  streamProtocol: "data" | "text" | undefined,
  onFinish: ((message: ChatMessage) => void) | undefined,
  onResponse: ((response: Response) => void | Promise<void>) | undefined,
  sendExtraMessageFields: boolean | undefined,
  fetch: FetchFunction | undefined,
) => {
  const constructedMessagesPayload = sendExtraMessageFields
    ? chatRequest.messages
    : chatRequest.messages.map(
        ({
          role,
          content,
          experimental_attachments,
          name,
          data,
          annotations,
          function_call,
          tool_calls,
          tool_call_id,
        }) => ({
          role,
          content,
          ...(name !== undefined && { name }),
          ...(experimental_attachments !== undefined && { experimental_attachments }),
          ...(data !== undefined && { data }),
          ...(annotations !== undefined && { annotations }),
          // outdated function/tool call handling (TODO deprecate):
          tool_call_id,
          ...(function_call !== undefined && { function_call }),
          ...(tool_calls !== undefined && { tool_calls }),
        }),
      );

  console.log("chatRequest", chatRequest);
  console.log("constructedMessagesPayload", constructedMessagesPayload);

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
    streamProtocol,
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
  version: number;
  messages: ChatMessage[] = $state([]);
  error: undefined | Error = $state(undefined);
  isLoading: boolean = $state(false);
  data: JSONValue[] | undefined = $state(undefined);
  metadata?: Object;
  hasEdits: boolean = $state(false);

  private id: string;
  private api: string;
  private generateId: IdGenerator;
  private abortController: AbortController | null;
  private sendExtraMessageFields: boolean | undefined;
  private experimental_onFunctionCall: FunctionCallHandler | undefined;
  private experimental_onToolCall: ToolCallHandler | undefined;
  private streamProtocol: "data" | "text" | undefined;
  private onLoading: (() => void) | undefined;
  private onAppend: (() => void) | undefined;
  private onRevision: (() => void) | undefined;
  private onError: ((error: Error) => void) | undefined;
  private onMessageUpdate: ((messages: ChatMessage[]) => void) | undefined;
  private credentials: RequestCredentials | undefined;
  private headers: Record<string, string> | Headers | undefined;
  private fetch: FetchFunction | undefined;

  // initial snapshot of messages before any changes
  private initialState: string | undefined;
  private initialLength: number;

  constructor({
    id,
    version,
    api = "/api/chat",
    initialMessages = [],
    sendExtraMessageFields,
    experimental_onFunctionCall,
    experimental_onToolCall,
    streamProtocol,
    onLoading,
    onAppend,
    onRevision,
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
    this.sendExtraMessageFields = sendExtraMessageFields;
    this.experimental_onFunctionCall = experimental_onFunctionCall;
    this.experimental_onToolCall = experimental_onToolCall;
    this.streamProtocol = streamProtocol;
    this.onLoading = onLoading;
    this.onAppend = onAppend;
    this.onRevision = onRevision;
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
    this.initialLength = initialMessages.length;

    this.initialState = JSON.stringify(this.messages);
    this.tryLoadFromCache();

    $effect.root(() => {
      $effect(() => {
        const currentState = JSON.stringify(this.messages);
        untrack(() => {
          // has edits if initial messages have been modified
          this.hasEdits =
            JSON.stringify(this.messages.slice(0, this.initialLength)) !== this.initialState;
          if (currentState !== this.initialState) {
            // cache changes to local storage
            if (!this.isLoading) {
              console.log("caching changes");
              localStorage.setItem(this.cacheKey, JSON.stringify(this.messages));
            }
          } else {
            // if no edits, remove the cache
            localStorage.removeItem(this.cacheKey);
          }
        });
      });
    });
  }

  tryLoadFromCache() {
    const cachedState = localStorage.getItem(this.cacheKey);
    if (cachedState) {
      console.log("Applying cached state", this.cacheKey);
      // if the last user message is empty, remove it
      const messages = JSON.parse(cachedState);
      const lastMessage = messages[messages.length - 1];
      if (lastMessage && lastMessage.role === "user" && lastMessage.content.trim() === "") {
        messages.pop();
      }
      this.messages = messages;
    }
  }

  get key() {
    return `${this.api}|${this.id}`;
  }

  markAsSaved() {
    // clear cache
    localStorage.removeItem(this.cacheKey);
    // reset initial state
    this.initialLength = this.messages.length;
    this.initialState = JSON.stringify(this.messages);
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
      let experimental_attachments: AIAttachment[] | undefined = undefined;
      if (message.attachments) {
        const attachmentContent = message.attachments
          .filter(
            (attachment) =>
              !attachment.type.startsWith("image/") && attachment.content.trim() !== "",
          ) // Exclude empty attachments
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
        experimental_attachments = message.attachments
          .filter((attachment) => attachment.type.startsWith("image/"))
          .map((attachment) => ({
            name: attachment.name,
            contentType: attachment.type,
            url: attachment.content,
          }));
        console.log("experimental_attachments", experimental_attachments);
      }
      return { ...message, content, experimental_attachments };
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

  submit(requestOptions: ChatRequestOptions = {}) {
    return this.triggerRequest(this.createChatRequest(requestOptions));
  }

  handleOnFinish = () => {
    if (this.hasEdits) {
      if (this.onRevision) {
        this.onRevision();
      }
    } else {
      if (this.onAppend) {
        this.onAppend();
      }
    }
  };

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
            this.streamProtocol,
            this.handleOnFinish,
            () => {},
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
        this.handleOnFinish();
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
