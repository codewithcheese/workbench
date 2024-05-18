import {
  modelTable,
  responseMessageTable,
  responseTable,
  documentTable,
  useDb,
  projectTable,
  type Project,
} from "@/database";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { invalidate, invalidateAll } from "$app/navigation";
import { toast } from "svelte-french-toast";
import { invalidateModel } from "@/database/model";

export type ServicesView = Awaited<ReturnType<typeof loadServices>>;

export function loadServices() {
  return useDb().query.serviceTable.findMany({
    with: {
      models: true,
    },
  });
}

export async function updateProject(project: Project) {
  console.log("updateProject", project);
  const result = await useDb()
    .update(projectTable)
    .set({ ...project })
    .where(eq(projectTable.id, project.id))
    .returning();
  console.log(result);
  await invalidateModel(projectTable, project);
}

export async function updateResponsePrompt(id: string) {
  try {
    console.time("updateResponsePrompt");
    const response = await useDb().query.responseTable.findFirst({
      where: eq(responseTable.id, id),
    });
    if (!response) {
      return toast.error("Response not found");
    }
    // get first message
    const message = await useDb().query.responseMessageTable.findFirst({
      where: eq(responseMessageTable.responseId, id),
    });
    if (!message) {
      return toast.error("Message not found");
    }
    const project = await useDb().query.projectTable.findFirst({
      where: eq(projectTable.id, response.projectId),
    });
    if (!project) {
      return toast.error("Project not found");
    }
    // interpolate documents into prompt
    const content = await interpolateDocuments(project.prompt);
    console.log("updated prompt", content);
    await useDb()
      .update(responseMessageTable)
      .set({ content })
      .where(eq(responseMessageTable.id, message.id));
  } catch (e) {
    if (e instanceof Error) {
      toast.error(e.message);
    }
    console.error(e);
  } finally {
    console.timeEnd("updateResponsePrompt");
  }
}

export async function interpolateDocuments(prompt: string) {
  const templateTagRegex = /\[\[(.*?)]]/g;
  const matches = prompt.match(templateTagRegex);
  if (!matches) {
    return prompt;
  }
  let interpolatedPrompt = prompt;
  for (const match of matches) {
    const docName = match.slice(2, -2);
    console.log("Replacing", docName);
    // Find the document with the name extracted from the tag
    const document = await useDb().query.documentTable.findFirst({
      where: eq(documentTable.name, docName),
    });
    if (!document) {
      throw new Error(`Document "${docName}" not found.`);
    }
    interpolatedPrompt = interpolatedPrompt.replaceAll(match, document.content);
  }
  return interpolatedPrompt;
}

export async function submitPrompt(project: Project, modelId: string | null) {
  try {
    if (!modelId) {
      throw new Error("No model selected");
    }
    const model = await useDb().query.modelTable.findFirst({
      where: eq(modelTable.id, modelId),
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
    await invalidate("view:responses");
  } catch (e) {
    if (e instanceof Error) {
      toast.error(e.message);
    }
    console.error(e);
  }
}
