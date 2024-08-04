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
  import { formSchema } from "../$data";
  import {
    FormButton,
    FormControl,
    FormField,
    FormFieldErrors,
    FormLabel,
  } from "@/components/ui/form";
  import { keyTable, modelTable, serviceTable, invalidateModel, useDb } from "@/database";
  import { and, eq, notInArray } from "drizzle-orm";
  import { nanoid } from "nanoid";
  import { goto, invalidate } from "$app/navigation";
  import { LoaderCircle, TriangleAlertIcon } from "lucide-svelte";
  import { cn } from "$lib/cn";
  import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
  import { toast } from "svelte-french-toast";
  import { route } from "$lib/route";

  let { data } = $props();

  async function handleDelete() {
    await useDb().delete(keyTable).where(eq(keyTable.id, data.key.id));
    await invalidateModel(keyTable, data.key);
    toast.success("Key deleted");
    await goto(route(`/settings`));
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
        const provider = await useDb().query.serviceTable.findFirst({
          where: eq(serviceTable.id, form.data.serviceId),
        });
        if (!provider) {
          setError(form, "serviceId", `Provider for ${form.data.serviceId} not found`);
          return;
        }
        // fetch models
        const resp = await fetch("/api/models", {
          method: "POST",
          headers: {
            Authorization: form.data.apiKey,
            ContentType: "application/json",
          },
          body: JSON.stringify({
            providerId: provider.id,
            baseURL: form.data.baseURL,
          }),
        });
        if (!resp.ok) {
          // if failed to fetch models, ask user to update API key
          setError(form, "apiKey", resp.statusText);
          return;
        }
        // update account and update models
        const keyId = data.key.id;
        await useDb().transaction(async (tx) => {
          console.log("updating account", form.data, keyId);
          await tx.update(keyTable).set(form.data).where(eq(keyTable.id, keyId));
          // remove models that no longer exist
          const models = (await resp.json()) as any[];
          await tx.delete(modelTable).where(
            and(
              eq(modelTable.keyId, keyId),
              notInArray(
                modelTable.name,
                models.map((m) => m.name),
              ),
            ),
          );
          for (const model of models) {
            await tx
              .insert(modelTable)
              .values({ id: nanoid(10), name: model.name, visible: 1, keyId })
              .onConflictDoNothing({
                target: [modelTable.name, modelTable.keyId],
              });
          }
        });
        await invalidate("view:account");
        toast.success("Account updated");
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
  <CardHeader>
    <div class="flex flex-row items-center justify-between">
      <div>
        <CardTitle>{data.key.service.name} models</CardTitle>
        <CardDescription>Show or hide models displayed in the chat interface.</CardDescription>
      </div>
    </div>
  </CardHeader>

  <CardContent>
    <Button variant="destructive" onclick={handleDelete}>Delete</Button>
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
