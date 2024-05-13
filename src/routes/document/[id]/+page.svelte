<script lang="ts">
  import Header from "@/routes/document/Header.svelte";
  import { goto } from "$app/navigation";
  import Form from "@/routes/document/Form.svelte";
  import { documentTable } from "@/database/schema";
  import { driz } from "@/database/client";
  import { eq } from "drizzle-orm";
  import { toast } from "svelte-french-toast";

  let { data } = $props();
  let document = $derived(data.document);

  async function submit(e: any) {
    e.preventDefault();
    try {
      await driz
        .update(documentTable)
        .set({
          name: document.name,
          description: document.description,
          content: document.content,
        })
        .where(eq(documentTable.id, document.id));
      goto(`/document`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Unknown error");
    }
  }
</script>

<Header />
<main class="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
  <div class="flex items-center">
    <h1 class="flex-1 text-lg font-semibold md:text-xl">Edit document</h1>
  </div>
  <Form
    bind:name={document.name}
    bind:description={document.description}
    bind:content={document.content}
    onSubmit={submit}
  />
</main>
