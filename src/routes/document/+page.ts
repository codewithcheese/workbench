import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ params }) => {
  // console.log("Loading document", params);
  // const { kysely } = await import("@/database/client");
  // const documents = await kysely.selectFrom("document").selectAll().execute();
  // console.log("Documents", documents);
  // return {
  //   documents,
  // };
  return {};
};
