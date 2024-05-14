import { useDb } from "@/database/client";
import { and, asc, count, desc, eq, not, notInArray } from "drizzle-orm";
import { projectTable, responseMessageTable, responseTable } from "@/database/schema";
import type { Project } from "@/store.svelte";
import { nanoid } from "nanoid";

export type ProjectView = Project;

export class Projects {
  items: ProjectView[] = $state([]);

  async load() {
    this.items = await useDb().query.projectTable.findMany({});
  }

  async newProject() {
    const id = nanoid(10);
    await useDb().insert(projectTable).values({
      id: id,
      name: "Untitled",
      prompt: "",
    });
    await this.load();
    return id;
  }

  async removeProject(project: Project) {
    // remove responses
    await useDb().transaction(async (tx) => {
      await tx.delete(responseMessageTable).where(eq(responseMessageTable.responseId, project.id));
      await tx.delete(responseTable).where(eq(responseTable.id, project.id));
    });
    // delete project
    await useDb().delete(projectTable).where(eq(projectTable.id, project.id));
    // find next project
    const nextProject = await useDb().query.projectTable.findFirst({
      where: not(eq(projectTable.id, project.id)),
    });
    let nextId: string;
    if (nextProject) {
      // next project exists, use it
      nextId = nextProject.id;
    } else {
      // no next project, create new project
      nextId = await this.newProject();
    }
    await this.load();
    return nextId;
  }

  async duplicateProject(id: string) {
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
}

export const projects: Projects = new Projects();
