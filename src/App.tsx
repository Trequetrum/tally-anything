
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
  const [tagState, setTagSate] = useLoadingTags(storeWrapper, logginState.isLoggedIn)

  const [tagList, setTagList] = React.useState<"Loading" | string[]>("Loading")
  React.useEffect(() => {
    if (logginState.isLoggedIn) {
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
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <h4>Login to Begin! <CallMadeIcon /></h4>
          </Box>
          :
          tagState.tag == null ?
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
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

function useLoadingTags(
  storeWrapper: { store: FileStoreCashe },
  isLoggedIn: boolean
): [TagState, (a: TagState) => void] {

  const [tagState, setTagSate] = React.useState({
    tag: null,
    entries: "Loading"
  } as {
    tag: null | string,
    entries: "Loading" | Entry[]
  });

  // If the store has updated in any way, reload entries
  React.useEffect(
    () => setTagSate(a => ({ tag: a.tag, entries: "Loading" })),
    [storeWrapper]
  );

  // If entries are set to loading, load them
  React.useEffect(() => {
    if (tagState.tag != null && tagState.entries == "Loading") {
      storeWrapper.store.requestBytag(tagState.tag).then((entries: Entry[]) => {
        setTagSate({
          tag: tagState.tag,
          entries
        })
      });
    }
  }, [tagState, storeWrapper]);

  // Set and read browser cookies to save/load default tag
  React.useEffect(() => {
    if (isLoggedIn && tagState.tag == null) {
      const cookieTag = getCookie("tag");
      if (cookieTag.length > 0) {
        storeWrapper.store.requestTags().then(tags => {
          if(tags.includes(cookieTag)){
            setTagSate({
              tag: cookieTag,
              entries: "Loading"
            });
          }
        })
      }
    } else if (isLoggedIn && tagState.tag != null){
      setCookie("tag", tagState.tag);
    }
  }, [storeWrapper,tagState, isLoggedIn]);

  return [tagState, setTagSate];
}

function setCookie(key: string, value: string) {
  const aboutAYearMs = 31536000000;
  const expires = new Date(Date.now() + aboutAYearMs).toUTCString();
  document.cookie = `${key}=${value};expires=${expires};path=/`;
}

function getCookie(key: string): string {
  let name = key + "=";
  let ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}