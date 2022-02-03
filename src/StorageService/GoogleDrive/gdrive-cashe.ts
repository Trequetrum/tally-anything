import { formatISO, parseISO } from "date-fns";
import {
  MapStoreCashe,
  StoreCashe,
  StoreEntry,
  FileStoreCashe,
  Entry
} from "../store";

import {
  GoogleFileManager
} from "./gdrive-file";

export { GoogleFilesCashe }

/********************************************************************
 * GoogleFilesCashe
 * This class implements FileStoreCashe but defers the cashing to a
 * StoreCashe. This class handles all the logic for how to remember 
 * and access Google Drive files.
 *******************************************************************/
class GoogleFilesCashe implements FileStoreCashe {

  // This store's in-memory implementation. Many functions just act as
  // a proxy to this object.
  private store: StoreCashe;
  // We can get a list of file headers without their content. Means 
  // uses don't need to load content they're not using. 
  private fileHeaders: null | ({ name: string, tag: string, id: string })[];

  // We use this to ensure that if the app requests the same file twice,
  // it only actually gets loaded once. I'm not counting on users
  // editing files while the app is running. If that happens, they'll
  // have to re-load the app in order to reload the files. (Could be
  // done with a button too, just use "store.clear()");
  private requests: Map<string, Promise<void>>;

  constructor(private fm: GoogleFileManager) {
    this.requests = new Map();
    this.store = new MapStoreCashe();
    this.fileHeaders = null;
  }

  read(): StoreEntry[] {
    return this.store.read();
  }

  write(entry: StoreEntry): void {
    this.store.write(entry);
    this.saveFile(entry.tag);
  }

  delete(entry: StoreEntry): void {
    this.store.delete(entry);
    this.saveFile(entry.tag);
  }

  update(oldEntry: StoreEntry, newEntry: StoreEntry): void {
    this.store.update(oldEntry, newEntry);

    this.saveFile(oldEntry.tag);
    if (oldEntry.tag !== newEntry.tag) {
      this.saveFile(newEntry.tag);
    }

  }

  clear(): void {
    this.fileHeaders = null;
    this.store.clear();
    this.requests = new Map();
  }

  getTags(): string[] {
    return Array.from(new Set([
      ...this.store.getTags(),
      ...this.fileHeaders?.map(v => v.tag) || []
    ]));
  }

  entriesByTag(tag: string): Entry[] {
    return this.store.entriesByTag(tag);
  }

  // Lazy loading of files is implemented here. There are a few 
  // considerations to keep in mind. 
  //
  //   First: If we already have the contents of a file, just return 
  //     that.
  //   Second: Just because there isn't currently any entries for a
  //     tag doesn't mean we're not currently waiting for a response
  //     from G-Drive for that very file.
  async requestBytag(tag: string): Promise<Entry[]> {

    const entries = this.entriesByTag(tag);
    await this.casheAllAccessibleFiles();
    const listed = this.fileHeaders?.find(v => v.tag === tag);

    if (entries.length < 1 && listed == null) {
      // This tag doesn't have entries in memory, nor can we load
      // any from G-Drive. 
      return [];
    } else if (entries.length < 1 && listed != null) {

      // This tag doesn't have entires in memory, but G-Drive has
      // some data regarding this tag. Load it if we're not already
      // in the process.
      let currentRequest = this.requests.get(listed.id);
      if (currentRequest !== undefined) {
        // We're either waiting for the contents or the G-Drive file
        // was empty. Promises remember their status, so either way 
        // we just make sure it's done before we proceed.
        await currentRequest;
      } else {
        // Load a file from G-Drive, set this promise as a request.
        // We don't need to buffer the actual response though, so we
        // void it with .then(() => {})
        const filePromise = this.fm.getFileFromDrive(listed.id);
        this.requests.set(listed.id, filePromise.then(() => {}));
        const { content } = await filePromise;
        this.cashFileContent(tag, content);
      }

      return this.entriesByTag(tag);
    } else {

      // We have entries in memory! Yay!
      return entries;
    }
  }

  async requestTags(): Promise<string[]> {
    await this.casheAllAccessibleFiles();
    return this.getTags();
  }

  async casheAllAccessibleFiles() {
    if (this.fileHeaders == null) {
      const files = await this.fm.getAllAccessibleFiles();
      this.addFiles(files);
    }
  }

  addFiles(files: ({ name: string, id: string })[]): void {
    if (files.length < 1) {
      return;
    }

    if (this.fileHeaders == null) {
      this.fileHeaders = [];
    }

    files.forEach(({ name, id }) => {
      const idx = name.search(/(-[0123456789]*)?-TA.json/);
      if (idx > -1 && this.fileHeaders != null) {
        const tag = name.substring(0, idx);
        const prevIdx = this.fileHeaders?.findIndex(v => v.tag === tag);
        const newMetaFile = { name, tag, id };

        if (prevIdx === -1) {
          this.fileHeaders.push(newMetaFile);
        } else {
          this.fileHeaders[prevIdx] = newMetaFile;
        }
      }
    });

  }

  cashFileContent(tag: string, content: any) {
    if ("version" in content) {
      if (content.version === "0.1.0") {
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
            const dateObj = parseISO(entry.date);
            if (!isNaN(dateObj.getTime())) {
              this.store.write({ tag, count: entry.count, date: dateObj });
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
    const entries = this.store.entriesByTag(tag);
    const listed = this.fileHeaders?.find(v => v.tag === tag);

    const content = {
      version: "0.1.0",
      entries: entries.map(entry => ({
        count: entry.count,
        date: formatISO(entry.date)
      }))
    }

    if (listed != null && listed.id.length > 0) {
      this.fm.saveFile({ id: listed.id, name: listed.name, content });
    } else if (listed == null) {
      this.addFiles([{ name: `${tag}-TA.json`, id: "" }]);
      this.fm.createAndSaveNewFile(tag, content).then(file =>
        this.addFiles([{ name: file.name, id: file.id }])
      );
    }
  }
}
