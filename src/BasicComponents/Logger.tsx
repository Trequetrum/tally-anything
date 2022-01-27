import { 
  Box, 
  Button, 
  Dialog, 
  DialogActions, 
  DialogContent, 
  DialogTitle, 
  Divider 
} from "@mui/material";

export { LoggerDialog }

interface LogEntry {
  type: string;
  timeStamp: string;
  value: any;
}

let consoleContents: LogEntry[] = [];

linkConsole();

function linkConsole() {

  function TS() {
    return (new Date()).toLocaleString("sv", { timeZone: 'UTC' }) + "Z"
  }

  window.onerror = function (error, url, line) {
    consoleContents.push({
      type: "exception",
      timeStamp: TS(),
      value: { error, url, line }
    })
    return false;
  }

  window.onunhandledrejection = function (e) {
    consoleContents.push({
      type: "promiseRejection",
      timeStamp: TS(),
      value: e.reason
    })
  }

  function hookLogType(logType: string, original: (...data: any[]) => void) {
    return function (...args: any[]) {
      consoleContents.push({
        type: logType,
        timeStamp: TS(),
        value: args
      })
      original.apply(console, args);
    }
  }

  console.log = hookLogType('log', console.log.bind(console));
  console.error = hookLogType('error', console.error.bind(console));
  console.warn = hookLogType('warn', console.warn.bind(console));
  console.debug = hookLogType('debug', console.debug.bind(console));
}

function LogContent({ content }: { content: LogEntry[] }) {
  return (
    <Box>
      <Divider />
      {
        content.map((itm, i) =>
          <LogEntry key={i} entry={itm} />
        )
      }
    </Box>
  )
}

function LogEntry({ entry }: { entry: LogEntry }) {

  const { type, timeStamp, value } = entry;

  return (
    <Box>
      <pre>{`${type}: ${timeStamp}`}</pre>
      <pre>
        {
          value instanceof Error ?
            JSON.stringify(value, Object.getOwnPropertyNames(value), 2) :
            Array.isArray(value) ?
              value.map(v => 
                typeof v === 'string' ? v :
                  JSON.stringify(v, null, 2)
              ).join(" ") :
              JSON.stringify(value, null, 2)
        }
      </pre>
      <Divider />
    </Box>
  );
}

function LoggerDialog(
  { open, setOpen }:
    {
      open: boolean,
      setOpen: (a: boolean) => void
    }
) {

  const handleClose = () => setOpen(false);
  const content = open ? [...consoleContents] : []

  return (
    <Dialog
      fullScreen
      open={open}
      onClose={handleClose}
    >
      <DialogTitle id="alert-dialog-title">
        Tally Anything Log
      </DialogTitle>
      <DialogContent>
        <LogContent content={content}/>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} autoFocus>
          close
        </Button>
      </DialogActions>
    </Dialog>
  );
}