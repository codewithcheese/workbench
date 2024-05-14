import { useDb } from "@/database/client";
import { eq } from "drizzle-orm";
import { documentTable } from "@/database/schema";

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
