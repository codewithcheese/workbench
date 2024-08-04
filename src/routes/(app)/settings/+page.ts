import { keyTable, registerModel } from "@/database";
import { loadKeys } from "./$data.test";

export async function load({ depends, route }) {
  const keys = await loadKeys();
  registerModel(keyTable, keys, depends);
  depends("view:services");
  return {
    keys,
  };
}
