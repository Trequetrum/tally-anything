
import './App.css';
import {TopAppBar} from './TopAppBar'
import {TallyView} from './TallyView/TallyView'
import * as React from 'react';
import {
  Box
} from '@mui/material';
import { DummyStore, StoreCashe } from './store';

export {App}

function App(): JSX.Element {
  
  const store = React.useRef<StoreCashe>(new DummyStore()).current

  // Whenever the StoreCashe emits, this element is re-rendered
  const [,go] = React.useState(true)
  React.useEffect(() => store.subscribe(() => go(a => !a)), [])

  const pushups = store.getByTag("pushups")

  return (
    <div className="App">
      <TopAppBar />
      <Box sx={{display: 'flex', justifyContent: 'center'}}>
        <TallyView taggedEntries={pushups} store={store}/>
      </Box>
    </div>
  );
}