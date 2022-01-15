import * as React from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button
} from "@mui/material";

export function MsgAlert(
  { opener }:
    {
      opener: { current: (title: string, message: string) => void }
    }
) {

  const [open, setOpen] = React.useState(false)
  const [{ title, message }, setParams] = React.useState({
    title: "",
    message: ""
  })
  const handleClose = () => setOpen(false)

  opener.current = (title: string, message: string): void => {
    setParams({ title, message })
    setOpen(true)
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <DialogTitle id="alert-dialog-title">
        {title}
      </DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-description">
          {message}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} autoFocus>
          ok
        </Button>
      </DialogActions>
    </Dialog>
  )
}