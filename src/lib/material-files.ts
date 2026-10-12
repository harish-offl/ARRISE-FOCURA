const DATABASE_NAME = "focura-material-files";
const STORE_NAME = "files";

type StoredMaterialFile = {
  id: string;
  file: Blob;
};

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, 1);

    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Unable to open the material file database."));
  });
}

export async function saveMaterialFile(id: string, file: File): Promise<void> {
  const database = await openDatabase();

  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readwrite");
      transaction.objectStore(STORE_NAME).put({ id, file } satisfies StoredMaterialFile);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error("Unable to save the material file."));
      transaction.onabort = () => reject(transaction.error ?? new Error("Saving the material file was cancelled."));
    });
  } finally {
    database.close();
  }
}

export async function getMaterialFile(id: string): Promise<Blob | null> {
  const database = await openDatabase();

  try {
    return await new Promise<Blob | null>((resolve, reject) => {
      const request = database.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).get(id);
      request.onsuccess = () => resolve((request.result as StoredMaterialFile | undefined)?.file ?? null);
      request.onerror = () => reject(request.error ?? new Error("Unable to read the material file."));
    });
  } finally {
    database.close();
  }
}

export async function removeMaterialFile(id: string): Promise<void> {
  const database = await openDatabase();

  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readwrite");
      transaction.objectStore(STORE_NAME).delete(id);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error("Unable to delete the material file."));
      transaction.onabort = () => reject(transaction.error ?? new Error("Deleting the material file was cancelled."));
    });
  } finally {
    database.close();
  }
}
