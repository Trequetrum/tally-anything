
import './App.css';
import { TopAppBar } from './TopAppBar'
import { TallyView } from './TallyView/TallyView'
import * as React from 'react';
import {
  Box
} from '@mui/material';
import {
  isLoggedIn,
  userName,
  setLogginCallback,
  getUserName
} from './StorageService/GoogleDrive/gdrive-login'
import { Entry, FileStoreCashe } from './StorageService/store';
import { implStoreWriter, StoreAction, StoreWriter } from './StorageService/store-reducer';

export type { TagState }
export { App }

interface TagState {
  tag: null | string;
  entries: "Loading" | Entry[];
}

// Wrapping our persistant storeCashe stops react from bailing out of
// a dispatch due to the store reference not changing.
function storeReducer({ store }: { store: FileStoreCashe }, action: StoreAction): { store: FileStoreCashe } {
  return ({ store: implStoreWriter(store, action) })
}

function App({ globalStore }: { globalStore: FileStoreCashe }): JSX.Element {

  const storeTuple = React.useReducer(storeReducer, { store: globalStore });
  const store: FileStoreCashe = storeTuple[0].store;
  const storeDispatch = storeTuple[1] as StoreWriter

  const [tagList, setTagList] = React.useState<string[]>([])
  React.useEffect(() => {
    store.requestTags().then(setTagList)
  }, [storeTuple[0]])

  const logginState = useLogginManager(store);
  const [tagState, setTagSate] = useLoadingTags(store)

  return (
    <div className="App">
      <TopAppBar logginState={logginState} tags={tagList} setTagSate={setTagSate} storeDispatch={storeDispatch} />
      {
        tagState.tag == null ?
          <h4>Select A Thing To Tally</h4> :
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <TallyView tag={tagState.tag} entries={tagState.entries} storeDispatch={storeDispatch} />
          </Box>
      }
    </div>
  );
}

function useLogginManager(store: FileStoreCashe) {

  const [logginState, setLogginState] = React.useState({
    isLoggedIn,
    userName
  });

  const logginCallback = React.useCallback(async (isLoggedIn: boolean) => {
    if (isLoggedIn) {
      const userName = await getUserName();
      setLogginState({ isLoggedIn, userName })
    } else {
      store.clear();
      setLogginState({ isLoggedIn: false, userName: "" })
    }
  }, [])

  React.useEffect(() => setLogginCallback(logginCallback), []);

  return logginState
}

function useLoadingTags(store: FileStoreCashe):[
  TagState,
  (a: TagState) => void
] {

  const [tagState, setTagSate] = React.useState({
    tag: null,
    entries: "Loading"
  } as {
    tag: null | string,
    entries: "Loading" | Entry[]
  });

  React.useEffect(() => {
    if (tagState.tag != null && tagState.entries == "Loading") {
      store.requestBytag(tagState.tag).then((entries: Entry[]) =>
        setTagSate({
          tag: tagState.tag,
          entries
        })
      );
    }
  }, [tagState]);

  return [tagState, setTagSate]
}