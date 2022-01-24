import * as React from 'react';
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  MenuItem,
  Divider,
  ListItemIcon,
  ListItemText,
  MenuList,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField
} from '@mui/material';

import {
  Menu as MenuIcon,
  Login as LoginIcon,
  Logout as LogoutIcon,
  AddToDrive as AddToDriveIcon,
  LockReset as LockResetIcon,
  PlaylistAddCheckCircle as PlaylistAddCheckCircleIcon,
  PlaylistAddCircle as PlaylistAddCircleIcon,
  AccountCircle as AccountCircleIcon,
  HourglassEmpty as HourglassEmptyIcon
} from '@mui/icons-material';

import {
  logout,
  getOAuthInstance,
  revokeAccess
} from './StorageService/GoogleDrive/gdrive-login'
import { showGoogleDrivePicker } from './StorageService/GoogleDrive/gdrive-picker';
import { StoreWriter } from './StorageService/store-reducer';
import { TagState } from './App';
import { LocalizationProvider, MobileDateTimePicker } from '@mui/lab';
import AdapterDateFns from '@mui/lab/AdapterDateFns';
import { NumericTextField } from './BasicComponents/NumericTextField';

export { TopAppBar }

function TopAppBar(
  { logginState, tags, setTagSate, storeDispatch }:
    {
      logginState: {
        isLoggedIn: boolean,
        userName: string
      },
      tags: "Loading" | string[],
      setTagSate: (a: TagState) => void,
      storeDispatch: StoreWriter
    }
) {

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          {
            logginState.isLoggedIn ?
            <TagSelectionMenu tags={tags} setTagSate={setTagSate} /> :
            []
          }
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            TALLY
          </Typography>

          <UserLoginMenu logginState={logginState} storeDispatch={storeDispatch} />

        </Toolbar>
      </AppBar>
    </Box>
  );
}

function TagSelectionMenu(
  { tags, setTagSate }:
    {
      tags: "Loading" | string[];
      setTagSate: (a: TagState) => void;
    }
) {

  const [menuAnchorEl, setMenuAnchorEl] = React.useState<null | HTMLElement>(null);
  const isMenuOpen = Boolean(menuAnchorEl);
  const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };
  const handleMenuClose = () => setMenuAnchorEl(null);

  const [newTagDialogOpen, setNewTagDialogOpen] = React.useState(false)

  return (
    <Box>
      <IconButton
        size="large"
        edge="start"
        color="inherit"
        aria-label="menu"
        sx={{ mr: 2 }}
        onClick={handleMenuClick}
      >
        <MenuIcon />
      </IconButton>
      <Menu
        id="app-bar-tag-selection"
        anchorEl={menuAnchorEl}
        open={isMenuOpen}
        onClose={handleMenuClose}
      >
        <MenuList dense>
          {
            tags == "Loading" ?
              <MenuItem disabled={true}>
                <ListItemIcon>
                  <HourglassEmptyIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText inset>...loading</ListItemText>
              </MenuItem>
            :
            tags.map(tag =>
              <MenuItem
                key={tag}
                onClick={() => {
                  setTagSate({ tag, entries: "Loading" });
                  handleMenuClose();
                }}
              >
                <ListItemIcon>
                  <PlaylistAddCheckCircleIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText inset>{tag}</ListItemText>
              </MenuItem>
            )
          }
          <Divider />
          <MenuItem onClick={() => {
            setNewTagDialogOpen(true);
            handleMenuClose();
          }}>
            <ListItemIcon>
              <PlaylistAddCircleIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText inset>New Thing</ListItemText>
          </MenuItem>
        </MenuList>
      </Menu>
      <NewThingDialog 
        open={newTagDialogOpen} 
        setOpen={setNewTagDialogOpen} 
        setTagSate={setTagSate}
      />
    </Box>
  );
}

function NewThingDialog(
  { open, setOpen, setTagSate }:
    {
      open: boolean;
      setOpen: (a: boolean) => void;
      setTagSate: (a: TagState) => void;
    }
) {

  const [tagField, setTagField] = React.useState("")

  const handleClose = () => setOpen(false)
  const handleUpdate = () => {
    setTagSate({tag: tagField, entries:[]});
    handleClose();
  }

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>Tally Something New</DialogTitle>
      <DialogContent sx={{
        rowGap: 2,
        display: 'flex',
        flexDirection: 'column'
      }}>
        <TextField
          sx={{ marginTop: 2 }}
          id="newTagField"
          label={`New Tally`}
          variant="outlined"
          onChange={({ target }: any) => setTagField(target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleUpdate}>Create</Button>
      </DialogActions>
    </Dialog>
  )
}


function UserLoginMenu(
  { logginState, storeDispatch }:
    {
      logginState: {
        isLoggedIn: boolean,
        userName: string
      };
      storeDispatch: StoreWriter;
    }
) {

  const [menuAnchorEl, setMenuAnchorEl] = React.useState<null | HTMLElement>(null);
  const isMenuOpen = Boolean(menuAnchorEl);
  const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };
  const handleMenuClose = () => setMenuAnchorEl(null);

  const pickerCallback = (documents: any[]) => {
    storeDispatch({
      type: "AddFiles",
      payload: documents.map((v: any) => ({ id: v.id, name: v.name }))
    })
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <div>
        {logginState.userName || ""}
      </div>

      <IconButton
        size="large"
        color="inherit"
        aria-label="account"
        onClick={handleMenuClick}
      >
        <AccountCircleIcon />
      </IconButton>
      <Menu
        id="app-bar-acc-options"
        anchorEl={menuAnchorEl}
        open={isMenuOpen}
        onClose={handleMenuClose}
      >
        {
          logginState.isLoggedIn ?
            [<MenuItem key="logout" onClick={() => {
              logout();
              handleMenuClose();
            }}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText inset>Logout</ListItemText>
            </MenuItem>,

            <MenuItem key="grant" onClick={() => {
              showGoogleDrivePicker(pickerCallback);
              handleMenuClose();
            }}>
              <ListItemIcon>
                <AddToDriveIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText inset>Grant Files</ListItemText>
            </MenuItem>,

            <MenuItem key="revoke" onClick={() => {
              revokeAccess();
              handleMenuClose();
            }}>
              <ListItemIcon>
                <LockResetIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText inset>Revoke Access</ListItemText>
            </MenuItem>

            ] :
            <MenuItem onClick={() => {
              getOAuthInstance();
              handleMenuClose();
            }}>
              <ListItemIcon>
                <LoginIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText inset>Login</ListItemText>
            </MenuItem>
        }
      </Menu>
    </Box>
  )
}