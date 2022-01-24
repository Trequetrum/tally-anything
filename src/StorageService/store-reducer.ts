import { FileStoreCashe, StoreEntry } from "./store";

export type { StoreWriter, StoreAction }
export { implStoreWriter }

type StoreAction =
  {
    type: "Write";
    payload: StoreEntry;
  } | {
    type: "Delete";
    payload: StoreEntry;
  } | {
    type: "Update";
    payload: {
      oldEntry: StoreEntry;
      newEntry: StoreEntry;
    }
  } | {
    type: "Clear"
  } | {
    type: "AddFiles";
    payload: ({ name: string, id: string })[];
  };

type StoreWriter = (action: StoreAction) => FileStoreCashe;

function implStoreWriter(store: FileStoreCashe, action: StoreAction): FileStoreCashe {

  switch(action.type) {
    case "Write":
      store.write(action.payload);
      break;
    case "Delete":
      store.delete(action.payload);
      break;
    case "Update":
      store.update(action.payload.oldEntry, action.payload.newEntry)
      break;
    case "Clear":
      store.clear();
      break;
    case "AddFiles":
      store.addFiles(action.payload)
  }

  return store;
}