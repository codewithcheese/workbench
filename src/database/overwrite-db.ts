import { useDbFile } from "@/database/client";

export async function overwriteDb() {
  const { overwriteDatabaseFile } = useDbFile();
}
