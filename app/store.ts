"use client";
import { proxy, ref, subscribe } from "valtio";
import { Message } from "ai";

type Response = { id: string; messages: Message[] };

type Store = {
  responses: Response[];
  prompt: string;
  model: string;
};

const defaultStore = {
  prompt: "",
  responses: [],
  model: "claude-3-haiku-20240307",
};

const initStore = JSON.parse(localStorage.getItem("store") as string) || {};

export const store = proxy<Store>({
  ...defaultStore,
  prompt: initStore.prompt,
  responses: initStore.responses.map((response: Response) => ({
    ...response,
    messages: ref(response.messages),
  })),
});

console.log(store.prompt);

subscribe(store, (s) => {
  localStorage.setItem("store", JSON.stringify(store));
});

declare module "valtio" {
  function useSnapshot<T extends object>(p: T): T;
}
