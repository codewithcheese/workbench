<script lang="ts">
  import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
  import CreateAccount from "./CreateAccount.svelte";
  import SelectAccount from "./SelectAccount.svelte";
  import UpdateAccount from "./UpdateAccount.svelte";
  import { DialogHeader } from "@/components/ui/dialog/index.js";
  import { goto, onNavigate } from "$app/navigation";
  import { page } from "$app/stores";
  import { toast } from "svelte-french-toast";
  // import type { ServiceView } from "@/stores/services.svelte";
  import { addService, deleteService } from "@/database/mutations";
  import { fetch } from "@sveltejs/kit";

  let { data } = $props();
  let services = $derived(data.services);
  $inspect(services);

  const open = true;

  type Route = { name: "create" } | { name: "select" } | { name: "update"; id: string };

  let route: Route = $state({ name: "select" });
</script>

<Dialog
  {open}
  onOpenChange={(isOpen) => {
    if (!isOpen) {
      goto(`/project/${$page.params.id}`);
    }
  }}
>
  <DialogTrigger id="model-config-trigger"></DialogTrigger>
  <DialogContent class="max-h-screen overflow-y-auto sm:max-w-[425px]">
    <DialogHeader>
      {#if route.name === "create"}
        <DialogTitle>Select AI provider</DialogTitle>
      {:else if route.name === "select"}
        <DialogTitle>Your AI accounts</DialogTitle>
      {:else if route.name === "update"}
        <DialogTitle>Update AI account</DialogTitle>
      {/if}
    </DialogHeader>
    {#if route.name === "create"}
      <CreateAccount
        onSelect={async (provider) => {
          try {
            const service = await addService(provider);
            route = { name: "update", id: service.id };
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Unknown error");
          }
        }}
      />
    {:else if route.name === "select"}
      <SelectAccount
        {services}
        onAdd={() => (route = { name: "create" })}
        onSelect={(id) => (route = { name: "update", id })}
      />
    {:else if route.name === "update"}
      <UpdateAccount
        {services}
        id={route.id}
        onBack={() => (route = { name: "select" })}
        onDelete={(id) => {
          deleteService(id);
          route = { name: "select" };
        }}
      />
    {/if}
  </DialogContent>
</Dialog>
