import { describe, expect, it } from "vitest";
import {
  type Model,
  type Chat,
  chatTable,
  type Response,
  type ResponseMessage,
  type Service,
} from "@/database/schema";
import { registerModel } from "../src/database";

describe("cache", () => {
  it("should use relations to extract models", async () => {
    type ChatView = Chat & {
      responses: (Response & {
        model: Model & {
          service: Service;
        };
        messages: ResponseMessage[];
      })[];
    };

    let view: ChatView | ChatView[] = {
      id: "id-chat",
      name: "Untitled",
      prompt: "",
      createdAt: new Date().toISOString(),
      responses: [
        {
          id: "id-response",
          chatId: "id-chat",
          modelId: "id-model",
          error: null,
          createdAt: new Date().toISOString(),
          messages: [
            {
              id: "id-message",
              index: 0,
              responseId: "id-response",
              role: "user",
              content: "",
              createdAt: new Date().toISOString(),
            },
            {
              id: "id-message2",
              index: 0,
              responseId: "id-response",
              role: "user",
              content: "",
              createdAt: new Date().toISOString(),
            },
          ],
          model: {
            id: "id-model",
            serviceId: "id-service",
            name: "",
            visible: 1,
            createdAt: new Date().toISOString(),
            service: {
              id: "id-service",
              name: "",
              providerId: "",
              baseURL: "",
              apiKey: "",
              createdAt: new Date().toISOString(),
            },
          },
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
        "model:response:id-response",
        "model:responseMessage:id-message",
        "model:responseMessage:id-message2",
        "model:model:id-model",
        "model:service:id-service",
      ]),
    );
  });
});
