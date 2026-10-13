import type { BookSource } from "./pdf";

export type ShelfBook = {
  id: string;
  name: string;
  pages: number;
  addedAt: number;
  openedAt: number;
  // Where the reader left off.
  lastPage: number;
  cover: Blob | null;
  source: BookSource;
  // Size of the imported file, to spot the same book added twice.
  fileSize?: number;
  // Bundled sample books can't be removed.
  builtin?: boolean;
};

// The bookshelf lives in this browser's IndexedDB (books are stored as
// files), until the server stores them.
const DB_NAME = "riwaq-bag";
const VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb() {
  dbPromise ??= new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, VERSION);
    request.onupgradeneeded = () => {
      request.result.createObjectStore("books", { keyPath: "id" });
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

async function write(store: string, run: (s: IDBObjectStore) => void) {
  const db = await openDb();
  const tx = db.transaction(store, "readwrite");
  run(tx.objectStore(store));
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

export async function loadShelf() {
  const db = await openDb();
  const tx = db.transaction(["books", "meta"], "readonly");
  const [books, seeded] = await Promise.all([
    result(tx.objectStore("books").getAll() as IDBRequest<ShelfBook[]>),
    result(tx.objectStore("meta").get("seeded")),
  ]);
  return { books, seeded: seeded === true };
}

export const putBook = (book: ShelfBook) => write("books", (s) => s.put(book));

export const deleteBook = (id: string) => write("books", (s) => s.delete(id));

export const markSeeded = () => write("meta", (s) => s.put(true, "seeded"));
