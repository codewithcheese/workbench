import { describe, expect, it } from "vitest";
import { extractParams, match, route } from "$lib/route";

describe("route function", () => {
  it("should correctly handle parameterized routes", () => {
    const result = route("/chat/[id]", { id: "hello" });
    expect(result).toBe("/chat/hello");
  });

  it("should handle query parameters", () => {
    const result = route("/chat/[id]", { id: "hello", $query: { message: "test" } });
    expect(result).toBe("/chat/hello?message=test");
  });

  it("should handle hash", () => {
    const result = route("/chat/[id]", { id: "hello", $hash: "section1" });
    expect(result).toBe("/chat/hello#section1");
  });

  it("should handle query parameters and hash", () => {
    const result = route("/chat/[id]", {
      id: "hello",
      $query: { message: "test" },
      $hash: "section1",
    });
    expect(result).toBe("/chat/hello?message=test#section1");
  });

  it("should handle routes with catch-all parameters", () => {
    const result = route("/chat/[id]/[...rest]/config/[serviceId]", {
      id: "chatId",
      rest: "some/nested/route",
      serviceId: "serviceId",
    });
    expect(result).toBe("/chat/chatId/some/nested/route/config/serviceId");
  });

  it("should throw an error if required param is missing", () => {
    // @ts-expect-error error test, should throw
    expect(() => route("/chat/[id]", {})).toThrow();
  });

  it("should handle group routes correctly", () => {
    const result = route("/document/new", {});
    expect(result).toBe("/document/new");
  });
  it("should correctly handle parameterized routes", () => {
    const result = route("/chat/[id]", { id: "hello" });
    expect(result).toBe("/chat/hello");
  });

  it("should handle query parameters", () => {
    const result = route("/chat/[id]", { id: "hello", $query: { message: "test" } });
    expect(result).toBe("/chat/hello?message=test");
  });

  it("should handle hash", () => {
    const result = route("/chat/[id]", { id: "hello", $hash: "section1" });
    expect(result).toBe("/chat/hello#section1");
  });

  it("should handle query parameters and hash", () => {
    const result = route("/chat/[id]", {
      id: "hello",
      $query: { message: "test" },
      $hash: "section1",
    });
    expect(result).toBe("/chat/hello?message=test#section1");
  });

  it("should handle routes with catch-all parameters", () => {
    const result = route("/chat/[id]/[...rest]/config/[serviceId]", {
      id: "chatId",
      rest: "some/nested/route",
      serviceId: "serviceId",
    });
    expect(result).toBe("/chat/chatId/some/nested/route/config/serviceId");
  });

  it("should throw an error if required param is missing", () => {
    // @ts-expect-error error test, should throw
    expect(() => route("/chat/[id]", {})).toThrow();
  });

  it("should handle group routes correctly", () => {
    const result = route("/document/new", {});
    expect(result).toBe("/document/new");
  });
});

describe("match function", () => {
  it("should match routes with group prefix", () => {
    expect(match("/chat/[id]", "/(app)/chat/1")).toBe(true);
  });

  it("should match exact routes", () => {
    expect(match("/document/new", "/document/new")).toBe(true);
  });

  it("should match parameterized routes", () => {
    expect(match("/chat/[id]", "/chat/123")).toBe(true);
  });

  it("should not match routes with different lengths", () => {
    expect(match("/chat/[id]", "/chat/123/messages")).toBe(false);
  });

  it("should not match routes with different static parts", () => {
    expect(match("/chat/[id]", "/user/123")).toBe(false);
  });

  it("should match routes with multiple parameters", () => {
    expect(match("/chat/[id]/[...rest]/config/[serviceId]", "/chat/123/config/456")).toBe(true);
  });

  it("should match routes with catch-all parameters", () => {
    expect(match("/chat/[id]/[...rest]/config", "/chat/123/foo/bar/baz/config")).toBe(true);
  });
});

describe("extractParams function", () => {
  it("should extract params from a simple route", () => {
    const params = extractParams("/chat/[id]", "/chat/123");
    expect(params).toEqual({ id: "123" });
  });

  it("should extract multiple params", () => {
    const params = extractParams("/chat/[id]/[...rest]/config/[serviceId]", "/chat/123/config/456");
    expect(params).toEqual({ id: "123", serviceId: "456", rest: "" });
  });

  it("should extract catch-all params", () => {
    const params = extractParams("/chat/[id]/[...rest]/config", "/chat/123/foo/bar/baz/config");
    expect(params).toEqual({ id: "123", rest: "foo/bar/baz" });
  });

  it("should return null for non-matching routes", () => {
    const params = extractParams("/chat/[id]", "/user/123");
    expect(params).toBeNull();
  });

  it("should return null for routes with different lengths", () => {
    const params = extractParams("/chat/[id]", "/chat/123/messages");
    expect(params).toBeNull();
  });

  it("should return an empty object for routes with no params", () => {
    const params = extractParams("/document/new", "/document/new");
    expect(params).toEqual({});
  });
});
