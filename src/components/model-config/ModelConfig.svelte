<script lang="ts">
  import { Button } from "@/components/ui/button";
  import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
  import { db, type Service } from "@/store.svelte";
  import { type Provider } from "@/providers";
  import { SettingsIcon } from "lucide-svelte";
  import CreateAccount from "@/components/model-config/CreateAccount.svelte";
  import ListAccounts from "@/components/model-config/ListAccounts.svelte";
  import UpdateAccount from "@/components/model-config/UpdateAccount.svelte";
  import { DialogHeader } from "@/components/ui/dialog/index.js";

  let open = $state(false);

  type Route =
    | {
        name: "create";
      }
    | { name: "list" }
    | { name: "update"; service: Service };

  let route: Route = $state(db.services.length > 0 ? { name: "list" } : { name: "create" });

  function update(service: Service) {
    route = { name: "update", service };
  }

  function list() {
    route = { name: "list" };
  }

  function create() {
    route = { name: "create" };
  }

  // reset route when closed
  $effect(() => {
    if (!open) {
      route = db.services.length > 0 ? { name: "list" } : { name: "create" };
    }
  });

  function addService(provider: Provider) {
    const newId = crypto.randomUUID();
    db.services.push({
      id: newId,
      name: "",
      providerId: provider.id,
      baseURL: provider.defaultBaseURL,
      apiKey: "",
    });
    update(db.services.get(newId));
  }

  function deleteService(service: Service) {
    db.models.items
      .filter((m) => m.serviceId === service.id)
      .forEach((m) => {
        db.models.remove(m.id);
      });
    db.services.remove(service.id);
    list();
  }

  function switchService(service: Service) {
    update(service);
  }
</script>

<Button variant="ghost" onclick={() => (open = true)}>
  <!-- icon unexpectedly capturing on click so need both on the icon and the button -->
  <SettingsIcon onclick={() => (open = true)} size={16} />
</Button>
<Dialog bind:open>
  <DialogTrigger id="model-config-trigger"></DialogTrigger>
  <DialogContent class="max-h-screen overflow-y-auto sm:max-w-[425px]">
    <DialogHeader>
      {#if route.name === "create"}
        <DialogTitle>Select AI provider</DialogTitle>
      {:else if route.name === "list"}
        <DialogTitle>Your AI accounts</DialogTitle>
      {:else if route.name === "update"}
        <DialogTitle>Update AI account</DialogTitle>
      {/if}
    </DialogHeader>
    {#if route.name === "create"}
      <CreateAccount onSelect={addService} />
    {:else if route.name === "list"}
      <ListAccounts onAdd={() => create()} onSelect={switchService} />
    {:else if route.name === "update"}
      <UpdateAccount service={route.service} onBack={() => list()} onDelete={deleteService} />
    {/if}
  </DialogContent>
</Dialog>
