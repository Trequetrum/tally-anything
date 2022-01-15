export type { StoreEntry, Entry, TaggedEntries, StoreCashe }
export { DummyStore }

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
  // Bare-bones observer pattern
  subscribe(fn:() => void): void,
  notify():void,

  // Custom back end
  load(): void,
  save(): void,

  // Basic Operations
  read(): StoreEntry[],
  write({tag, count, date}: StoreEntry): void,
  update(oldEntry: StoreEntry, newEntry: StoreEntry): void

  // Domain Specific Operators
  listTags(): string[],
  getByTag(tag: string): TaggedEntries
}

abstract class MapStoreCashe implements StoreCashe {
  private store: Map<string, Map<number, number>>
  private subscriptions: (() => void)[]

  constructor(){
    this.store = new Map()
    this.subscriptions = []
  }

  subscribe(fn:() => void){
    this.subscriptions.push(fn)
  }

  notify(){
    this.subscriptions.forEach(fn => fn())
  }

  abstract load(): void
  abstract save(): void

  read(): StoreEntry[] {
    let entries: StoreEntry[] = []
    this.store.forEach((m, tag) =>
      m.forEach((count, date) => entries.push({tag, date, count}))
    )
    return entries;
  }

  write({tag, count, date}: StoreEntry, notify = true) {
    let mTag = this.store.get(tag)
    if (mTag == null){
      mTag = new Map()
      this.store.set(tag, mTag)
    }
    mTag.set(date, count)

    if(notify) this.notify()
  }

  update(oldEntry: StoreEntry, newEntry: StoreEntry, notify = true) {
    console.log("Updating ", oldEntry)
    console.log("to ", newEntry)

    this.store.get(oldEntry.tag)?.delete(oldEntry.date)
    this.write(newEntry, notify)
  }

  listTags(): string[] {
    return Array.from(this.store.keys())
  }

  getByTag(tag: string): TaggedEntries {
    return ({
      tag,
      entries: Array.from(
        this.store.get(tag) || [], 
        ([date, count]) => ({ date, count })
      )
    })
  }

}

class DummyStore extends MapStoreCashe {

  constructor(){
    super();
    this.load();
  }

  load() {
    /* Generate some fake data */

    const tag = "pushups";

    Array.from(Array(5).keys()).map(key => {

      const count = Math.round(Math.random() * (80 - 10) + 10);
      return { tag, count, date: Date.now() - key * 3600000 }

    }).forEach(v => this.write(v,false))
    
    this.notify()
  }

  save() {
    /* Memory Store cannot persist data. No save */
  }

}

