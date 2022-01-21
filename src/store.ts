export type { StoreEntry, Entry, TaggedEntries, StoreCashe }
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

interface TaggedEntries {
  tag: string,
  entries: Entry[]
}

interface StoreCashe {
  // Basic Operations
  read(): StoreEntry[],
  write({ tag, count, date }: StoreEntry): void,
  update(oldEntry: StoreEntry, newEntry: StoreEntry): void,
  clear(): void,

  // Domain Specific Operations
  listTags(): string[],
  getByTag(tag: string): null | TaggedEntries
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

  listTags(): string[] {
    return Array.from(this.store.keys());
  }

  getByTag(tag: string): null | TaggedEntries {
    const entries = Array.from(
      this.store.get(tag) || [],
      ([date, count]) => ({ date, count })
    )

    return entries != null ? ({ tag, entries }) : null;
  }
    

  clear() {
    this.store = new Map();
  }

}