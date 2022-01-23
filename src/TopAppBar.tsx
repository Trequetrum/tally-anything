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
  MenuList
} from '@mui/material';

import {
  Menu as MenuIcon,
  Login as LoginIcon,
  Logout as LogoutIcon,
  AddToDrive as AddToDriveIcon,
  LockReset as LockResetIcon,
  PlaylistAddCheckCircle as PlaylistAddCheckCircleIcon,
  PlaylistAddCircle as PlaylistAddCircleIcon,
  AccountCircle as AccountCircleIcon
} from '@mui/icons-material';

import {
  logout,
  getOAuthInstance,
  revokeAccess
} from './StorageService/GoogleDrive/gdrive-login'
import { showGoogleDrivePicker } from './StorageService/GoogleDrive/gdrive-picker';
import { StoreWriter } from './StorageService/store-reducer';
import { TagState } from './App';

export { TopAppBar }

function TopAppBar(
  { logginState, tags, setTagSate, storeDispatch }:
    {
      logginState: {
        isLoggedIn: boolean,
        userName: string
      },
      tags: string[],
      setTagSate: (a: TagState) => void,
      storeDispatch: StoreWriter
    }
) {

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>

          <TagSelectionMenu tags={tags} setTagSate={setTagSate} />

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
      tags: string[];
      setTagSate: (a: TagState) => void;
    }
) {

  const [menuAnchorEl, setMenuAnchorEl] = React.useState<null | HTMLElement>(null);
  const isMenuOpen = Boolean(menuAnchorEl);
  const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };
  const handleMenuClose = () => setMenuAnchorEl(null);

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
            tags.map(tag =>
              <MenuItem
                key={tag}
                onClick={() => {
                  setTagSate({ tag, entries: "Loading" });
                  handleMenuClose();
                }
                }>
                <ListItemIcon>
                  <PlaylistAddCheckCircleIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText inset>{tag}</ListItemText>
              </MenuItem>
            )
          }
          <Divider />
          <MenuItem onClick={handleMenuClose}>
            <ListItemIcon>
              <PlaylistAddCircleIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText inset>New Thing</ListItemText>
          </MenuItem>
        </MenuList>
      </Menu>
    </Box>
  );
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
      type: "StoreAddFiles",
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