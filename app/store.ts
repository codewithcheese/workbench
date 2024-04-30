"use client";
import { proxy, ref, subscribe } from "valtio";
import { Message } from "ai";
import { useEffect, useState } from "react";

export type Response = {
  id: string;
  messages: Message[];
  modelId: string;
  serviceName: string;
  error?: string;
};

export type Model = {
  id: string;
  name: string;
  visible: boolean;
};

export type Service = {
  id: string;
  name: string;
  models: Model[];
  providerId: string;
  baseURL: string;
  apiKey: string;
};

export type Store = {
  responses: Response[];
  prompt: { blocks: string[] };
  selected: { model?: { modelId: string; service: Service } };
  services: Service[];
};

const defaultStore: Store = {
  prompt: { blocks: [""] },
  responses: [],
  selected: { model: undefined },
  services: [],
};

export let store = proxy<Store>(defaultStore);

export function submitPrompt() {
  if (!store.selected.model) {
    // TODO: show error
    return;
  }
  store.responses.unshift({
    id: crypto.randomUUID(),
    // message controlled by useChat treat as ref in store
    messages: ref([
      {
        id: crypto.randomUUID(),
        role: "user",
        content: store.prompt.blocks.join("\n"),
      },
    ]),
    modelId: store.selected.model.modelId,
    serviceName: store.selected.model.service.name,
  });
}

export function updateService(id: string, values: Partial<Service>) {
  const service = store.services.find((s) => s.id === id);
  if (service) {
    Object.assign(service, values);
  }
}

export function isSelectedModelAvailable() {
  if (!store.selected.model) {
    // if nothing selected then consider it available
    return true;
  }
  const service = store.services.find(
    (s) => s.id === store.selected.model!.service.id
  );
  if (!service) {
    return false;
  }
  const model = service.models.find(
    (m) => m.id === store.selected.model!.modelId
  );
  return model?.visible;
}

export function selectNextAvailableModel() {
  const service = store.services.find((s) => s.models.find((m) => m.visible));
  if (!service) {
    return;
  }
  const model = service.models.find((m) => m.visible);
  if (!model) {
    return;
  }
  store.selected.model = { modelId: model.id, service };
}

subscribe(store, (s) => {
  localStorage.setItem("store", JSON.stringify(s));
});

declare module "valtio" {
  function useSnapshot<T extends object>(p: T): T;
}

export function useLocalStorage() {
  const [pending, setPending] = useState(true);
  useEffect(() => {
    loadFromLocalStorage();
    setPending(false);
  }, []);
  return { pending };
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
