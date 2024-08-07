<script lang="ts">
  import { Card, CardContent } from "@/components/ui/card";
  import CodeMirror from "svelte-codemirror-editor";
  import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
  import { languages } from "@codemirror/language-data";
  import {
    type DecorationSet,
    EditorView,
    keymap,
    ViewPlugin,
    ViewUpdate,
    WidgetType,
  } from "@codemirror/view";
  import { EditorState, Prec, RangeSetBuilder } from "@codemirror/state";
  import { autocompletion } from "@codemirror/autocomplete";
  import type { CompletionSource } from "@codemirror/autocomplete";
  import { Decoration } from "@codemirror/view";
  import { goto } from "$app/navigation";
  import { documentTable, type Chat, useDb } from "@/database";
  import { submitPrompt } from "../$data";
  import { store } from "$lib/store.svelte";
  import { eq, like } from "drizzle-orm";

  type Props = {
    chat: Chat;
    prompt: string;
    onChange: () => void;
  };
  let { chat, prompt = $bindable(""), onChange }: Props = $props();

  let docMentionRegex = /\[\[([^\]]|](?!]))*/g;

  class DocumentLinkWidget extends WidgetType {
    constructor(public id: string) {
      super();
    }
    toDOM() {
      const span = document.createElement("span");
      span.className = "document-icon";
      span.innerHTML =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-symlink"><path d="m10 18 3-3-3-3"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M4 11V4a2 2 0 0 1 2-2h9l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h7"/></svg>';
      span.onclick = () => {
        goto(`/document/${this.id}`);
      };
      return span;
    }
  }

  class DocumentCreateWidget extends WidgetType {
    constructor(public name: string) {
      super();
    }
    toDOM() {
      const span = document.createElement("span");
      span.className = "document-icon";
      span.innerHTML =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-plus-2"><path d="M4 22h14a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v4"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M3 15h6"/><path d="M6 12v6"/></svg>';
      span.onclick = () => {
        goto(`/document/new?name=${encodeURIComponent(this.name)}`);
      };
      return span;
    }
  }

  const documentHighlighter = ViewPlugin.fromClass(
    class {
      view: EditorView;
      decorations: DecorationSet = new RangeSetBuilder<Decoration>().finish();

      constructor(view: EditorView) {
        this.view = view;
        this.buildDecorations(view.state);
      }
      destroy() {}
      update(update: ViewUpdate) {
        if (update.docChanged) {
          this.buildDecorations(update.state);
        }
      }

      async buildDecorations(state: EditorState) {
        let builder = new RangeSetBuilder<Decoration>();
        const re = docMentionRegex;
        let match: RegExpExecArray | null;
        const docStr = state.doc.toString();
        while ((match = re.exec(docStr)) !== null) {
          // check if document exists
          const name = match![0].slice(2);
          const exists = await useDb().query.documentTable.findFirst({
            where: eq(documentTable.name, name),
          });
          // const exists = db.documents.items.find((d) => d.name === match![1]);
          builder.add(
            match.index,
            match.index + match[0].length + 2,
            Decoration.mark({
              attributes: { class: exists ? "document-mention" : "document-missing" },
            }),
          );
          builder.add(
            match.index + match[0].length + 2,
            match.index + match[0].length + 2,
            Decoration.widget({
              widget: exists ? new DocumentLinkWidget(exists.id) : new DocumentCreateWidget(name),
              side: 1, // Render after the text
              name: match[1],
              type: "document-link",
            }),
          );
        }
        this.decorations = builder.finish();
      }
    },
    {
      decorations: (v) => v.decorations,
    },
  );

  const documentCompletion: CompletionSource = async (context) => {
    const word = context.matchBefore(/\[\[([^\]]|](?!]))*/);
    if (word && word.from < word.to) {
      const docs = await useDb().query.documentTable.findMany({
        where: like(documentTable.name, `${word.text.slice(2)}%`),
      });
      const mentions = docs.map((d) => ({ label: d.name, type: "document" }));
      return {
        from: word.from + 2,
        options: mentions.map((mention) => ({
          label: mention.label,
          apply: `${mention.label}`,
        })),
        filter: true,
      };
    }
    return null;
  };

  const extensions = [
    Prec.highest(
      keymap.of([
        {
          key: "Ctrl-Enter",
          run: () => {
            submitPrompt(chat, store.selected.modelId).catch(console.error);
            return true;
          },
        },
      ]),
    ),
    EditorView.lineWrapping,
    documentHighlighter,
    autocompletion({
      activateOnTyping: true,
      override: [documentCompletion],
    }),
    markdown({
      base: markdownLanguage,
      codeLanguages: languages,
    }),
  ];

  // todo save prompt on change
</script>

<div>
  <Card class="overflow-y-auto">
    <CardContent class="p-0">
      <CodeMirror class="w-full" bind:value={prompt} {extensions} on:change={onChange} />
    </CardContent>
  </Card>
</div>

<style lang="postcss">
  :global(.document-mention) {
    @apply text-purple-700 underline;
  }

  :global(.document-missing) {
    @apply text-red-700 underline;
  }

  :global(.document-icon svg) {
    display: inline !important;
    @apply h-4 w-4 text-gray-500 hover:text-gray-700;
    cursor: pointer;
  }
</style>
