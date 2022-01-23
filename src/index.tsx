import * as React from 'react';
import * as ReactDOM from 'react-dom';
import './index.css';
import { App } from './App';
import CssBaseline from '@mui/material/CssBaseline';
import { FileStoreCashe } from './StorageService/store';
import { GoogleFilesCashe } from './StorageService/GoogleDrive/gdrive-cashe';

const store: FileStoreCashe = new GoogleFilesCashe();

ReactDOM.render(
  <React.StrictMode>
    <CssBaseline />
    <App globalStore={store}/>
  </React.StrictMode>,
  document.getElementById('root')
);
