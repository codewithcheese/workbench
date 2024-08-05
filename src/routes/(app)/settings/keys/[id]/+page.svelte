<script lang="ts">
  import { Button } from "@/components/ui/button/index.js";
  import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card";
  import { Input } from "@/components/ui/input/index.js";
  import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select";
  import { setError, superForm } from "sveltekit-superforms";
  import { zodClient } from "sveltekit-superforms/adapters";
  import {
    fetchModels,
    formSchema,
    refreshModels,
    toggleAllVisible,
    toggleVisible,
  } from "../$data";
  import {
    FormButton,
    FormControl,
    FormField,
    FormFieldErrors,
    FormLabel,
  } from "@/components/ui/form";
  import { invalidateModel, keyTable, serviceTable, useDb } from "@/database";
  import { eq } from "drizzle-orm";
  import { goto, invalidate } from "$app/navigation";
  import { EyeIcon, LoaderCircle, RefreshCwIcon, TriangleAlertIcon } from "lucide-svelte";
  import { cn } from "$lib/cn";
  import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
  import { toast } from "svelte-french-toast";
  import { route } from "$lib/route";
  import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
  import { Toggle } from "@/components/ui/toggle";

  let { data } = $props();

  async function handleDelete() {
    await useDb().delete(keyTable).where(eq(keyTable.id, data.key.id));
    await invalidateModel(keyTable, data.key);
    toast.success("Key deleted");
    await goto(route(`/settings/keys`));
  }

  const formHandle = superForm(data.form, {
    SPA: true,
    validators: zodClient(formSchema),
    resetForm: false,
    onUpdate: async ({ form }) => {
      if (!form.valid) {
        return;
      }
      try {
        // query provider
        const service = await useDb().query.serviceTable.findFirst({
          where: eq(serviceTable.id, form.data.serviceId),
          with: { sdk: true },
        });
        if (!service) {
          setError(form, "serviceId", `Service for ${form.data.serviceId} not found`);
          return;
        }
        // fetch models
        const resp = await fetchModels(
          form.data.apiKey,
          form.data.baseURL,
          service.sdk.id,
          service.id,
        );
        if (!resp.ok) {
          // if failed to fetch models, ask user to update API key
          setError(form, "apiKey", resp.statusText);
          return;
        }
        // update account and update models
        const keyId = data.key.id;
        await useDb().transaction(async (tx) => {
          await tx.update(keyTable).set(form.data).where(eq(keyTable.id, keyId));
          const models = (await resp.json()) as any[];
          await refreshModels(tx, keyId, models);
        });
        await invalidateModel(keyTable, data.key);
        toast.success("Key updated");
        return form;
      } catch (e) {
        setError(form, "", e instanceof Error ? e.message : "Unknown error");
      }
    },
  });

  let { form, enhance, submitting, allErrors } = formHandle;
  let selectedAiService = $derived.by(() => {
    return {
      label: data.services.find((s) => s.id === $form.serviceId)?.name || "",
      value: $form.serviceId,
    };
  });

  async function handleRefreshModels() {
    await useDb().transaction(async (tx) => {
      await refreshModels(tx, data.key.id, data.key.models);
    });
    toast.success("Models refreshed");
    await invalidateModel(keyTable, data.key);
  }
</script>

