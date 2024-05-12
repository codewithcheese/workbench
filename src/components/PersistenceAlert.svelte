<script lang="ts">
  import * as Alert from "@/components/ui/alert";
  import { Button } from "@/components/ui/button";
  import { toast } from "svelte-french-toast";

  async function isStoragePersistent(): Promise<boolean> {
    if (navigator.storage && navigator.storage.persisted) {
      try {
        const persisted = await navigator.storage.persisted();
        console.log("Persisted", persisted);
        return persisted;
      } catch (error) {
        toast.error(
          `Error checking storage persistence: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
        return false;
      }
    }
    return false;
  }

  let havePersistence = $state(false);

  $effect(() => {
    (async () => {
      havePersistence = await isStoragePersistent();
    })();
  });
</script>

{#if !havePersistence}
  <Alert.Root variant="destructive">
    <Alert.Title>Heads up!</Alert.Title>
    <Alert.Description class="font-normal">
      <p>Persistent browser storage is required to save your work.</p>
      <Button
        onclick={async () => {
          await navigator.storage.persist();
          havePersistence = true;
        }}
        variant="outline">Enable</Button
      >
    </Alert.Description>
  </Alert.Root>
{/if}
