import { newChat } from "../routes/(app)/$data";

export function seed() {
  // create first chat
  return newChat();
}
