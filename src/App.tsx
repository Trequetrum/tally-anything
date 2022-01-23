
import './App.css';
import { TopAppBar } from './TopAppBar'
import { TallyView } from './TallyView/TallyView'
import * as React from 'react';
import {
  Box
} from '@mui/material';
import { CallMade as CallMadeIcon } from '@mui/icons-material';
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
  return ({ store: implStoreWriter(store, action) });
}

function App({ globalStore }: { globalStore: FileStoreCashe }): JSX.Element {

  const [storeWrapper, _storeDispatch] = React.useReducer(storeReducer, { store: globalStore });
  const storeDispatch = _storeDispatch as StoreWriter

  const logginState = useLogginManager(storeWrapper.store);
  const [tagState, setTagSate] = useLoadingTags(storeWrapper)

  const [tagList, setTagList] = React.useState<"Loading" | string[]>("Loading")
  React.useEffect(() => {
    if(logginState.isLoggedIn){
      storeWrapper.store.requestTags().then(setTagList);
    }
  }, [storeWrapper, logginState])

  return (
    <div className="App">
      <TopAppBar
        logginState={logginState}
        tags={tagList}
        setTagSate={setTagSate}
        storeDispatch={storeDispatch}
      />
      {
        !logginState.isLoggedIn ?
        <Box sx={{ display: 'flex', justifyContent: 'center'}}>
          <h4>Login to Begin! <CallMadeIcon /></h4>
        </Box> 
        :
        tagState.tag == null ?
        <Box sx={{ display: 'flex', justifyContent: 'center'}}>
          <h4><CallMadeIcon sx={{ transform: 'rotate(270deg)' }} /> Select A Thing To Tally</h4> 
        </Box>
        :
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <TallyView
            tag={tagState.tag}
            entries={tagState.entries}
            storeDispatch={storeDispatch}
          />
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
  }, [store])

  React.useEffect(() => setLogginCallback(logginCallback), [logginCallback]);

  return logginState
}

function useLoadingTags(storeWrapper: {store: FileStoreCashe}): [
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

  // If the store has updated in any way, reload entries
  React.useEffect(
    () => setTagSate(a => ({tag:a.tag, entries: "Loading"})), 
    [storeWrapper]
  );

  // If entries are set to loading, load them
  React.useEffect(() => {
    if (tagState.tag != null && tagState.entries == "Loading") {
      console.log("Loading tag:", tagState.tag)
      storeWrapper.store.requestBytag(tagState.tag).then((entries: Entry[]) => {
        console.log("Setting tag:", tagState.tag, entries)
        setTagSate({
          tag: tagState.tag,
          entries
        })
      });
    }
  }, [tagState, storeWrapper]);

  return [tagState, setTagSate]
}