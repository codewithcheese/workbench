import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  loadServices,
  addService,
  deleteService,
  updateService,
  replaceModels,
  toggleVisible,
  toggleAllVisible,
} from "./$data";
import Database from "better-sqlite3";
import { type BetterSQLite3Database, drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "@/database/schema";
import { runMigrations } from "@/database/migrator";
import { eq } from "drizzle-orm";
import { invalidate } from "$app/navigation";
import { nanoid } from "nanoid";

let sqlite: Database.Database;
let db: BetterSQLite3Database<typeof schema>;

beforeEach(async () => {
  // Set up database
  sqlite = new Database(":memory:");
  db = drizzle(sqlite, { schema });

  // Set up mocks
  vi.mock("$app/navigation", () => ({
    invalidate: vi.fn(),
  }));

  vi.mock("nanoid", () => ({
    nanoid: vi.fn(() => "mockedNanoId"),
  }));

  // Mock the useDb function and other imports
  vi.mock("@/database/client", () => ({
    useDb: vi.fn(() => db),
  }));

  await runMigrations(true);

  // Insert test data
  await db.insert(schema.keyTable).values([
    {
      id: "service1",
      name: "Test Service",
      aiServiceId: "aiService1",
      baseURL: "https://api.test.com",
      apiKey: "test-api-key",
    },
  ]);

  await db.insert(schema.modelTable).values([
    { id: "model1", serviceId: "service1", name: "Test Model 1", visible: 1 },
    { id: "model2", serviceId: "service1", name: "Test Model 2", visible: 0 },
  ]);
});

afterEach(() => {
  sqlite.close();
  vi.restoreAllMocks();
});

describe("loadServices", () => {
  it("should load all services with their models", async () => {
    const services = await loadServices();
    expect(services).toHaveLength(1);
    expect(services[0].id).toBe("service1");
    expect(services[0].models).toHaveLength(2);
  });
});

describe("addService", () => {
  it("should add a new service", async () => {
    const provider = {
      id: "newProvider",
      name: "New Provider",
      defaultBaseURL: "https://api.newprovider.com",
    };
    const newService = await addService(provider);
    expect(newService.id).toBe("mockedNanoId");
    expect(newService.providerId).toBe("newProvider");
    expect(invalidate).toHaveBeenCalledWith("view:services");
  });
});

describe("deleteService", () => {
  it("should delete a service and its models", async () => {
    const service = {
      id: "service1",
      name: "Test Service",
      providerId: "provider1",
      baseURL: "https://api.test.com",
      apiKey: "test-api-key",
      createdAt: new Date().toISOString(),
    };
    await deleteService(service);
    const remainingServices = await db.query.keyTable.findMany();
    const remainingModels = await db.query.modelTable.findMany();
    expect(remainingServices).toHaveLength(0);
    expect(remainingModels).toHaveLength(0);
  });
});

describe("updateService", () => {
  it("should update a service", async () => {
    const updatedService = {
      id: "service1",
      name: "Updated Service",
      providerId: "provider1",
      baseURL: "https://updated.api.com",
      apiKey: "new-api-key",
      createdAt: new Date().toISOString(),
    };
    await updateService(updatedService);
    const service = await db.query.keyTable.findFirst({
      where: eq(schema.keyTable.id, "service1"),
    });
    expect(service).toEqual({ ...updatedService, createdAt: expect.any(String) });
  });
});

describe("replaceModels", () => {
  it("should replace models for a service", async () => {
    // Local mock for nanoid
    let idCounter = 0;
    vi.mocked(nanoid).mockImplementation(() => `uniqueId${idCounter++}`);

    const service = {
      id: "service1",
      name: "Updated Service",
      providerId: "provider1",
      baseURL: "https://updated.api.com",
      apiKey: "new-api-key",
      createdAt: new Date().toISOString(),
    };
    const newModels = [{ name: "New Model 1" }, { name: "New Model 2" }, { name: "Test Model 1" }];
    await replaceModels(service, newModels);

    const models = await db.query.modelTable.findMany({
      where: eq(schema.modelTable.serviceId, "service1"),
    });

    expect(models).toHaveLength(3);
    expect(models.map((m) => m.name)).toEqual(
      expect.arrayContaining(["New Model 1", "New Model 2", "Test Model 1"]),
    );
    expect(models.map((m) => m.id)).toEqual(
      expect.arrayContaining(["uniqueId0", "uniqueId1", "model1"]),
    );

    // Reset the mock after the test
    vi.mocked(nanoid).mockReset();
  });

  it("should not create duplicate models", async () => {
    // Local mock for nanoid
    let idCounter = 0;
    vi.mocked(nanoid).mockImplementation(() => `uniqueId${idCounter++}`);

    const service = {
      id: "service1",
      name: "Updated Service",
      providerId: "provider1",
      baseURL: "https://updated.api.com",
      apiKey: "new-api-key",
      createdAt: new Date().toISOString(),
    };
    const newModels = [
      { name: "New Model 1" },
      { name: "New Model 2" },
      { name: "Test Model 1" },
      { name: "Test Model 1" }, // Duplicate
    ];
    await replaceModels(service, newModels);

    const models = await db.query.modelTable.findMany({
      where: eq(schema.modelTable.serviceId, "service1"),
    });

    expect(models).toHaveLength(3); // Should still be 3, not 4
    expect(models.map((m) => m.name)).toEqual(
      expect.arrayContaining(["New Model 1", "New Model 2", "Test Model 1"]),
    );

    // Reset the mock after the test
    vi.mocked(nanoid).mockReset();
  });
});

describe("toggleVisible", () => {
  it("should toggle the visibility of a model", async () => {
    const service = {
      id: "service1",
      name: "Updated Service",
      providerId: "provider1",
      baseURL: "https://updated.api.com",
      apiKey: "new-api-key",
      createdAt: new Date().toISOString(),
    };
    const model = {
      id: "model1",
      visible: 1,
      name: "Test Model 1",
      serviceId: "service1",
      createdAt: new Date().toISOString(),
    };
    await toggleVisible(service, model);
    const updatedModel = await db.query.modelTable.findFirst({
      where: eq(schema.modelTable.id, "model1"),
    });
    expect(updatedModel?.visible).toBe(0);
  });
});

describe("toggleAllVisible", () => {
  it("should toggle visibility for all models of a service", async () => {
    const service = {
      id: "service1",
      name: "Updated Service",
      providerId: "provider1",
      baseURL: "https://updated.api.com",
      apiKey: "new-api-key",
      createdAt: new Date().toISOString(),
    };
    await toggleAllVisible(service, 0);
    const models = await db.query.modelTable.findMany({
      where: eq(schema.modelTable.serviceId, "service1"),
    });
    expect(models.every((m) => m.visible === 0)).toBe(true);
  });
});
