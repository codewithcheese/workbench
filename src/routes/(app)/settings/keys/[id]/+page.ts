import { keyTable, registerModel, useDb } from "@/database";
import { eq } from "drizzle-orm";
import { superValidate } from "sveltekit-superforms";
import { zod } from "sveltekit-superforms/adapters";
import { formSchema } from "../$data";
import { error } from "@sveltejs/kit";
import { loadServices } from "../../$data.test";

export async function load({ params, depends }) {
  const key = await useDb().query.keyTable.findFirst({
    where: eq(keyTable.id, params.id),
    with: {
      models: true,
      service: {
        columns: {
          id: true,
          name: true,
        },
      },
    },
  });
  if (!key) {
    return error(404, "Account not found");
  }
  const form = await superValidate(key, zod(formSchema));
  registerModel(keyTable, key, depends);
  return {
    form,
    key,
    services: await loadServices(),
  };
}
