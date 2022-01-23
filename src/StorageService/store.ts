export type { StoreEntry, Entry, StoreCashe, FileStoreCashe }
export { MapStoreCashe }

interface StoreEntry {
  tag: string,
  count: number,
  date: number
}

interface Entry {
  count: number,
  date: number
}

interface StoreCashe {
  // Basic Operations
  read(): StoreEntry[];
  write({ tag, count, date }: StoreEntry): void;
  update(oldEntry: StoreEntry, newEntry: StoreEntry): void;
  clear(): void;

  // Domain Specific Operations
  getTags(): string[];
  entriesByTag(tag: string): Entry[];
}

interface FileStoreCashe extends StoreCashe {
  // If there's file metadata stored elsewhere, enter it into the store
  addFiles(files: ({ name: string, id: string })[]): void;

  // Asyncronous Function calls that can check a server for data if
  // it's not cashed in the StoreCashe
  requestTags(): Promise<string[]>;
  requestBytag(tag: string): Promise<Entry[]>;
}

class MapStoreCashe implements StoreCashe {
  private store: Map<string, Map<number, number>>

  constructor() {
    this.store = new Map();
  }

  read(): StoreEntry[] {
    let entries: StoreEntry[] = [];
    this.store.forEach((m, tag) =>
      m.forEach((count, date) => entries.push({ tag, date, count }))
    );
    return entries;
  }

  write({ tag, count, date }: StoreEntry) {
    let mTag = this.store.get(tag);
    if (mTag == null) {
      mTag = new Map();
      this.store.set(tag, mTag);
    }
    mTag.set(date, count);
  }

  update(oldEntry: StoreEntry, newEntry: StoreEntry) {
    this.store.get(oldEntry.tag)?.delete(oldEntry.date);
    this.write(newEntry);
  }

  getTags(): string[] {
    return Array.from(this.store.keys());
  }

  entriesByTag(tag: string): Entry[] {
    return Array.from(
      this.store.get(tag) || [],
      ([date, count]) => ({ date, count })
    );
  }

  clear() {
    this.store = new Map();
  }

}