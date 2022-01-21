import { MapStoreCashe, StoreCashe, StoreEntry, TaggedEntries } from "../store";
import { createAndSaveNewFile, getFileFromDrive, GoogleFile, saveFile } from "./gdrive-file";

export type { StoreWriter, StoreAction }
export { GoogleFilesCashe, implStoreWriter }

class GoogleFilesCashe {

  private store: StoreCashe
  private files: ({ name: string, tag: string, id: string, file?: GoogleFile })[]

  constructor() {
    this.store = new MapStoreCashe();
    this.files = []
  }

  read(): StoreEntry[] {
    return this.store.read();
  }

  write(entry: StoreEntry): void {
    this.store.write(entry);
    this.saveFile(entry.tag);
  }

  update(oldEntry: StoreEntry, newEntry: StoreEntry): void {
    this.store.update(oldEntry, newEntry);

    this.saveFile(oldEntry.tag)
    if (oldEntry.tag != newEntry.tag) {
      this.saveFile(newEntry.tag)
    }

  }

  clear(): void {
    this.files = []
    this.store.clear();
  }

  listTags(): string[] {
    return Array.from(new Set([
      ...this.store.listTags(),
      ...this.files.map(v => v.tag)
    ]))
  }

  async getByTag(tag: string): Promise<null | TaggedEntries> {
    const storeTags = this.store.getByTag(tag);
    const listed = this.files.find(v => v.tag == tag);
    if (storeTags == null && listed == null) {
      return null;
    } else if (storeTags == null && listed != null) {
      const { content, ...rest } = await getFileFromDrive(listed.id)
      listed.file = { content: null, ...rest }
      this.cashFileContent(tag, content);
      return this.store.getByTag(tag);
    } else {
      return storeTags;
    }
  }

  //-----------------------------------------------------------------

  addFiles(files: ({ name: string, id: string })[]): void {
    files.forEach(({ name, id }) => {
      const idx = name.search(/-+[0123456789]*-TA.json/);
      if (idx > -1) {
        const tag = name.substring(0, idx)
        this.files.push({ name, tag, id })
      }
    })
  }

  cashFileContent(tag: string, content: any) {
    if ("version" in content) {
      if (content.version == "0.1.0") {
        this.cashFileContentv0_1_0(tag, content)
      } else {
        console.error(tag + " File Content Unrecognised Version Number:", content);
      }
    } else {
      console.error(tag + " File Content Has No Version: ", content);
    }
  }

  cashFileContentv0_1_0(tag: string, content: any) {
    if ("entries" in content && Array.isArray(content.entries)) {
      content.entries.forEach((entry: any) => {
        if ("count" in entry && !isNaN(entry.count)) {
          if ("date" in entry) {
            const dateMs = Date.parse(entry.date);
            if (dateMs > 0) {
              this.store.write({ tag, count: entry.count, date: dateMs });
            } else {
              console.error(tag + " File Content Failed To Parse Date", content, entry.date);
            }
          } else {
            console.error(tag + " File Content Entry Missing Attribute (date)", content, entry);
          }
        } else {
          console.error(tag + " File Content Entry Missing Attribute (count):", content, entry);
        }
      });
    } else {
      console.error(tag + " File Content Entries Must Be Array:", content, content?.entries);
    }
  }

  saveFile(tag: string) {
    const entries = this.store.getByTag(tag);
    const listed = this.files.find(v => v.tag == tag);

    const content = {
      version: "0.1.0",
      entries: entries?.entries.map(entry => ({
        count: entry.count,
        date: new Date(entry.date).toISOString
      }))
    }

    if (listed != null) {
      saveFile({ id: listed.id, name: listed.name, content });
    } else {
      createAndSaveNewFile(tag, content);
    }
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
interface StoreClearAction {
  clear: boolean
}
interface StoreAddFiles {
  files: ({ name: string, id: string })[]
}

type StoreAction =
  StoreWriteAction
  | StoreUpdateAction
  | StoreClearAction
  | StoreAddFiles

type StoreWriter = (action: StoreAction) => GoogleFilesCashe

function implStoreWriter(store: GoogleFilesCashe, action: StoreAction): GoogleFilesCashe {

  // StoreWriteAction
  if ("entry" in action) {
    store.write(action.entry);
  }
  // StoreUpdateAction
  if ("oldEntry" in action && "newEntry" in action) {
    store.update(action.oldEntry, action.newEntry);
  }
  // StoreClearAction
  if ("clear" in action && action.clear) {
    store.clear();
  }
  // StoreAddFiles
  if ("files" in action) {
    store.addFiles(action.files)
  }

  return store;
}
