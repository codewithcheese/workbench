<script lang="ts">
  import { EllipsisVerticalIcon, FileIcon, PlusIcon, PocketKnifeIcon } from "lucide-svelte";
  import { Button } from "@/components/ui/button/index";
  import * as DropdownMenu from "@/components/ui/dropdown-menu/index";
  import * as Dialog from "@/components/ui/dialog/index";
  import { page } from "$app/stores";
  import { cn } from "$lib/cn";
  import { goto } from "$app/navigation";
  import DeleteDialog from "@/components/DeleteDialog.svelte";
  import PersistenceAlert from "@/components/PersistenceAlert.svelte";
  import { type Project } from "@/database/schema";
  import type { Projects } from "@/stores/projects.svelte";

  let { projects }: { projects: Projects } = $props();

  let projectId: string | undefined = $derived.by(() => {
    if ($page.url.pathname.startsWith("/project")) {
      return $page.params.id;
    }
  });

  let projectToDelete: Project | null = $state(null);
</script>

<div class="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
  <a href="/" class="flex flex-1 items-center gap-2 font-semibold">
    <PocketKnifeIcon class="h-6 w-6" />
    <span class="">Workbench</span>
  </a>
  <!--  <Button class="h-8 w-8 rounded-full p-1" variant="outline" onclick={() => downloadDatabase()}>-->
  <!--    <DatabaseBackupIcon class="text-gray-600" />-->
  <!--  </Button>-->
  <Button
    class="h-8 w-8 rounded-full p-1"
    variant="outline"
    onclick={async () => {
      const id = await projects.newProject();
      goto(`/project/${id}`);
    }}
  >
    <PlusIcon class="text-gray-600" />
  </Button>
</div>
<div class="flex-1">
  <nav class="grid items-start text-sm font-medium">
    <div class="p-2 pt-0">
      <PersistenceAlert />
    </div>
    <div
      class:bg-accent={$page.url.pathname.startsWith("/document")}
      class="group flex flex-row items-center px-4"
    >
      <Button
        href="/document"
        variant="ghost"
        class={cn(
          "w-full justify-start gap-2 overflow-x-hidden p-0 text-muted-foreground hover:bg-transparent",
          $page.url.pathname.startsWith("/document") && "text-primary",
        )}
      >
        <FileIcon
          class={cn(
            "h-4 w-4 text-gray-500",
            $page.url.pathname.startsWith("/document") && "text-primary",
          )}
        />
        Documents
      </Button>
    </div>
    <div class="mt-6 overflow-x-hidden">
      <h3 class="mb-2 overflow-hidden text-ellipsis break-all px-4 text-xs font-medium">
        Projects
      </h3>
      {#each projects.items.toReversed() as project (project.id)}
        <div
          class:bg-accent={project.id === projectId}
          class="group flex flex-row items-center overflow-x-hidden px-4"
        >
          <Button
            variant="ghost"
            href={`/project/${project.id}`}
            class={cn(
              "w-full justify-start p-0 text-muted-foreground hover:bg-transparent",
              project.id === projectId && "text-primary",
            )}
          >
            {project.name}
          </Button>
          <div class="flex flex-1"></div>
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild let:builder>
              <Button
                builders={[builder]}
                variant="ghost"
                class="w-6 p-0 opacity-0 group-hover:opacity-100"
              >
                <EllipsisVerticalIcon class="h-4 w-4 text-gray-500" /></Button
              >
            </DropdownMenu.Trigger>
            <DropdownMenu.Content align="end">
              <DropdownMenu.Item onclick={() => (projectToDelete = project)}
                >Delete</DropdownMenu.Item
              >
              <DropdownMenu.Item
                onclick={async () => {
                  const newId = await projects.duplicateProject(project.id);
                  await goto(`/project/${newId}`);
                }}>Duplicate</DropdownMenu.Item
              >
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        </div>
      {/each}
    </div>
  </nav>
</div>
{#if projectToDelete}
  <DeleteDialog
    name={projectToDelete.name}
    type="project"
    onConfirm={async () => {
      if (projectToDelete) {
        const nextId = await projects.removeProject(projectToDelete.id);
        await goto(`/project/${nextId}`);
      }
    }}
    onCancel={() => {
      projectToDelete = null;
    }}
  />
{/if}
