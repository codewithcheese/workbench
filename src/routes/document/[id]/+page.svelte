<script lang="ts">
  import Header from "@/routes/document/Header.svelte";
  import { db } from "@/store.svelte";
  import { goto } from "$app/navigation";
  import Form from "@/routes/document/Form.svelte";
  import { page } from "$app/stores";
  import Splash from "@/components/Splash.svelte";

  let document = $derived(db.documents.get($page.params.id));

  function submit(e: any) {
    e.preventDefault();
    goto(`/document`);
  }
</script>

{#if !document}
  <Splash>Document not found</Splash>
{:else}
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
{/if}
