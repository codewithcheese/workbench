"use client";
import { Header } from "@/components/header";
import { useLocalStorage } from "@/app/store";
import { ResponseList } from "@/components/response-list";
import { EditorCard } from "@/components/editor-card";
import { Splash } from "@/components/splash";

export default function App() {
  const { pending } = useLocalStorage();

  if (pending) {
    return <Splash message="Loading data..." />;
  }

  return (
    <div className="flex min-h-screen  w-full flex-col bg-muted/50">
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-4 sm:pr-4">
        <Header />
        <div className="grid grid-cols-2 gap-4 max-h-[calc(100vh-100px)]">
          <div>
            <EditorCard />
          </div>
          <div>
            <ResponseList />
          </div>
        </div>
      </div>
    </div>
  );
}
