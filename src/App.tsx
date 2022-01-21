
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
} from './GoogleDrive/gdrive-login'
import { GoogleFilesCashe, implStoreWriter, StoreAction, StoreWriter } from './GoogleDrive/gdrive-cashe';
import { getAllAccessibleFiles } from './GoogleDrive/gdrive-file';
import { Entry, TaggedEntries } from './store';

export { App }

// Wrapping our persistant storeCashe stops react from bailing out of
// a dispatch due to the store reference not changing.
function storeReducer({ store }: { store: GoogleFilesCashe }, action: StoreAction): { store: GoogleFilesCashe } {
  return ({ store: implStoreWriter(store, action) })
}

function App(): JSX.Element {

  const storeRTuple = React.useReducer(storeReducer, { store: new GoogleFilesCashe() });
  const store: GoogleFilesCashe = storeRTuple[0].store;
  const storeDispatch = storeRTuple[1] as StoreWriter

  const [logginState, setLogginState] = React.useState<any>({
    isLoggedIn,
    userName
  });

  const logginCallback = React.useCallback(async (isLoggedIn: boolean) => {
    if (isLoggedIn) {

      const [userName, driveFileNames] = await Promise.all([
        getUserName(),
        getAllAccessibleFiles()
      ])

      storeDispatch({ files: driveFileNames })
      setLogginState({ isLoggedIn, userName })

    } else {

      store.clear();
      setLogginState({ isLoggedIn: false, userName: "" })

    }
  }, [setLogginState])

  React.useEffect(() => setLogginCallback(logginCallback), [logginCallback]);

  const [tagState, setTagSate] = React.useState({
    tag: null,
    entries: "Loading"
  } as {
    tag: null | string,
    entries: "Loading" | Entry[]
  });

  const tags = store.listTags();

  React.useEffect(() => {
    if (tagState.tag != null) {
      store.getByTag(tagState.tag).then((entries: null | TaggedEntries) =>
        setTagSate({
          tag: tagState.tag,
          entries: entries?.entries || []
        })
      );
    }
  }, [tagState, setTagSate]);

  return (
    <div className="App">
      <TopAppBar logginState={logginState} tags={tags} setTagSate={setTagSate} storeDispatch={storeDispatch} />
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