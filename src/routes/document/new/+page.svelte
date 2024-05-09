<script lang="ts">
  import Header from "@/routes/document/Header.svelte";
  import { db } from "@/store.svelte";
  import { EditorView } from "@codemirror/view";
  import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
  import { languages } from "@codemirror/language-data";
  import { nanoid } from "nanoid";
  import { goto } from "$app/navigation";
  import Form from "@/routes/document/Form.svelte";

  let name = $state("");
  let content = $state("");
  let description = $state("");

  const extensions = [
    EditorView.lineWrapping,
    markdown({
      base: markdownLanguage,
      codeLanguages: languages,
    }),
  ];

  function submit(e: any) {
    e.preventDefault();
    db.documents.push({
      id: nanoid(10),
      name,
      content,
      description,
      data: null,
    });
    goto(`/document`);
  }
</script>

<Header />
<main class="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
  <div class="flex items-center">
    <h1 class="flex-1 text-lg font-semibold md:text-xl">New document</h1>
  </div>
  <Form bind:name bind:content bind:description onSubmit={submit} />
</main>
