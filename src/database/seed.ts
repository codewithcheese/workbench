import { projectTable } from "@/database/schema";
import { useDb } from "@/database/client";
import { nanoid } from "nanoid";

export function seed() {
  // create first project
  return useDb().transaction(async (tx) => {
    await tx.insert(projectTable).values({
      id: nanoid(10),
      name: "Untitled",
      prompt: "",
      createdAt: new Date().toISOString(),
    });
  });
}
