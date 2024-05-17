import * as schema from "./schema.js";
import {
  createTableRelationsHelpers,
  extractTablesRelationalConfig,
  getTableName,
  One,
  type Table,
} from "drizzle-orm";
import { parse_route_id } from "$lib/routing";

type Model = Record<string, any>;
type PrimaryKey = string;
type TableName = string;
type RouteId = string;
type ModelEntry = { tableName: TableName; pk: PrimaryKey; model: Model };
type ViewMap = {
  tableName: string;
  pk: string;
  model: Record<string, any>;
  relations: Record<string, { type: "one" | "many"; views: ViewMap[] }>;
};

export class CachedView<T extends Record<string, any>> {
  // viewMap: ViewMap;
  constructor(viewMap: ViewMap) {
    for (const key of Object.keys(viewMap.model)) {
      Object.defineProperty(this, key, {
        enumerable: true,
        get() {
          return viewMap.model[key];
        },
        set(value) {
          console.log("set", key, value);
          viewMap.model[key] = value;
        },
      });
    }
    for (const [name, { type, views }] of Object.entries(viewMap.relations)) {
      Object.defineProperty(this, name, {
        value: type === "one" ? new CachedView(views[0]) : views.map((v) => new CachedView(v)),
        writable: false,
        enumerable: true,
      });
    }
    return this as unknown as T & { toJSON: () => any; viewMap: ViewMap };
  }

  [x: string]: any;
}

/**
 * Register query results to
 */
export class Cache {
  schema: any;
  relationalConfig: ReturnType<typeof extractTablesRelationalConfig>;

  constructor(schema: any) {
    this.schema = schema;
    this.relationalConfig = extractTablesRelationalConfig(schema, createTableRelationsHelpers);
  }

  cache: Record<TableName, Record<PrimaryKey, { model: Model; routes: Set<RouteId> }>> = {};
  routeModels: Record<string, [TableName, PrimaryKey][]> = {};

  register<T extends Model | Model[]>(view: T, table: Table, routeId: string): CachedView<T> {
    console.log("register", routeId);
    if (!(routeId in this.routeModels)) {
      this.routeModels[routeId] = [];
    }
    const viewMaps = this.buildViewMaps(
      Array.isArray(view) ? view : [view],
      getTableName(table),
      routeId,
    );
    const cachedViews = viewMaps.map((viewMap) => new CachedView<T>(viewMap));
    return Array.isArray(view) ? cachedViews : cachedViews[0];
  }

  /**
   * Unload any routes that no longer patch the path
   * Free up memory when the user navigates away from a page.
   */
  onNavigate(path: string) {
    const invalid = new Set<string>();
    for (const routeId of Object.keys(this.routeModels)) {
      const { pattern } = parse_route_id(routeId);
      if (!pattern.test(path)) {
        invalid.add(routeId);
      }
    }

    for (const routeId of invalid) {
      for (const [tableName, pk] of Object.values(this.routeModels[routeId])) {
        // remove route from model routes
        this.cache[tableName][pk].routes.delete(routeId);
        // remove model if no routes
        if (this.cache[tableName][pk].routes.size === 0) {
          delete this.cache[tableName][pk];
        }
      }
      delete this.routeModels[routeId];
    }
  }

  buildViewMaps(rows: Model[], tableName: string, routeId: string) {
    const views: ViewMap[] = [];

    for (const record of rows) {
      const table = this.relationalConfig.tables[this.relationalConfig.tableNamesMap[tableName]];

      const model = structuredClone(record);
      // remove relations from model
      for (const key of Object.keys(table.relations)) {
        if (key in model) {
          delete model[key];
        }
      }

      // todo compute primary key
      const pk = model["id"];

      const existing = tableName in this.cache && this.cache[tableName][pk];

      let view: ViewMap;
      if (existing) {
        view = {
          tableName,
          pk,
          model: existing.model,
          relations: {},
        };
        // update existing model with new data
        Object.assign(existing.model, model);
        // add route to existing model
        existing.routes.add(routeId);
      } else {
        let model$ = $state(model);
        view = {
          tableName,
          pk,
          model: model$,
          relations: {},
        };
        if (!this.cache[tableName]) {
          this.cache[tableName] = {};
        }
        this.cache[tableName][pk] = { model: model$, routes: new Set([routeId]) };
        this.routeModels[routeId].push([tableName, pk]);
      }

      views.push(view);

      // extract relational models
      for (const key of Object.keys(table.relations)) {
        if (record[key]) {
          const referencedTableName = table.relations[key].referencedTableName;
          const subViews = this.buildViewMaps(
            Array.isArray(record[key]) ? record[key] : [record[key]],
            referencedTableName,
            routeId,
          );
          const type = table.relations[key] instanceof One ? "one" : "many";
          view.relations[key] = {
            type,
            views: subViews,
          };
        }
      }
    }
    return views;
  }
}

let cache: Cache | null = null;

export function useCache<T extends Model | Model[]>(
  view: T,
  table: Table,
  route: { id: string },
  url: URL,
) {
  if (!cache) {
    cache = new Cache(schema);
  }
  cache.onNavigate(url.pathname);
  return cache.register(view, table, route.id);
}

export function getCache() {
  return cache;
}
