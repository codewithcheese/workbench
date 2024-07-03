import { useDb } from "@/database/client";
import { asc, desc, eq, not } from "drizzle-orm";
import { projectTable, responseMessageTable, responseTable } from "@/database/schema";
import { nanoid } from "nanoid";
import { invalidate } from "$app/navigation";

export async function newProject() {
  const id = nanoid(10);
  await useDb().insert(projectTable).values({
    id: id,
    name: "Untitled",
    prompt: "",
  });
  await invalidate("view:projects");
  return id;
}

export async function removeProject(projectId: string) {
  // remove responses
  await useDb().delete(responseTable).where(eq(responseTable.projectId, projectId));
  // delete project
  await useDb().delete(projectTable).where(eq(projectTable.id, projectId));
  // find next project
  const nextProject = await useDb().query.projectTable.findFirst({
    where: not(eq(projectTable.id, projectId)),
    orderBy: [desc(projectTable.createdAt)],
  });
  let nextId: string;
  if (nextProject) {
    // next project exists, use it
    nextId = nextProject.id;
  } else {
    // no next project, create new project
    nextId = await newProject();
  }
  await invalidate("view:projects");
  return nextId;
}

export async function duplicateProject(id: string) {
  const project = await useDb().query.projectTable.findFirst({
    where: eq(projectTable.id, id),
    with: {
      responses: {
        with: {
          messages: {
            orderBy: [asc(responseMessageTable.index)],
          },
        },
      },
    },
  });
  if (!project) {
    throw new Error("Project not found");
  }
  const newId = nanoid(10);
  await useDb().transaction(async (tx) => {
    await tx.insert(projectTable).values({
      id: newId,
      name: `${project.name} copy`,
      prompt: project.prompt,
    });
    for (const response of project.responses) {
      const responseId = nanoid(10);
      await tx.insert(responseTable).values({
        id: responseId,
        projectId: newId,
        modelId: response.modelId,
        error: null,
      });
      let index = 0;
      for (const message of response.messages) {
        const responseMessageId = nanoid(10);
        await tx.insert(responseMessageTable).values({
          id: responseMessageId,
          index,
          responseId: responseId,
          role: message.role,
          content: message.content,
        });
        index += 1;
      }
    }
  });
  await invalidate("view:projects");
  return newId;
}
