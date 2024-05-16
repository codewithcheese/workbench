import { useDb } from "@/database/client";
import { and, asc, count, desc, eq, not, notInArray } from "drizzle-orm";
import { type Project, projectTable, responseMessageTable, responseTable } from "@/database/schema";
import { nanoid } from "nanoid";

export class ProjectStore {
  id: string;
  name: string = $state("");
  prompt: string = $state("");

  constructor(project: Project) {
    this.id = project.id;
    this.name = project.name;
    this.prompt = project.prompt;
  }
}

export class Projects {
  items: ProjectStore[] = $state([]);

  async load() {
    const projects = await useDb().query.projectTable.findMany({});
    this.items = projects.map((p) => new ProjectStore(p));
  }

  async getProject(id: string) {
    let projectStore = this.items.find((p) => p.id === id);
    if (!projectStore) {
      const project = await useDb().query.projectTable.findFirst({
        where: eq(projectTable.id, id),
      });
      if (!project) {
        throw new Error("Project not found");
      }
      projectStore = new ProjectStore(project);
      this.items.push(projectStore);
    }
    return projectStore;
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

  async removeProject(id: string) {
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
