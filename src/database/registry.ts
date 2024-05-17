import * as schema from "./schema.js";
import {
  createTableRelationsHelpers,
  extractTablesRelationalConfig,
  getTableName,
  One,
  type Table,
} from "drizzle-orm";

type Model = Record<string, any>;
type DependsFn = (...deps: `${string}:${string}`[]) => void;

const relationalConfig = extractTablesRelationalConfig(schema, createTableRelationsHelpers);

function registerModels(tableName: string, records: Model[], depends: DependsFn) {
  for (const record of records) {
    depends(`model:${tableName}:${record.id}`);
    const table = relationalConfig.tables[relationalConfig.tableNamesMap[tableName]];
    for (const key of Object.keys(table.relations)) {
      if (record[key]) {
        const referencedTableName = table.relations[key].referencedTableName;
        registerModels(
          referencedTableName,
          Array.isArray(record[key]) ? record[key] : [record[key]],
          depends,
        );
      }
    }
  }
}

export function register(table: Table, view: Model | Model[], depends: DependsFn) {
  const tableName = getTableName(table);
  registerModels(tableName, Array.isArray(view) ? view : [view], depends);
}
