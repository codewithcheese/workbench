import { describe, expect, it } from "vitest";
import { Counter } from "./counter.svelte";
import { tick } from "svelte";

describe("Counter", () => {
  it("should initialize with the given value", () => {
    const counter = new Counter(5);
    expect(counter.count).toBe(5);
  });

  it("should increment the count", async () => {
    const counter = new Counter(0);
    counter.increment();
    await tick();
    expect(counter.count).toBe(1);
  });

  it("should decrement the count", async () => {
    const counter = new Counter(5);
    counter.decrement();
    await tick();
    expect(counter.count).toBe(4);
  });

  it("should calculate doubleCount correctly", async () => {
    const counter = new Counter(2);
    expect(counter.doubleCount).toBe(4);
    counter.increment();
    await tick();
    expect(counter.count).toBe(3);
    expect(counter.doubleCount).toBe(6);
  });
});
