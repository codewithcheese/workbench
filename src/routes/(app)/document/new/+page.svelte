<script lang="ts">
  import { EditorView } from "@codemirror/view";
  import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
  import { languages } from "@codemirror/language-data";
  import { nanoid } from "nanoid";
  import { goto } from "$app/navigation";
  import Form from "../Form.svelte";
  import { page } from "$app/stores";
  import { documentTable } from "@/database/schema";
  import { useDb } from "@/database/client";

  let queryParams = $state($page.url.searchParams);
  let name = $state(queryParams.get("name") ?? "");
  let content = $state("");
  let description = $state("");

  const extensions = [
    EditorView.lineWrapping,
    markdown({
      base: markdownLanguage,
      codeLanguages: languages,
    }),
  ];

  async function submit(e: any) {
    e.preventDefault();
    await useDb()
      .insert(documentTable)
      .values({
        id: nanoid(10),
        name,
        description,
        content,
      });
    await goto(`/document`);
  }
</script>

<main class="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
  <div class="flex items-center">
    <h1 class="flex-1 text-lg font-semibold md:text-xl">New document</h1>
  </div>
  <Form bind:name bind:content bind:description onSubmit={submit} />
</main>
