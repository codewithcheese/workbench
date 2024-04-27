"use client";
import { proxy, ref, subscribe } from "valtio";
import { Message } from "ai";

export type Response = { id: string; messages: Message[]; error?: string };

export type Model = {
  id: string;
  name: string;
  visible: boolean;
};

export type Service = {
  id: string;
  name: string;
  apiKey: string;
  models: Model[];
};

export type Store = {
  responses: Response[];
  prompt: string;
  selected: { modelId?: string; serviceId?: string };
  services: Record<string, Service>;
};

const defaultStore: Store = {
  prompt: "",
  responses: [],
  selected: {},
  services: {},
};

export let store = proxy<Store>(defaultStore);

subscribe(store, (s) => {
  localStorage.setItem("store", JSON.stringify(store));
});

declare module "valtio" {
  function useSnapshot<T extends object>(p: T): T;
}

export function loadFromLocalStorage() {
  const initStore = JSON.parse(localStorage.getItem("store") as string);
  if (initStore) {
    initStore.responses = initStore.responses.map((res: any) => {
      res.messages = ref(res.messages);
      return res;
    });
    Object.assign(store, initStore);
  }
}
