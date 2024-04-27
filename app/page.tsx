"use client";
import { Header } from "@/components/header";
import { loadFromLocalStorage } from "@/app/store";
import { useEffect } from "react";
import { ResponseList } from "@/components/response-list";
import { EditorCard } from "@/components/editor-card";

export default function App() {
  useEffect(() => {
    console.log("loadFromLocalStorage");
    loadFromLocalStorage();
  }, []);

  return (
    <div className="flex min-h-screen  w-full flex-col bg-muted/40">
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
