import { useDbFile } from "@/database/client";

export async function exportDb() {
  const { getDatabaseFile } = useDbFile();
  const databaseFile = await getDatabaseFile();
  const fileUrl = URL.createObjectURL(databaseFile);

  const now = new Date();
  const timestamp = now.toISOString().split(".")[0].replace(/\:/g, "-");

  const a = document.createElement("a");
  a.href = fileUrl;
  a.download = `workbench-${timestamp}.db`;
  a.click();
  a.remove();

  URL.revokeObjectURL(fileUrl);
}
