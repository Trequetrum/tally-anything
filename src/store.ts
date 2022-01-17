export type { StoreEntry, Entry, TaggedEntries, StoreCashe, StoreAction, StoreWriter }
export { implStoreWriter, MapStoreCashe, DummyStore }

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
  write({tag, count, date}: StoreEntry): void,
  update(oldEntry: StoreEntry, newEntry: StoreEntry): void

  // Domain Specific Operations
  listTags(): string[],
  getByTag(tag: string): TaggedEntries
}

class MapStoreCashe implements StoreCashe {
  private store: Map<string, Map<number, number>>

  constructor(){
    this.store = new Map();
  }

  read(): StoreEntry[] {
    let entries: StoreEntry[] = [];
    this.store.forEach((m, tag) =>
      m.forEach((count, date) => entries.push({tag, date, count}))
    );
    return entries;
  }

  write({tag, count, date}: StoreEntry) {
    let mTag = this.store.get(tag);
    if (mTag == null){
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

  getByTag(tag: string): TaggedEntries {
    return ({
      tag,
      entries: Array.from(
        this.store.get(tag) || [], 
        ([date, count]) => ({ date, count })
      )
    });
  }

}

class DummyStore extends MapStoreCashe {

  constructor(){
    super();
    
    /* Generate some fake data */

    const tag = "pushups";

    Array.from(Array(5).keys()).map(key => {

      const count = Math.round(Math.random() * (80 - 10) + 10);
      return { tag, count, date: Date.now() - key * 3600000 }

    }).forEach(v => this.write(v))

  }

}

/******
 * React Wrapper to the CasheStore to make useReducer ergonomic.
 * We use storeWriter as a reducer function and call it a day.
 ******/



interface StoreWriteAction {
  entry: StoreEntry
}
interface StoreUpdateAction {
  oldEntry: StoreEntry, 
  newEntry: StoreEntry
}
type StoreAction = StoreWriteAction | StoreUpdateAction

type StoreWriter = (action:StoreAction) => StoreCashe

function implStoreWriter(store: StoreCashe, action:StoreAction): StoreCashe{

  // StoreWriteAction
  if("entry" in action){
    store.write(action.entry);
  }
  // StoreUpdateAction
  if( "oldEntry" in action && 
      "newEntry" in action
  ){
    store.update(action.oldEntry, action.newEntry);
  }

  return store;
}
