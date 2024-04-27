import { MemoizedReactMarkdown } from "@/components/markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { CodeBlock } from "@/components/ui/codeblock";
import { useChat } from "ai/react";
import { useEffect, useState } from "react";
import { store } from "@/app/store";
import { LoaderCircleIcon, RefreshCwIcon, XIcon } from "lucide-react";
import { ref, useSnapshot } from "valtio";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export function Response({ index }: { index: number }) {
  const response = useSnapshot(store.responses[index]);
  const selected = useSnapshot(store.selected);
  const [initialMessages] = useState(store.responses[index].messages);
  const { messages, reload, isLoading, stop, error } = useChat({
    initialMessages,
    body: selected,
  });

  function refresh() {
    if (selected.modelId && selected.serviceId) {
      console.log("Refreshing", selected);
      store.responses[index].modelId = selected.modelId;
      store.responses[index].serviceId = selected.serviceId;
    }
    reload();
  }

  useEffect(() => {
    // request response if last message not assistant and not error
    const lastMessageIsAssistant = messages.findLast(
      (m) => m.role === "assistant"
    );
    if (!lastMessageIsAssistant && store.responses[index].error === undefined) {
      refresh();
    }
  }, []);

  // set error when response is not ok
  useEffect(() => {
    if (error) {
      store.responses[index].error = error.message;
    } else {
      store.responses[index].error = undefined;
    }
  }, [error]);

  useEffect(() => {
    store.responses[index].messages = ref(messages);
  }, [messages]);

  console.log("messages", messages);

  return (
    <Card>
      <CardHeader className=" space-y-0 flex flex-row bg-muted/50 p-2">
        {isLoading ? (
          <LoaderCircleIcon
            onClick={stop}
            size={16}
            className="text-gray-500 loading-icon"
          />
        ) : (
          <RefreshCwIcon
            size={16}
            className="text-gray-500"
            onClick={() => refresh()}
          />
        )}
        <div className="flex-1"></div>
        <div className="text-xs text-gray-500 pr-2">{response.modelId}</div>
        <XIcon
          className="text-gray-500"
          size={16}
          onClick={() => {
            store.responses = store.responses.toSpliced(index, 1);
          }}
        />
      </CardHeader>
      <CardContent className="p-6">
        {response.error && (
          <Label className="text-red-500">{store.responses[index].error}</Label>
        )}
        {messages
          .filter((m) => m.role === "assistant")
          .map((message, index) => {
            return (
              <MemoizedReactMarkdown
                key={index}
                className="prose break-words dark:prose-invert prose-p:leading-relaxed prose-pre:p-0"
                remarkPlugins={[remarkGfm, remarkMath]}
                components={{
                  p({ children }) {
                    return <p className="mb-2 last:mb-0">{children}</p>;
                  },
                  code({ node, inline, className, children, ...props }) {
                    if (children.length) {
                      if (children[0] == "▍") {
                        return (
                          <span className="mt-1 cursor-default animate-pulse">
                            ▍
                          </span>
                        );
                      }

                      children[0] = (children[0] as string).replace("`▍`", "▍");
                    }

                    const match = /language-(\w+)/.exec(className || "");

                    if (inline) {
                      return (
                        <code className={className} {...props}>
                          {children}
                        </code>
                      );
                    }

                    return (
                      <CodeBlock
                        // key={Math.random()}
                        language={(match && match[1]) || ""}
                        value={String(children).replace(/\n$/, "")}
                        {...props}
                      />
                    );
                  },
                }}
              >
                {message.content}
              </MemoizedReactMarkdown>
            );
          })}
      </CardContent>
    </Card>
  );
}
