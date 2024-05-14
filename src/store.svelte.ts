import { Dataset } from "@/lib/dataset.svelte";
import { nanoid } from "nanoid";
import { goto, invalidateAll } from "$app/navigation";
import { toast } from "svelte-french-toast";
import {
  documentTable,
  modelTable,
  projectTable,
  responseMessageTable,
  responseTable,
} from "@/database/schema";
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

export async function newProject() {
  const id = nanoid(10);
  await useDb().insert(projectTable).values({
    id: id,
    name: "Untitled",
    prompt: "",
  });
  return id;
}

export function removeProject(project: Project) {
  // remove responses
  const responses = db.responses.filter((r) => r.projectId === project.id);
  const messages = responses.map((r) => db.messages.filter((m) => m.responseId === r.id)).flat();
  messages.forEach((m) => db.messages.remove(m.id));
  responses.forEach((r) => db.responses.remove(r.id));
  // set store projectId to first project, if no projects then create new project
  const index = db.projects.items.findIndex((f) => f.id === project.id);
  let nextId;
  if (db.projects.items.length < 2) {
    nextId = newProject();
  } else {
    nextId = index === 0 ? db.projects.items[1].id : db.projects.items[index - 1].id;
  }
  goto(`/project/${nextId}`);
  db.projects.remove(project.id);
}

export function duplicateProject(project: Project) {
  const responses = db.responses.filter((r) => r.projectId === project.id);
  const messages = responses.map((r) => db.messages.filter((m) => m.responseId === r.id)).flat();
  const newId = nanoid(10);
  db.projects.push({ id: newId, name: `${project.name} copy`, prompt: project.prompt });
  const responseMap: Record<string, string> = {};
  responses.forEach((r) => {
    const id = nanoid(10);
    responseMap[r.id] = id;
    db.responses.push({
      id,
      projectId: newId,
      modelId: r.modelId,
      error: null,
    });
  });
  messages.forEach((m) => {
    const id = nanoid(10);
    db.messages.push({
      id,
      responseId: responseMap[m.responseId],
      role: m.role,
      content: m.content,
    });
  });
  goto(`/project/${newId}`);
}

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
