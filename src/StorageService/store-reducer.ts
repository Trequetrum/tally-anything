import { FileStoreCashe, StoreEntry } from "./store";

export type { StoreWriter, StoreAction }
export { implStoreWriter }

type StoreAction =
  { type: "NewStore";
    store: FileStoreCashe;
  } | {
    type: "Write";
    entry: StoreEntry;
  } | {
    type: "Delete";
    entry: StoreEntry;
  } | {
    type: "Update";
    oldEntry: StoreEntry;
    newEntry: StoreEntry;
  } | {
    type: "Clear";
  } | {
    type: "AddFiles";
    files: ({ name: string, id: string })[];
  };

type StoreWriter = (action: StoreAction) => FileStoreCashe;

function implStoreWriter(store: FileStoreCashe, action: StoreAction): FileStoreCashe {

  switch (action.type) {
    case "NewStore":
      return action.store;
    case "Write":
      store.write(action.entry);
      break;
    case "Delete":
      store.delete(action.entry);
      break;
    case "Update":
      store.update(action.oldEntry, action.newEntry)
      break;
    case "Clear":
      store.clear();
      break;
    case "AddFiles":
      store.addFiles(action.files)
  }

  return store;
}