import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Toggle } from "@/components/ui/toggle";
import { useEffect, useState } from "react";
import { useSnapshot } from "valtio";
import { Model, store, updateService } from "@/app/store";
import { Provider, Providers } from "@/app/providers";
import { RefreshCwIcon, SettingsIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function ModelConfig() {
  const [id, setId] = useState<string | null>(
    (store.services.length && store.services[0].id) || null
  );
  const services = useSnapshot(store.services);
  const service = services.find((s) => s.id === id);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // if snapshot updates and not id is set then set id to first service
  useEffect(() => {
    if (!id && services.length) {
      setId(services[0].id);
    }
  }, [services]);

  useEffect(() => {
    // reset error when service changes
    setError(null);
  }, [id]);

  function addService(provider: Provider) {
    const id = crypto.randomUUID();
    store.services.push({
      id,
      name: provider.name,
      providerId: provider.id,
      baseURL: provider.defaultBaseURL,
      apiKey: "",
      models: [],
    });
    setId(id);
  }

  async function fetchModels() {
    if (!service) {
      return;
    }
    setError(null);
    try {
      setLoading(true);
      const resp = await fetch("/api/models", {
        method: "POST",
        headers: {
          X_API_KEY: service.apiKey,
          ContentType: "application/json",
        },
        body: JSON.stringify({
          providerId: service.providerId,
          baseURL: service.baseURL,
        }),
      });
      if (!resp.ok) {
        setError(resp.statusText);
        return;
      }
      const models = (await resp.json())
        .map((model: Model) => {
          const existing = service.models.find((m) => m.id === model.id);
          if (existing) {
            return { ...existing, ...model };
          }
          return model;
        })
        .sort((a: Model, b: Model) => a.id.localeCompare(b.id));
      updateService(service.id, {
        models,
      });
    } finally {
      setLoading(false);
    }
  }

  function toggleVisible(model: Model) {
    if (!service) {
      return;
    }
    const $service = store.services.find((s) => s.id === id)!;
    const index = $service.models.findIndex((m) => m.id === model.id);
    $service.models[index].visible = !$service.models[index].visible;
  }

  return (
    <Dialog key="1">
      <DialogTrigger id="model-config-trigger" asChild>
        <Button variant="ghost">
          <SettingsIcon size={16} />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] max-h-screen overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configure AI Models</DialogTitle>
        </DialogHeader>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="default">
              <PlusIcon className="mr-2 h-4 w-4" /> Add Service
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {Providers.map((provider, index) => (
              <DropdownMenuItem
                key={index}
                onClick={() => addService(provider)}
              >
                <span>{provider.name}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {Object.values(services).length > 0 && (
          <div className="grid gap-4 py-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="service">AI Service</Label>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    if (!id) {
                      return;
                    }
                    store.services.splice(
                      store.services.findIndex((s) => s.id === id),
                      1
                    );
                    setId(null);
                  }}
                >
                  <TrashIcon className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </div>
              {Object.values(services).length > 0 && (
                <Select
                  value={service ? service.id : undefined}
                  onValueChange={(id) => setId(id)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a service" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Services</SelectLabel>
                      {Object.values(services).map((service, index) => (
                        <SelectItem key={index} value={service.id}>
                          {service.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              )}
            </div>
            <Separator />
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                value={service ? service.name : ""}
                id="name"
                placeholder="Enter service name"
                type="text"
                onChange={(event) =>
                  service &&
                  updateService(service.id, { name: event.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                value={service ? service.apiKey : ""}
                id="apiKey"
                placeholder="Enter your API key"
                type="password"
                onChange={(event) => {
                  service &&
                    updateService(service.id, { apiKey: event.target.value });
                }}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="baseURL">Base URL</Label>
              <Input
                value={service ? service.baseURL : ""}
                id="baseURL"
                placeholder="Enter API base URL"
                type="text"
                onChange={(event) =>
                  service &&
                  updateService(service.id, { baseURL: event.target.value })
                }
              />
            </div>
            <Button variant="outline" onClick={() => fetchModels()}>
              <RefreshCwIcon
                className={cn("mr-2 h-4 w-4", loading && "loading-icon")}
              />
              {service && service.models.length > 0 ? (
                <>Refresh Models</>
              ) : (
                <>Load Models</>
              )}
            </Button>
            {error && <Label className="text-red-500">{error}</Label>}
            {service && service.models.length > 0 && (
              <>
                <Separator />
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label>Models</Label>
                    <div className="flex justify-end">
                      <Button
                        className="p-1 text-sm"
                        variant="ghost"
                        onClick={() => {
                          const $service = store.services.find(
                            (s) => s.id === id
                          )!;
                          $service.models.forEach((m) => (m.visible = true));
                        }}
                      >
                        Show All
                      </Button>
                      <Button
                        className="p-1 text-sm"
                        variant="ghost"
                        onClick={() => {
                          const $service = store.services.find(
                            (s) => s.id === id
                          )!;
                          $service.models.forEach((m) => (m.visible = false));
                        }}
                      >
                        Hide All
                      </Button>
                    </div>
                  </div>

                  <div className="border rounded-lg w-full min-h-[200px] max-h-[calc(100vh-700px)] overflow-y-auto">
                    <Table>
                      <TableBody>
                        {service.models.map((model, index) => (
                          <TableRow
                            className={cn(
                              "cursor-pointer",
                              model.visible ? "" : "opacity-50"
                            )}
                            key={index}
                            onClick={() => toggleVisible(model)}
                          >
                            <TableCell className="p-1 pl-4 font-normal">
                              {model.id}
                            </TableCell>
                            <TableCell className="p-1">
                              <Toggle aria-label="Toggle Model Visibility" />
                            </TableCell>
                            <TableCell className="p-1">
                              <EyeIcon className="w-4 h-4" />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
                <DialogClose>
                  <Button variant="default">Save</Button>
                </DialogClose>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function EyeIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function PlusIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}

function TrashIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
  );
}
