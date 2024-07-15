<script lang="ts">
  import { toast } from "svelte-french-toast";
  import {
    $createParagraphNode as createParagraphNode,
    $createTextNode as createTextNode,
    $getRoot as getRoot,
    COMMAND_PRIORITY_NORMAL,
    createEditor,
    type CreateEditorArgs,
    KEY_DOWN_COMMAND,
    type LexicalEditor,
  } from "lexical";
  import { onMount } from "svelte";
  import { mergeRegister } from "@lexical/utils";
  import { createEmptyHistoryState, registerHistory } from "@lexical/history";
  import { registerPlainText } from "@lexical/plain-text";

  type Props = {
    id: string;
    content: string;
    onKeyPress?: (event: KeyboardEvent) => boolean;
  };
  let { id, content = $bindable(""), onKeyPress }: Props = $props();

  const config: CreateEditorArgs = {
    namespace: `editor-${id}`,
    nodes: [],
    onError: (error: Error) => {
      toast.error(error.message);
    },
    theme: {},
  };

  let editorRef: HTMLDivElement;
  let editor: LexicalEditor = createEditor(config);

  onMount(() => {
    editor.setRootElement(editorRef);
    editor.update(() => {
      const root = getRoot();
      root.clear();
      root.append(createParagraphNode().append(createTextNode(content)));
    });
    mergeRegister(
      registerPlainText(editor),
      registerHistory(editor, createEmptyHistoryState(), 300),
      editor.registerCommand(
        KEY_DOWN_COMMAND,
        (event: KeyboardEvent) => {
          return onKeyPress ? onKeyPress(event) : false;
        },
        COMMAND_PRIORITY_NORMAL,
      ),
    );
    editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const root = getRoot();
        content = root.getTextContent();
      });
    });
  });
</script>

<div class="focus:outline-none" bind:this={editorRef} contenteditable="true"></div>
