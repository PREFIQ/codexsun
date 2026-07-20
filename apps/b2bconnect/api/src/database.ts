import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";

export function createB2bConnectDatabase(filename?: string) {
  const databasePath =
    filename ?? resolve(import.meta.dirname, "../../../../storage/b2bconnect/b2bconnect.sqlite");
  if (databasePath !== ":memory:") mkdirSync(dirname(databasePath), { recursive: true });
  const database = new DatabaseSync(databasePath);
  database.exec("PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;");
  return database;
}

export type B2bConnectDatabase = DatabaseSync;
