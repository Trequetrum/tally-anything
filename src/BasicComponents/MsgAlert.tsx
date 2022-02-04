import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from "@mui/material";

/********************************************************************
 * A MUI alert with title and message.
 * State is created by the parent componant
 *******************************************************************/
export function MsgAlert({
  state,
  setState,
}: {
  state: {
    open: boolean;
    title: string;
    message: string;
  };
  setState: (a: { open: boolean; title: string; message: string }) => void;
}) {
  const handleClose = () =>
    setState({
      open: false,
      title: "",
      message: "",
    });

  return (
    <Dialog
      open={state.open}
      onClose={handleClose}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <DialogTitle id="alert-dialog-title">{state.title}</DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-description">
          {state.message}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} autoFocus>
          ok
        </Button>
      </DialogActions>
    </Dialog>
  );
}
