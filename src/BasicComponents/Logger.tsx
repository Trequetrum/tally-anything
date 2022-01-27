import { Box, Divider } from "@mui/material";

export { Logger }

let consoleContents: {
  type: string;
  timeStamp: string;
  value: any;
}[] = [];

linkConsole();

function linkConsole() {

  function TS() {
    return (new Date).toLocaleString("sv", { timeZone: 'UTC' }) + "Z"
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

function Logger(){
  return (
    <Box>
      <Divider />
      {
        consoleContents.flatMap((itm, i) => [
          <pre key={`${i}0`}>{JSON.stringify(itm, null, 2)}</pre>,
          <Divider key={`${i}1`} />
        ])
      }
    </Box>
  )
}