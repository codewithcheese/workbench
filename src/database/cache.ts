import * as schema from "./schema.js";
import {
  createTableRelationsHelpers,
  extractTablesRelationalConfig,
  getTableName,
  type Table,
} from "drizzle-orm";
import { resolveRoute } from "$app/paths";
import { parse_route_id } from "$lib/routing";

type Model = Record<string, any>;
type PrimaryKey = string;
type TableName = string;
type RouteId = string;

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

  register<T extends Model | Model[]>(view: T, table: Table, routeId: string): T {
    let viewArray = Array.isArray(view) ? view : [view];
    const models = this.getTableModels(viewArray, getTableName(table));
    if (!(routeId in this.routeModels)) {
      this.routeModels[routeId] = [];
    }
    for (const [tableName, pk, model] of models) {
      // check if model already exists
      const existing = tableName in this.cache && this.cache[tableName][pk];
      if (existing) {
        // update model
        Object.assign(existing.model, model);
        existing.routes.add(routeId);
      } else {
        if (!this.cache[tableName]) {
          this.cache[tableName] = {};
        }
        this.cache[tableName][pk] = { model, routes: new Set([routeId]) };
        this.routeModels[routeId].push([tableName, pk]);
      }
    }
    // make sure all models are reactive
    return view;
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

  getTableModels(rows: Model[], tableName: string) {
    const models: [string, string, Record<string, any>][] = [];
    for (const record of rows) {
      const table = this.relationalConfig.tables[this.relationalConfig.tableNamesMap[tableName]];
      // extract relational models
      for (const key of Object.keys(table.relations)) {
        if (record[key]) {
          const referencedTableName = table.relations[key].referencedTableName;
          const extracted = this.getTableModels(
            Array.isArray(record[key]) ? record[key] : [record[key]],
            referencedTableName,
          );
          models.push(...extracted);
        }
      }
      // remove relations from record
      const model = structuredClone(record);
      for (const key of Object.keys(table.relations)) {
        if (key in model) {
          delete model[key];
        }
      }
      // todo compute primary key
      models.push([tableName, model["id"], model]);
    }
    return models;
  }
}

// export const cache = new Cache(schema);
