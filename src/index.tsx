import * as React from "react";
import * as ReactDOM from "react-dom";
import "./index.css";
import { App } from "./App";
import CssBaseline from "@mui/material/CssBaseline";

ReactDOM.render(
  <React.StrictMode>
    <CssBaseline />
    <App />
  </React.StrictMode>,
  document.getElementById("root")
);
