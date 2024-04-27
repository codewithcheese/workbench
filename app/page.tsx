"use client";
import CodeMirror, { EditorView, keymap, Prec } from "@uiw/react-codemirror";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { languages } from "@codemirror/language-data";
import { Header } from "@/components/header";
import { ref, useSnapshot } from "valtio";
import { loadFromLocalStorage, store } from "@/app/store";
import { useCallback, useEffect, useMemo } from "react";
import { Response } from "@/components/response";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function App() {
  const { responses, prompt } = useSnapshot(store);

  useEffect(() => {
    loadFromLocalStorage();
  }, []);

  function submitPrompt() {
    if (!store.selected.service || !store.selected.modelId) {
      // TODO: show error
      return;
    }
    store.responses.unshift({
      id: crypto.randomUUID(),
      // message controlled by useChat treat as ref in store
      messages: ref([
        { id: crypto.randomUUID(), role: "user", content: prompt },
      ]),
      modelId: store.selected.modelId,
      serviceName: store.selected.service.name,
    });
  }

  const onChange = useCallback(
    (value: string) => (store.prompt = value),
    [store]
  );

  const extensions = useMemo(() => {
    return [
      Prec.highest(
        keymap.of([
          {
            key: "Ctrl-Enter",
            run: () => {
              submitPrompt();
              return true;
            },
          },
        ])
      ),
      EditorView.lineWrapping,
      markdown({
        base: markdownLanguage,
        codeLanguages: languages,
      }),
    ];
  }, [submitPrompt]);

  return (
    <div className="flex min-h-screen  w-full flex-col bg-muted/40">
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-4 sm:pr-4">
        <Header onSubmit={submitPrompt} />
        <div className="grid grid-cols-2 gap-4 max-h-[calc(100vh-100px)]">
          <div>
            <Card>
              <CardContent className="p-0 overflow-y-auto prose">
                <CodeMirror
                  value={prompt}
                  onChange={onChange}
                  extensions={extensions}
                />
              </CardContent>
            </Card>
          </div>
          <div>
            <div className="space-y-2">
              {responses.map((response, index) => (
                <Response key={response.id} index={index} {...response} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
