import * as React from 'react';
import * as ReactDOM from 'react-dom';
import './index.css';
import { App } from './App';
import CssBaseline from '@mui/material/CssBaseline';
import { FileStoreCashe } from './StorageService/store';
import { GoogleFilesCashe } from './StorageService/GoogleDrive/gdrive-cashe';

ReactDOM.render(
  <React.StrictMode>
    <CssBaseline />
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);