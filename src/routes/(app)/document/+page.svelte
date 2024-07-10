<script lang="ts">
  import * as Table from "@/components/ui/table/index";
  import * as Dialog from "@/components/ui/dialog/index";
  import { Button } from "@/components/ui/button/index";
  import { PlusIcon, TrashIcon } from "lucide-svelte";
  import { goto, invalidateAll } from "$app/navigation";
  import DeleteDialog from "@/components/DeleteDialog.svelte";
  import { eq } from "drizzle-orm";
  import { documentTable, type Document } from "@/database/schema";
  import { toast } from "svelte-french-toast";
  import { useDb } from "@/database/client";
  import { invalidateModel } from "@/database";
  import { route } from "$lib/route";

  let { data } = $props();

  let confirmDelete: Document | null = $state(null);

  async function deleteDocument(document: Document) {
    try {
      await useDb().delete(documentTable).where(eq(documentTable.id, document.id));
      await invalidateModel(documentTable, document);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Unknown error");
    }
    confirmDelete = null;
  }
</script>

<main class="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
  <div class="flex items-center">
    <h1 class="flex-1 text-lg font-semibold md:text-2xl">Documents</h1>
    <Button href="/document/new" variant="default">
      <PlusIcon class="mr-2 h-4 w-4" />
      Add document
    </Button>
  </div>
  {#if data.documents.length === 0}
    <div class="flex flex-col gap-1">
      <h3 class="text-lg font-semibold tracking-tight">You have no documents</h3>
      <p class="text-sm text-muted-foreground">
        You can start adding documents by clicking the + Add document button.
      </p>
    </div>
  {:else}
    <Table.Root class="overflow-y-auto">
      <Table.Header>
        <Table.Cell class="p-2 font-semibold">Name</Table.Cell>
        <Table.Cell class="p-2 font-semibold">Description</Table.Cell>
        <Table.Cell></Table.Cell>
      </Table.Header>
      <Table.Body>
        {#each data.documents as document (document.id)}
          <Table.Row class="group cursor-pointer text-muted-foreground hover:text-primary">
            <Table.Cell
              onclick={() => {
                console.log("name clicked", document.name);
                goto(route(`/document/[id]`, { id: document.id }));
              }}
              class="p-2 "
            >
              {document.name}
            </Table.Cell>
            <Table.Cell
              onclick={() => {
                console.log("description clicked", document.description);
                goto(route(`/document/[id]`, { id: document.id }));
              }}
              class="p-2 "
            >
              {document.description}
            </Table.Cell>
            <Table.Cell class="p-2">
              <Button
                onclick={() => {
                  confirmDelete = document;
                }}
                variant="ghost"
                class="p-1 px-4 text-sm opacity-0 group-hover:opacity-100"
              >
                <TrashIcon class="h-4 w-4" />
              </Button>
            </Table.Cell>
          </Table.Row>
        {/each}
      </Table.Body>
    </Table.Root>
  {/if}
</main>
{#if confirmDelete}
  <DeleteDialog
    name={confirmDelete.name}
    type="document"
    onConfirm={() => confirmDelete && deleteDocument(confirmDelete)}
    onCancel={() => {
      console.log("cancel");
      confirmDelete = null;
    }}
  />
{/if}
