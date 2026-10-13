import type { SpaceItem } from "./types";

// Stores the Space (folders, positions and file contents) in the browser's
// IndexedDB so it survives reloads. It is per browser and per device; it
// will be replaced by the server once uploads are stored there.
const DB_NAME = "riwaq-space";
const VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb() {
  dbPromise ??= new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, VERSION);
    request.onupgradeneeded = () => {
      request.result.createObjectStore("items", { keyPath: "id" });
      request.result.createObjectStore("meta");
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return dbPromise;
}

function result<T>(request: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function done(tx: IDBTransaction) {
  return new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

export async function loadSpace() {
  const db = await openDb();
  const tx = db.transaction(["items", "meta"], "readonly");
  const [items, seeded] = await Promise.all([
    result(tx.objectStore("items").getAll() as IDBRequest<SpaceItem[]>),
    result(tx.objectStore("meta").get("seeded")),
  ]);
  return { items, seeded: seeded === true };
}

export async function saveItems(items: SpaceItem[]) {
  const db = await openDb();
  const tx = db.transaction("items", "readwrite");
  items.forEach((item) => tx.objectStore("items").put(item));
  await done(tx);
}

export async function deleteItems(ids: string[]) {
  const db = await openDb();
  const tx = db.transaction("items", "readwrite");
  ids.forEach((id) => tx.objectStore("items").delete(id));
  await done(tx);
}

export async function markSeeded() {
  const db = await openDb();
  const tx = db.transaction("meta", "readwrite");
  tx.objectStore("meta").put(true, "seeded");
  await done(tx);
}
