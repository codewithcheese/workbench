import { useDb } from "@/database/client";
import { asc, eq, not } from "drizzle-orm";
import { projectTable, responseMessageTable, responseTable } from "@/database/schema";
import { nanoid } from "nanoid";

export async function newProject() {
  const id = nanoid(10);
  await useDb().insert(projectTable).values({
    id: id,
    name: "Untitled",
    prompt: "",
  });
  return id;
}

export async function removeProject(id: string) {
  // remove responses
  await useDb().transaction(async (tx) => {
    await tx.delete(responseMessageTable).where(eq(responseMessageTable.responseId, id));
    await tx.delete(responseTable).where(eq(responseTable.id, id));
  });
  // delete project
  await useDb().delete(projectTable).where(eq(projectTable.id, id));
  // find next project
  const nextProject = await useDb().query.projectTable.findFirst({
    where: not(eq(projectTable.id, id)),
  });
  let nextId: string;
  if (nextProject) {
    // next project exists, use it
    nextId = nextProject.id;
  } else {
    // no next project, create new project
    nextId = await newProject();
  }
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
      const id = nanoid(10);
      await tx.insert(responseTable).values({
        id,
        projectId: newId,
        modelId: response.modelId,
        error: null,
      });
      let index = 0;
      for (const message of response.messages) {
        const id = nanoid(10);
        await tx.insert(responseMessageTable).values({
          id,
          index,
          responseId: id,
          role: message.role,
          content: message.content,
        });
        index += 1;
      }
    }
  });
  return newId;
}
