<script lang="ts">
  import { Input } from "@/components/ui/input";

  let items = $state([{ role: "system", content: "Hello" }]);

  function getLastUserMessageOrAppend() {
    let userMessage = items.findLast((m) => m.role === "user");
    if (!userMessage) {
      userMessage = { role: "user", content: "Hello" };
      items.push(userMessage);
    }
    return userMessage;
  }

  let content = $state(getLastUserMessageOrAppend().content);
</script>

<Input bind:value={content} />
