import { FileStoreCashe, StoreEntry } from "./store";

export type { StoreWriter, StoreAction }
export { implStoreWriter }

type StoreAction =
  {
    type: "StoreWriteAction";
    payload: StoreEntry;
  } | {
    type: "StoreUpdateAction";
    payload: {
      oldEntry: StoreEntry;
      newEntry: StoreEntry;
    }
  } | {
    type: "StoreClearAction"
  } | {
    type: "StoreAddFiles";
    payload: ({ name: string, id: string })[];
  };

type StoreWriter = (action: StoreAction) => FileStoreCashe;

function implStoreWriter(store: FileStoreCashe, action: StoreAction): FileStoreCashe {

  switch(action.type) {
    case "StoreWriteAction":
      store.write(action.payload);
      break;
    case "StoreUpdateAction":
      store.update(action.payload.oldEntry, action.payload.newEntry)
      break;
    case "StoreClearAction":
      store.clear();
      break;
    case "StoreAddFiles":
      store.addFiles(action.payload)
  }

  return store;
}