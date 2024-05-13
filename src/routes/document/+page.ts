export async function load() {
  const { driz } = await import("@/database/client");
  return {
    documents: await driz.query.documentTable.findMany(),
  };
}
