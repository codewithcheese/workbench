import { aiAccountTable, registerModel, useDb } from "@/database";
import { eq } from "drizzle-orm";
import { superValidate } from "sveltekit-superforms";
import { zod } from "sveltekit-superforms/adapters";
import { formSchema } from "../$data";
import { error } from "@sveltejs/kit";
import { loadAiServices } from "../../$data.test";

export async function load({ params, depends }) {
  const aiAccount = await useDb().query.aiAccountTable.findFirst({
    where: eq(aiAccountTable.id, params.id),
    with: {
      aiService: {
        columns: {
          id: true,
          name: true,
        },
      },
    },
  });
  if (!aiAccount) {
    return error(404, "Account not found");
  }
  const form = await superValidate(aiAccount, zod(formSchema));
  depends("view:account");
  return {
    form,
    aiAccount,
    aiServices: await loadAiServices(),
  };
}
