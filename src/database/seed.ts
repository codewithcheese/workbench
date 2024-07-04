import { chatTable } from "@/database/schema";
import { useDb } from "@/database/client";
import { nanoid } from "nanoid";

export function seed() {
  // create first chat
  return useDb().transaction(async (tx) => {
    await tx.insert(chatTable).values({
      id: nanoid(10),
      name: "Untitled",
      prompt: "",
      createdAt: new Date().toISOString(),
    });
  });
}
