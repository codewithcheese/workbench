import * as schema from "./schema.js";
import {
  createTableRelationsHelpers,
  extractTablesRelationalConfig,
  getTableName,
  getTableUniqueName,
  type Table,
} from "drizzle-orm";
import { invalidate } from "$app/navigation";

type Model = Record<string, any>;
type DependsFn = (...deps: `${string}:${string}`[]) => void;

export function registerModel(table: Table, view: Model | Model[], depends: DependsFn) {
  const relationalConfig = extractTablesRelationalConfig(schema, createTableRelationsHelpers);

  // recursively register all models in a deeply nested relational view
  function register(tableName: string, records: Model[], depends: DependsFn) {
    for (const record of records) {
      depends(`model:${tableName}:${record.id}`);
      const table = relationalConfig.tables[relationalConfig.tableNamesMap[tableName]];
      for (const key of Object.keys(table.relations)) {
        if (record[key]) {
          register(
            getTableUniqueName(table.relations[key].referencedTable),
            Array.isArray(record[key]) ? record[key] : [record[key]],
            depends,
          );
        }
      }
    }
  }

  const tableName = getTableUniqueName(table);
  register(tableName, Array.isArray(view) ? view : [view], depends);
}

export function invalidateModel(table: Table, model: Model) {
  return invalidate(`model:${getTableUniqueName(table)}:${model.id}`);
}
