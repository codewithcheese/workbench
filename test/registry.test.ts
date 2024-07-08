import { describe, expect, it } from "vitest";
import { type Chat, chatTable, type Message, type Revision } from "@/database/schema";
import { registerModel } from "../src/database";

describe("cache", () => {
  it("should use relations to extract models", async () => {
    type ChatView = Chat & {
      revisions: (Revision & {
        messages: Message[];
      })[];
    };

    let view: ChatView | ChatView[] = {
      id: "id-chat",
      name: "Untitled",
      prompt: "",
      createdAt: new Date().toISOString(),
      revisions: [
        {
          id: "id-revision",
          version: 1,
          chatId: "id-chat",
          error: null,
          createdAt: new Date().toISOString(),
          messages: [
            {
              id: "id-message",
              index: 0,
              revisionId: "id-revision",
              role: "user",
              content: "",
              createdAt: new Date().toISOString(),
            },
            {
              id: "id-message2",
              index: 0,
              revisionId: "id-revision",
              role: "user",
              content: "",
              createdAt: new Date().toISOString(),
            },
          ],
        },
      ],
    };
    const dependencies = new Set<string>();
    registerModel(chatTable, view, (...deps) => {
      deps.forEach((d) => dependencies.add(d));
    });
    expect(dependencies).toEqual(
      new Set([
        "model:chat:id-chat",
        "model:revision:id-revision",
        "model:message:id-message",
        "model:message:id-message2",
      ]),
    );
  });
});
