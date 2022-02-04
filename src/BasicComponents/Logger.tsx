import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
} from "@mui/material";
import { format } from "date-fns";
//import format from "date-fns/fp/format/index";

export { LoggerDialog };

interface LogEntry {
  type: string;
  timeStamp: string;
  value: any;
}

let consoleContents: LogEntry[] = [];

linkConsole();

// Just a note, this is not how I would implement logging in a larger
// project. This is good for now as it lets me see errors in the
// browser without needing a developer toolkit. If something goes
// wonky/wrong on a friend's mobile device, I can ask them to check
// the log.
function linkConsole() {
  function TS() {
    return format(new Date(), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");
  }

  window.onerror = function (error, url, line) {
    consoleContents.push({
      type: "exception",
      timeStamp: TS(),
      value: { error, url, line },
    });
    return false;
  };

  window.onunhandledrejection = function (e) {
    consoleContents.push({
      type: "promiseRejection",
      timeStamp: TS(),
      value: e.reason,
    });
  };

  function hookLogType(logType: string, original: (...data: any[]) => void) {
    return function (...args: any[]) {
      consoleContents.push({
        type: logType,
        timeStamp: TS(),
        value: args,
      });
      original.apply(console, args);
    };
  }

  console.log = hookLogType("log", console.log.bind(console));
  console.error = hookLogType("error", console.error.bind(console));
  console.warn = hookLogType("warn", console.warn.bind(console));
  console.debug = hookLogType("debug", console.debug.bind(console));
}

// Component to display a list of LogEntry[]
function LogContent({ content }: { content: LogEntry[] }) {
  return (
    <Box>
      <Divider />
      {content.map((itm, i) => (
        <LogEntryView key={i} entry={itm} />
      ))}
    </Box>
  );
}

// Display is single LogEntry.
function LogEntryView({ entry }: { entry: LogEntry }) {
  const { type, timeStamp, value } = entry;

  return (
    <Box>
      <pre>{`${type}: ${timeStamp}`}</pre>
      <pre>
        {value instanceof Error
          ? JSON.stringify(value, Object.getOwnPropertyNames(value), 2)
          : Array.isArray(value)
          ? value
              .map((v) =>
                typeof v === "string" ? v : JSON.stringify(v, null, 2)
              )
              .join(" ")
          : JSON.stringify(value, null, 2)}
      </pre>
      <Divider />
    </Box>
  );
}

// A full screen dialog to display the log in
function LoggerDialog({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (a: boolean) => void;
}) {
  const handleClose = () => setOpen(false);
  const content = open ? [...consoleContents] : [];

  return (
    <Dialog fullScreen open={open} onClose={handleClose}>
      <DialogTitle id="alert-dialog-title">Tally Anything Log</DialogTitle>
      <DialogContent>
        <LogContent content={content} />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} autoFocus>
          close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
