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
  import { aiAccountTable, aiModelTable, aiServiceTable, invalidateModel, useDb } from "@/database";
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
    await useDb().delete(aiAccountTable).where(eq(aiAccountTable.id, data.aiAccount.id));
    await invalidateModel(aiAccountTable, data.aiAccount);
    toast.success("Account deleted");
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
        const provider = await useDb().query.aiServiceTable.findFirst({
          where: eq(aiServiceTable.id, form.data.aiServiceId),
        });
        if (!provider) {
          setError(form, "aiServiceId", `Provider for ${form.data.aiServiceId} not found`);
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
        const aiAccountId = data.aiAccount.id;
        await useDb().transaction(async (tx) => {
          console.log("updating account", form.data, aiAccountId);
          await tx.update(aiAccountTable).set(form.data).where(eq(aiAccountTable.id, aiAccountId));
          // remove models that no longer exist
          const models = (await resp.json()) as any[];
          await tx.delete(aiModelTable).where(
            and(
              eq(aiModelTable.aiAccountId, aiAccountId),
              notInArray(
                aiModelTable.name,
                models.map((m) => m.name),
              ),
            ),
          );
          for (const model of models) {
            await tx
              .insert(aiModelTable)
              .values({ id: nanoid(10), name: model.name, visible: 1, aiAccountId })
              .onConflictDoNothing({
                target: [aiModelTable.name, aiModelTable.aiAccountId],
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
      label: data.aiServices.find((s) => s.id === $form.aiServiceId)?.name || "",
      value: $form.aiServiceId,
    };
  });
</script>

<form use:enhance method="post">
  <Card>
    <CardHeader>
      <div class="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Your {data.aiAccount.aiService.name} account</CardTitle>
          <CardDescription>Update your account settings.</CardDescription>
        </div>
      </div>
    </CardHeader>
    <CardContent>
      <div class="flex max-w-xl flex-col gap-4">
        <FormField form={formHandle} name="aiServiceId">
          <FormControl let:attrs>
            <FormLabel>AI Service</FormLabel>
            <Select
              selected={selectedAiService}
              onSelectedChange={(selected) => {
                if (selected) {
                  $form.aiServiceId = selected.value;
                }
              }}
            >
              <SelectTrigger {...attrs}>
                <SelectValue placeholder="Select an AI service" />
              </SelectTrigger>
              <SelectContent>
                {#each data.aiServices as service (service.id)}
                  <SelectItem value={service.id}>{service.name}</SelectItem>
                {/each}
              </SelectContent>
            </Select>
          </FormControl>
          <FormFieldErrors />
        </FormField>
        <FormField form={formHandle} name="name">
          <FormControl let:attrs>
            <FormLabel>Account name</FormLabel>
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
        <CardTitle>Delete account</CardTitle>
        <CardDescription>Delete this account's API key and models configuration.</CardDescription>
      </div>
    </div>
  </CardHeader>

  <CardContent>
    <Button variant="destructive" onclick={handleDelete}>Delete</Button>
  </CardContent>
</Card>
