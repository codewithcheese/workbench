"use client";
import { Header } from "@/components/header";
import { store, useLocalStorage } from "@/app/store";
import { ResponseList } from "@/components/response-list";
import { EditorCard } from "@/components/editor-card";
import { Splash } from "@/components/splash";
import { useSnapshot } from "valtio";
import { Button } from "@/components/ui/button";
import { LoaderCircleIcon } from "lucide-react";

export default function App() {
  const { pending } = useLocalStorage();
  const services = useSnapshot(store.services);

  if (pending) {
    return (
      <Splash>
        <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
          <LoaderCircleIcon size={24} className="loading-icon" />
        </p>
        <p>Loading data...</p>
      </Splash>
    );
  }

  return (
    <div className="flex min-h-screen  w-full flex-col bg-muted/50">
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-4 sm:pr-4">
        <Header />
        {services.length > 0 ? (
          <>
            <div className="grid grid-cols-2 gap-4 max-h-[calc(100vh-100px)]">
              <div>
                <EditorCard />
              </div>
              <div>
                <ResponseList />
              </div>
            </div>
          </>
        ) : (
          <Splash>
            <p>Setup your AI services to get started</p>
            <Button
              onClick={() =>
                document.getElementById("model-config-trigger")?.click()
              }
            >
              Start
            </Button>
          </Splash>
        )}
      </div>
    </div>
  );
}
