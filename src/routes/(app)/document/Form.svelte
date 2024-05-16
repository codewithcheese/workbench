<script lang="ts">
  import { Button } from "@/components/ui/button";
  import { Input } from "@/components/ui/input";
  import { Label } from "@/components/ui/label";
  import { EditorView } from "@codemirror/view";
  import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
  import { languages } from "@codemirror/language-data";
  import CodeMirror from "svelte-codemirror-editor";
  import { nanoid } from "nanoid";

  const extensions = [
    EditorView.lineWrapping,
    markdown({
      base: markdownLanguage,
      codeLanguages: languages,
    }),
  ];

  type Props = {
    onSubmit: (e: any) => void;
    name: string;
    description: string;
    content: string;
  };

  let {
    onSubmit,
    name = $bindable(""),
    description = $bindable(""),
    content = $bindable(""),
  }: Props = $props();
</script>

<form class="max-w-[100ch] space-y-6" onsubmit={onSubmit}>
  <div class="space-y-2">
    <Label for="name">Name</Label>
    <Input bind:value={name} id="name" placeholder="Enter name" type="text" />
    <p class="text-xs text-muted-foreground">Name used to identify the document in a prompt.</p>
  </div>
  <div class="space-y-2">
    <Label for="name">Description</Label>
    <Input bind:value={description} id="description" placeholder="Enter description" type="text" />
    <p class="text-xs text-muted-foreground">
      Description to keep track of which is which. Optional.
    </p>
  </div>
  <div class="space-y-2">
    <Label for="name">Content</Label>
    <CodeMirror class="rounded border border-gray-200" bind:value={content} {extensions} />
  </div>
  <div class="space-y-2">
    <Button type="submit">Submit</Button>
  </div>
</form>
