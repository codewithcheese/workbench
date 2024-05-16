/// <reference types="@testing-library/jest-dom" />

import { expect, it } from "vitest";
import { render, screen } from "@testing-library/svelte";
import Page from "./Page.svelte";
import { runMigrations } from "../src/database/migrator";

it("no initial greeting", () => {
  // @ts-expect-error svelte component types
  render(Page, { name: "World" });
  const greeting = screen.queryByText(/hello world/iu);
  expect(greeting).toBeInTheDocument();
});
