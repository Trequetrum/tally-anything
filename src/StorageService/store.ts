import { compareDesc } from "date-fns";

export type { StoreEntry, Entry, StoreCashe, FileStoreCashe };
export {
  MapStoreCashe,
  EmptyFileStore,
  equalEntry,
  equalStoreEntry,
  compareEntryTimeDesc,
};

interface Entry {
  count: number;
  date: Date;
}

interface StoreEntry extends Entry {
  tag: string;
}

interface StoreCashe {
  // Basic Operations
  read(): StoreEntry[];
  write(entry: StoreEntry): void;
  delete(entry: StoreEntry): void;
  update(oldEntry: StoreEntry, newEntry: StoreEntry): void;
  clear(): void;

  // Domain Specific Operations
  getTags(): string[];
  entriesByTag(tag: string): Entry[];
}

interface FileStoreCashe extends StoreCashe {
  // If there's file metadata stored elsewhere, enter it into the store
  addFiles(files: { name: string; id: string }[]): void;

  // Asyncronous Function calls that can check a server for data if
  // it's not cashed in the StoreCashe
  requestTags(): Promise<string[]>;
  requestBytag(tag: string): Promise<Entry[]>;
}

class MapStoreCashe implements StoreCashe {
  private store: Map<string, Entry[]>;

  constructor() {
    this.store = new Map();
  }

  read(): StoreEntry[] {
    let retEntries: StoreEntry[] = [];
    this.store.forEach((tagEntries, tag) =>
      tagEntries.forEach(({ count, date }) =>
        retEntries.push({ tag, date, count })
      )
    );
    return retEntries;
  }

  write({ tag, count, date }: StoreEntry) {
    let mTag = this.store.get(tag);
    if (mTag == null) {
      this.store.set(tag, [{ date, count }]);
    } else {
      mTag.push({ date, count });
    }
  }

  delete({ tag, count, date }: StoreEntry) {
    const mTag = this.store.get(tag);

    if (mTag != null) {
      this.store.set(
        tag,
        mTag.filter((v) => !equalEntry(v, { date, count }))
      );
    }
  }

  update(oldEntry: StoreEntry, newEntry: StoreEntry) {
    this.delete(oldEntry);
    this.write(newEntry);
  }

  getTags(): string[] {
    return Array.from(this.store.keys());
  }

  entriesByTag(tag: string): Entry[] {
    return this.store.get(tag) || [];
  }

  clear() {
    this.store = new Map();
  }
}

function equalEntry(a: Entry, b: Entry): boolean {
  return a.count === b.count && a.date.getTime() === b.date.getTime();
}

function equalStoreEntry(a: StoreEntry, b: StoreEntry): boolean {
  return (
    a.tag === b.tag &&
    a.count === b.count &&
    a.date.getTime() === b.date.getTime()
  );
}

function compareEntryTimeDesc(
  a: Entry | StoreEntry,
  b: Entry | StoreEntry
): number {
  return compareDesc(a.date, b.date);
}

class EmptyFileStore implements FileStoreCashe {
  requestTags(): Promise<string[]> {
    return Promise.resolve([]);
  }
  requestBytag(tag: string): Promise<Entry[]> {
    return Promise.resolve([]);
  }
  read(): StoreEntry[] {
    return [];
  }
  getTags(): string[] {
    return [];
  }
  entriesByTag(tag: string): Entry[] {
    return [];
  }
  addFiles(files: { name: string; id: string }[]): void {}
  write(entry: StoreEntry): void {}
  delete(entry: StoreEntry): void {}
  update(oldEntry: StoreEntry, newEntry: StoreEntry): void {}
  clear(): void {}
}
