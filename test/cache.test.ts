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
import * as schema from "@/database/schema";
import { Cache } from "../src/database/cache";
import { render } from "@testing-library/svelte";
import Page from "./Page.svelte";

describe("cache", () => {
  it("should use relations to extract models", () => {
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
      responses: [
        {
          id: "id-response",
          projectId: "id-project",
          modelId: "id-model",
          error: null,
          messages: [
            {
              id: "id-message",
              index: 0,
              responseId: "id-response",
              role: "user",
              content: "",
            },
          ],
          model: {
            id: "id-model",
            serviceId: "id-service",
            name: "",
            visible: 1,
            service: {
              id: "id-service",
              name: "",
              providerId: "",
              baseURL: "",
              apiKey: "",
            },
          },
        },
      ],
    };
    const routeId = "/project/[id]";
    const cache = new Cache(schema);
    const cachedView = cache.register(view, projectTable, routeId);
    expect(cache.routeModels).toHaveProperty(routeId);
    expect(cache.routeModels[routeId]).toHaveLength(5);
    expect(cachedView).toEqual(view);
    // path matches routeId, no models should be unloaded
    cache.onNavigate("/project/1");
    expect(cache.routeModels).toHaveProperty(routeId);
    expect(cache.routeModels[routeId]).toHaveLength(5);
    // path does not match routeId, models should be unloaded
    cache.onNavigate("/");
    expect(cache.routeModels[routeId]).toBeUndefined();
    for (const tableName of Object.keys(cache.cache)) {
      expect(Object.keys(cache.cache[tableName])).toHaveLength(0);
    }
  });
});
