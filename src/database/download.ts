import { SQLITE_FILENAME } from "@/database/client";

export async function downloadDatabase() {
  const { SQLocal } = await import("sqlocal");
  const { getDatabaseFile } = new SQLocal(SQLITE_FILENAME);
  const databaseFile = await getDatabaseFile();
  const fileUrl = URL.createObjectURL(databaseFile);
  const link = document.createElement("a");
  link.href = fileUrl;
  link.download = "database.sqlite3";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
