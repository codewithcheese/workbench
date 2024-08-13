import { redirect } from "@sveltejs/kit";
import { route } from "$lib/route";

export async function load() {
  return redirect(301, route("/settings/keys"));
}