<form use:enhance method="post">
  <Card>
    <CardHeader>
      <div class="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Your {data.key.service.name} key</CardTitle>
          <CardDescription>Update your key.</CardDescription>
        </div>
      </div>
    </CardHeader>
    <CardContent>
      <div class="flex max-w-xl flex-col gap-4">
        <FormField form={formHandle} name="serviceId">
          <FormControl let:attrs>
            <FormLabel>AI Service</FormLabel>
            <Select
              selected={selectedAiService}
              onSelectedChange={(selected) => {
                if (selected) {
                  $form.serviceId = selected.value;
                }
              }}
            >
              <SelectTrigger {...attrs}>
                <SelectValue placeholder="Select an AI service" />
              </SelectTrigger>
              <SelectContent>
                {#each data.services as service (service.id)}
                  <SelectItem image="/icons/{service.id}-16x16.png" value={service.id}>
                    {service.name}
                  </SelectItem>
                {/each}
              </SelectContent>
            </Select>
          </FormControl>
          <FormFieldErrors />
        </FormField>
        <FormField form={formHandle} name="name">
          <FormControl let:attrs>
            <FormLabel>Key name</FormLabel>
            <Input {...attrs} bind:value={$form.name} />
          </FormControl>
          <FormFieldErrors />
        </FormField>
        <FormField form={formHandle} name="apiKey">
          <FormControl let:attrs>
            <FormLabel>API Key</FormLabel>
            <Input type="password" {...attrs} bind:value={$form.apiKey} />
          </FormControl>
          <FormFieldErrors />
        </FormField>
        <FormField form={formHandle} name="baseURL">
          <FormControl let:attrs>
            <FormLabel>Base URL</FormLabel>
            <Input
              placeholder="Leave blank to use default"
              type="text"
              {...attrs}
              bind:value={$form.baseURL}
            />
          </FormControl>
          <FormFieldErrors />
        </FormField>
        {#each $allErrors as error}
          {#if error.path === "_errors"}
            {#each error.messages as message}
              <Alert variant="destructive">
                <TriangleAlertIcon class="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            {/each}
          {/if}
        {/each}
      </div>
    </CardContent>
    <CardFooter>
      <FormButton disabled={$submitting}>
        <LoaderCircle class={cn("mr-2 h-4 w-4 animate-spin", !$submitting && "hidden")} />
        {$submitting ? "Updating..." : "Update"}
      </FormButton>
    </CardFooter>
  </Card>
</form>
<Card>
  <CardHeader class="pb-0">
    <div class="flex flex-row items-center justify-between">
      <div>
        <CardTitle>{data.key.service.name} models</CardTitle>
        <CardDescription>Show or hide models displayed in the chat interface.</CardDescription>
      </div>
      <Button variant="outline" onclick={handleRefreshModels}>
        <RefreshCwIcon class={cn("mr-2 h-4 w-4", false && "loading-icon")} />
        Refresh Models
      </Button>
    </div>
    <div class="flex justify-end gap-1">
      <Button
        class="p-2 text-sm underline"
        variant="ghost"
        onclick={async () => {
          await toggleAllVisible(data.key, 1);
        }}
      >
        Show All
      </Button>
      <Button
        class="p-2 text-sm underline"
        variant="ghost"
        onclick={async () => {
          await toggleAllVisible(data.key, 0);
        }}
      >
        Hide All
      </Button>
    </div>
  </CardHeader>

  <CardContent>
    {#if data.key.models.length > 0}
      <div class="w-full">
        <Table>
          <TableBody>
            {#each data.key.models as model (model.id)}
              <TableRow
                class={cn("cursor-pointer", model.visible === 1 ? "" : "opacity-50")}
                onclick={() => toggleVisible(data.key, model)}
              >
                <TableCell class="p-1 pl-4 font-normal">{model.name}</TableCell>
                <TableCell class="p-1">
                  <Toggle aria-label="Toggle Model Visibility" />
                </TableCell>
                <TableCell class="p-1">
                  <EyeIcon class="h-4 w-4" />
                </TableCell>
              </TableRow>
            {/each}
          </TableBody>
        </Table>
      </div>
    {/if}
  </CardContent>
</Card>
<Card>
  <CardHeader>
    <div class="flex flex-row items-center justify-between">
      <div>
        <CardTitle>Delete key</CardTitle>
        <CardDescription>Delete this API key and models configuration.</CardDescription>
      </div>
    </div>
  </CardHeader>

  <CardContent>
    <Button variant="destructive" onclick={handleDelete}>Delete</Button>
  </CardContent>
</Card>
