import { redirect } from "@sveltejs/kit";

export function load({ params }) {
  return redirect(301, `/chat/${params.id}/revise`);
}
