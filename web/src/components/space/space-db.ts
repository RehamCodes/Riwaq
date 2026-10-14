import type { SpaceItem } from "./types";

// Stores a Finder's items (folders, positions and file contents) in the
// browser's IndexedDB so they survive reloads. It is per browser and per
// device; it will be replaced by the server once uploads are stored there.
const VERSION = 1;

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

export type ItemStore = ReturnType<typeof itemStore>;

// One database per Finder (the Space, Exams, …).
export function itemStore(name: string) {
  let dbPromise: Promise<IDBDatabase> | null = null;

  function openDb() {
    dbPromise ??= new Promise((resolve, reject) => {
      const request = indexedDB.open(name, VERSION);
      request.onupgradeneeded = () => {
        request.result.createObjectStore("items", { keyPath: "id" });
        request.result.createObjectStore("meta");
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    return dbPromise;
  }

  async function getMeta<T>(key: string) {
    const db = await openDb();
    const tx = db.transaction("meta", "readonly");
    return (await result(tx.objectStore("meta").get(key))) as T | undefined;
  }

  async function setMeta(key: string, value: unknown) {
    const db = await openDb();
    const tx = db.transaction("meta", "readwrite");
    tx.objectStore("meta").put(value, key);
    await done(tx);
  }

  return {
    getMeta,
    setMeta,

    async load() {
      const db = await openDb();
      const tx = db.transaction(["items", "meta"], "readonly");
      const [items, seeded] = await Promise.all([
        result(tx.objectStore("items").getAll() as IDBRequest<SpaceItem[]>),
        result(tx.objectStore("meta").get("seeded")),
      ]);
      return { items, seeded: seeded === true };
    },

    async save(items: SpaceItem[]) {
      const db = await openDb();
      const tx = db.transaction("items", "readwrite");
      items.forEach((item) => tx.objectStore("items").put(item));
      await done(tx);
    },

    async remove(ids: string[]) {
      const db = await openDb();
      const tx = db.transaction("items", "readwrite");
      ids.forEach((id) => tx.objectStore("items").delete(id));
      await done(tx);
    },

    markSeeded: () => setMeta("seeded", true),
  };
}

export const spaceStore = itemStore("riwaq-space");
