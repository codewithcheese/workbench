import { Dataset } from "@/lib/dataset.svelte";
import { nanoid } from "nanoid";

// todo: remove these types and datasets once migration deployed
export type Document = {
  id: string;
  name: string;
  description: string;
  content: string;
  data?: any;
};

export type Response = {
  id: string;
  projectId: string;
  modelId: string;
  error: string | null;
};

export type ResponseMessage = {
  id: string;
  responseId: string;
  role: string;
  content: string;
};

export type Model = {
  id: string;
  serviceId: string;
  name: string;
  visible: boolean;
};

export type Service = {
  id: string;
  name: string;
  providerId: string;
  baseURL: string;
  apiKey: string;
};

export type Store = {
  selected: {
    modelId: string | null;
  };
};

export type Project = {
  id: string;
  name: string;
  prompt: string;
};

export type DB = {
  documents: Dataset<Document>;
  projects: Dataset<Project>;
  responses: Dataset<Response>;
  services: Dataset<Service>;
  models: Dataset<Model>;
  messages: Dataset<ResponseMessage>;
};

export let db: DB = $state({
  projects: Dataset.load<Project>("projects", [
    {
      id: nanoid(10),
      name: "Untitled",
      prompt: "",
    },
  ]),
  documents: Dataset.load<Document>("documents"),
  responses: Dataset.load<Response>("responses"),
  services: Dataset.load<Service>("services"),
  models: Dataset.load<Model>("models"),
  messages: Dataset.load<ResponseMessage>("messages"),
});

const storeJson = localStorage.getItem("store");

export let store: Store = $state(
  storeJson
    ? JSON.parse(storeJson)
    : {
        selected: {
          modelId: null,
        },
      },
);

// // persist store to localStorage
$effect.root(() => {
  $effect(() => {
    localStorage.setItem("store", JSON.stringify(store));
  });
});
