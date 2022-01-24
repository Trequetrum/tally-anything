import { assert } from "console";
import { MapStoreCashe, StoreCashe, StoreEntry, FileStoreCashe, Entry } from "../store";
import { createAndSaveNewFile, getAllAccessibleFiles, getFileFromDrive, GoogleFile, saveFile } from "./gdrive-file";

export { GoogleFilesCashe }

class GoogleFilesCashe implements FileStoreCashe {

  private store: StoreCashe
  private files: null | ({ name: string, tag: string, id: string, file?: GoogleFile })[]

  constructor() {
    this.store = new MapStoreCashe();
    this.files = null
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

    this.saveFile(oldEntry.tag)
    if (oldEntry.tag != newEntry.tag) {
      this.saveFile(newEntry.tag)
    }

  }

  clear(): void {
    this.files = null
    this.store.clear();
  }

  getTags(): string[] {
    return Array.from(new Set([
      ...this.store.getTags(),
      ...this.files?.map(v => v.tag) || []
    ]))
  }

  entriesByTag(tag: string): Entry[] {
    return this.store.entriesByTag(tag);
  }

  async requestBytag(tag: string): Promise<Entry[]> {
    const storeTags = this.entriesByTag(tag);
    const listed = this.files?.find(v => v.tag == tag);
    if (storeTags.length < 1 && listed == null) {
      return [];
    } else if (storeTags.length < 1 && listed != null) {
      const { content, ...rest } = await getFileFromDrive(listed.id)
      listed.file = { content: null, ...rest }
      this.cashFileContent(tag, content);
      return this.entriesByTag(tag);
    } else {
      return storeTags;
    }
  }

  async requestTags(): Promise<string[]> {

    if (this.files == null) {
      const files = await getAllAccessibleFiles();
      this.addFiles(files);
    }

    return this.getTags();
  }

  addFiles(files: ({ name: string, id: string })[]): void {
    if ( files.length < 1){
      return;
    }

    if (this.files == null) {
      this.files = [];
    }

    files.forEach(({ name, id }) => {
      const idx = name.search(/(-[0123456789]*)?-TA.json/);
      if (idx > -1 && this.files != null) {
        const tag = name.substring(0, idx);
        const prevIdx = this.files?.findIndex(v => v.tag == tag);
        const newMetaFile = { name, tag, id };

        if(prevIdx == -1){
          this.files.push(newMetaFile);
        }else{
          this.files[prevIdx] = newMetaFile;
        }
      }
    });

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
    const entries = this.store.entriesByTag(tag);
    const listed = this.files?.find(v => v.tag == tag);

    const content = {
      version: "0.1.0",
      entries: entries.map(entry => ({
        count: entry.count,
        date: new Date(entry.date).toISOString()
      }))
    }

    if (listed != null && listed.id.length > 0) {
      saveFile({ id: listed.id, name: listed.name, content });
    } else if (listed == null) {
      this.addFiles([{ name: `${tag}-TA.json`, id: "" }]);
      createAndSaveNewFile(tag, content).then(file =>
        this.addFiles([{ name: file.name, id: file.id }])
      );
    }
  }
}