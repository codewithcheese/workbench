/* @vitest-environment node */
import { describe, expect, it } from "vitest";
import {
  type Model,
  type Project,
  projectTable,
  type Response,
  type ResponseMessage,
  type Service,
} from "@/database/schema";
import { registerModel } from "../src/database";

describe("cache", () => {
  it("should use relations to extract models", async () => {
    type ProjectView = Project & {
      responses: (Response & {
        model: Model & {
          service: Service;
        };
        messages: ResponseMessage[];
      })[];
    };

    let view: ProjectView | ProjectView[] = {
      id: "id-project",
      name: "Untitled",
      prompt: "",
      createdAt: new Date().toISOString(),
      responses: [
        {
          id: "id-response",
          projectId: "id-project",
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
    registerModel(projectTable, view, (...deps) => {
      deps.forEach((d) => dependencies.add(d));
    });
    expect(dependencies).toEqual(
      new Set([
        "model:project:id-project",
        "model:response:id-response",
        "model:responseMessage:id-message",
        "model:responseMessage:id-message2",
        "model:model:id-model",
        "model:service:id-service",
      ]),
    );
  });
});
