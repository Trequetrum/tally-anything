
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
  implStoreWriter
} from './store';

export {App}

function App(): JSX.Element {
  
  const tuple = React.useReducer(implStoreWriter, new DummyStore());
  const store: StoreCashe = tuple[0];
  const storeDispatch = tuple[1] as StoreWriter

  const pushups = store.getByTag("pushups")

  return (
    <div className="App">
      <TopAppBar />
      <Box sx={{display: 'flex', justifyContent: 'center'}}>
        <TallyView taggedEntries={pushups} storeDispatch={storeDispatch}/>
      </Box>
    </div>
  );
}