import * as React from "react";
import { Dispatch } from "react";

import "./App.css";
import { TopAppBar } from "./TopAppBar";
import { TallyView } from "./TallyView/TallyView";

import { Box } from "@mui/material";
import {
  PersonSearch as PersonSearchIcon,
  CallMade as CallMadeIcon,
} from "@mui/icons-material";
import {
  getGoogleAPIAuthenticator,
  GoogleAPIAuthenticator,
} from "./StorageService/GoogleDrive/gdrive-login";
import { EmptyFileStore, Entry, FileStoreCashe } from "./StorageService/store";
import { implStoreWriter, StoreAction } from "./StorageService/store-reducer";
import { GoogleFilesCashe } from "./StorageService/GoogleDrive/gdrive-cashe";
import { GoogleFileManager } from "./StorageService/GoogleDrive/gdrive-file";

export type { TagState, TagStateEntries, LogginState };
export { App };

type LogginState = "Loading" | "Failure" | boolean;

type TagStateEntries = "Loading" | Entry[];

interface TagState {
  tag: null | string;
  entries: TagStateEntries;
}

// Wrapping our persistant storeCashe stops react from bailing out of
// a dispatch due to the store reference not changing.
function storeReducer(
  { store }: { store: FileStoreCashe },
  action: StoreAction
): { store: FileStoreCashe } {
  return { store: implStoreWriter(store, action) };
}

function App(): JSX.Element {
  const [storeWrapper, storeDispatch] = React.useReducer(storeReducer, {
    store: new EmptyFileStore(),
  });

  const [logginState, setLogginState] = React.useState<LogginState>(false);
  const [auth, setAuth] = React.useState<null | GoogleAPIAuthenticator>(null);

  React.useEffect(() => {
    console.log("Initializing Authenticator via React Effect");
    getGoogleAPIAuthenticator(setLogginState).then((authy) => {
      setAuth(authy);
      storeDispatch({
        type: "NewStore",
        store: new GoogleFilesCashe(new GoogleFileManager(authy)),
      });
    });
  }, []);

  // Get the userName if we're logged in and there's an auth object
  const userName = logginState === true ? auth?.getUserName() || "" : "";

  const [tagState, setTagState] = useLoadingTagEntries(
    storeWrapper,
    logginState === true
  );

  React.useEffect(() => {
    if (logginState === false) {
      setTagState({ tag: null, entries: "Loading" });
      storeDispatch({ type: "Clear" });
    }
  }, [logginState, setTagState]);

  const [tagList, setTagList] = React.useState<"Loading" | string[]>("Loading");
  React.useEffect(() => {
    if (logginState === true) {
      storeWrapper.store.requestTags().then(setTagList);
    }
  }, [storeWrapper, logginState]);

  return (
    <div className="App">
      <TopAppBar
        logginState={logginState}
        setLoggedIn={setLogginState}
        userName={userName}
        tags={tagList}
        setTagSate={setTagState}
        storeDispatch={storeDispatch}
        authService={auth}
      />
      <OpeningMessage
        auth={auth}
        logginState={logginState}
        tagState={tagState}
        storeDispatch={storeDispatch}
      />
    </div>
  );
}

function OpeningMessage({
  auth,
  logginState,
  tagState,
  storeDispatch,
}: {
  auth: null | GoogleAPIAuthenticator;
  logginState: LogginState;
  tagState: TagState;
  storeDispatch: React.Dispatch<StoreAction>;
}): JSX.Element {
  if (auth === null) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center" }}>
        <h4>
          <PersonSearchIcon /> Loading Third Party Google Client...
        </h4>
      </Box>
    );
  } else if (logginState === false) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center" }}>
        <h4>
          Login to Begin! <CallMadeIcon />
        </h4>
      </Box>
    );
  } else if (logginState === "Loading") {
    return (
      <Box sx={{ display: "flex", justifyContent: "center" }}>
        <h4>Logging In...</h4>
      </Box>
    );
  } else if (logginState === "Failure") {
    return (
      <Box sx={{ display: "flex", justifyContent: "center" }}>
        <h4>Loggin Failed</h4>
        <pre>Perhaps refresh the page, then try again</pre>
      </Box>
    );
  } else {
    return tagState.tag === null ? (
      <Box sx={{ display: "flex", justifyContent: "center" }}>
        <h4>
          <CallMadeIcon sx={{ transform: "rotate(270deg)" }} />
          Select A Thing To Tally
        </h4>
      </Box>
    ) : (
      <Box sx={{ display: "flex", justifyContent: "center" }}>
        <TallyView
          tag={tagState.tag}
          entries={tagState.entries}
          storeDispatch={storeDispatch}
        />
      </Box>
    );
  }
}

function useLoadingTagEntries(
  storeWrapper: { store: FileStoreCashe },
  isLoggedIn: boolean
): [TagState, Dispatch<React.SetStateAction<TagState>>] {
  const [tagState, setTagState] = React.useState({
    tag: null,
    entries: "Loading",
  } as TagState);

  // If the store has updated in any way, reload entries
  React.useEffect(
    () => setTagState((st) => ({ tag: st.tag, entries: "Loading" })),
    [storeWrapper]
  );

  // If entries are set to loading, load them
  React.useEffect(() => {
    if (
      isLoggedIn === true &&
      tagState.tag != null &&
      tagState.entries === "Loading"
    ) {
      storeWrapper.store.requestBytag(tagState.tag).then((entries: Entry[]) => {
        setTagState({
          tag: tagState.tag,
          entries,
        });
      });
    }
  }, [isLoggedIn, tagState, storeWrapper]);

  // Set and read browser cookies to save/load default tag
  React.useEffect(() => {
    if (isLoggedIn && tagState.tag === null) {
      const cookieTag = getCookie("tag");
      if (cookieTag.length > 0) {
        storeWrapper.store.requestTags().then((tags) => {
          if (tags.includes(cookieTag)) {
            setTagState({
              tag: cookieTag,
              entries: "Loading",
            });
          }
        });
      }
    } else if (isLoggedIn && tagState.tag != null) {
      setCookie("tag", tagState.tag);
    }
  }, [storeWrapper, tagState, isLoggedIn]);

  return [tagState, setTagState];
}

function setCookie(key: string, value: string) {
  const aboutAYearMs = 31536000000;
  const expires = new Date(Date.now() + aboutAYearMs).toUTCString();
  document.cookie = `${key}=${value};expires=${expires};path=/`;
}

function getCookie(key: string): string {
  let name = key + "=";
  let ca = document.cookie.split(";");
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === " ") {
      c = c.substring(1);
    }
    if (c.indexOf(name) === 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}
