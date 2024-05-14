import { Dataset } from "@/lib/dataset.svelte";
import { nanoid } from "nanoid";
import { invalidateAll } from "$app/navigation";
import { toast } from "svelte-french-toast";
import { modelTable, responseMessageTable, responseTable } from "@/database/schema";
import { eq } from "drizzle-orm";
import { useDb } from "@/database/client";
import { interpolateDocuments } from "$lib/prompt";

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
    projectId: string;
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
          projectId: db.projects.items[0]!.id,
          modelId: null,
        },
      },
);

// persist store to localStorage
$effect.root(() => {
  $effect(() => {
    localStorage.setItem("store", JSON.stringify(store));
  });
});

export async function submitPrompt(project: Project) {
  try {
    if (!store.selected.modelId) {
      throw new Error("No model selected");
    }
    const model = await useDb().query.modelTable.findFirst({
      where: eq(modelTable.id, store.selected.modelId),
    });
    if (!model) {
      throw new Error("Selected model not found");
    }
    // const model = db.models.get(store.selected.modelId);
    // interpolate documents into prompt
    const content = await interpolateDocuments(project.prompt);
    console.log("content", content);
    await useDb().transaction(async (tx) => {
      const responseId = nanoid(10);
      await tx.insert(responseTable).values({
        id: responseId,
        projectId: project.id,
        modelId: model.id,
        error: null,
      });
      await tx.insert(responseMessageTable).values({
        id: nanoid(),
        index: 0,
        responseId,
        role: "user",
        content,
      });
    });
    await invalidateAll();
  } catch (e) {
    if (e instanceof Error) {
      toast.error(e.message);
    }
    console.error(e);
  }
}

$effect.root(() => {
  $effect(() => {
    // if selected model is not available then select next available model
    if (!isSelectedModelAvailable()) {
      selectNextAvailableModel();
    }
    // if no model selected then select first available model
    if (!store.selected.modelId) {
      selectNextAvailableModel();
    }
  });
});

export function removeDocument(document: Document) {
  db.documents.remove(document.id);
}

export function isSelectedModelAvailable() {
  if (!store.selected.modelId) {
    // if nothing selected then consider it available
    return true;
  }
  const model = db.models.get(store.selected.modelId);
  return model?.visible;
}

export function selectNextAvailableModel() {
  const model = db.models.items.find((m) => m.visible);
  if (!model) {
    store.selected.modelId = null;
  } else {
    store.selected.modelId = model.id;
  }
}
