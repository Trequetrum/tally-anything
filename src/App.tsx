
import './App.css';
import {TopAppBar} from './TopAppBar'
import {TallyView} from './TallyView/TallyView'
import * as React from 'react';
import {
  Box
} from '@mui/material';
import { 
  StoreWriter,
  DummyStore, 
  StoreCashe,
  implStoreWriter,
  StoreAction
} from './store';
import {
  isLoggedIn,
  userName,
  setLogginCallback,
  getUserName
} from './GoogleDrive/gdrive-login'
import { 
  getOrCreateEverythingFile
} from './GoogleDrive/gdocfile'

export {App}

// Wrapping our persistant storeCashe stops react from bailing out of
// a dispatch due to the store reference not changing.
function storeReducer({store}:{store: StoreCashe}, action: StoreAction):{store: StoreCashe}{
  return ({store: implStoreWriter(store, action)})
}

function App(): JSX.Element {

  const storeRTuple = React.useReducer(storeReducer, {store: new DummyStore()});
  const store: StoreCashe = storeRTuple[0].store;
  const storeDispatch = storeRTuple[1] as StoreWriter

  const [logginState, setLogginState] = React.useState<any>({
    isLoggedIn,
    userName
  });

  console.log(">>>>>>>>>> logginState", logginState);

  const logginCallback = React.useCallback(async (isLoggedIn: boolean) => {
    console.log(">>>>>>>>>> logginCallback in use");
    if(isLoggedIn){

      const [userName, everythingFile] = await Promise.all([
        getUserName(), 
        getOrCreateEverythingFile()
      ])

      if(Array.isArray(everythingFile.content)){
        store.clear();
        everythingFile.content.forEach((v:any) => {
          if("tag" in v && "count" in v && "date" in v){
            store.write({tag: v.tag, count: v.count, date: v.date});
          }
        })
      }

      setLogginState({isLoggedIn, userName})

    }else{

      store.clear();
      setLogginState({isLoggedIn: false, userName: ""})

    }
  }, [setLogginState])
  
  React.useEffect(() => setLogginCallback(logginCallback), [logginCallback]);
  
  const [tag, setTag] = React.useState("pushups")

  const tags = store.listTags();
  const entires = store.getByTag(tag);

  return (
    <div className="App">
      <TopAppBar logginState={logginState} tags={tags} setTag={setTag}/>
      <Box sx={{display: 'flex', justifyContent: 'center'}}>
        <TallyView taggedEntries={entires} storeDispatch={storeDispatch}/>
      </Box>
    </div>
  );
}