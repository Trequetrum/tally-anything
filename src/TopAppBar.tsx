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
  PlaylistAddCheckCircle as PlaylistAddCheckCircleIcon,
  PlaylistAddCircle as PlaylistAddCircleIcon,
  AccountCircle as AccountCircleIcon
} from '@mui/icons-material';

import {
  logout, 
  getOAuthInstance 
} from './GoogleDrive/gdrive-login'

export { TopAppBar }

function TopAppBar(
  { logginState, tags, setTag }:
    {
      logginState: {
        isLoggedIn: boolean, 
        userName: string
      },
      tags: string[],
      setTag: (a:string) => void
    }
) {
  const [menuAnchorEl, setMenuAnchorEl] = React.useState<null | HTMLElement>(null);
  const isMenuOpen = Boolean(menuAnchorEl);
  const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };
  const handleMenuClose = () => setMenuAnchorEl(null);

  const [accAnchorEl, setAccAnchorEl] = React.useState<null | HTMLElement>(null);
  const isAccOpen = Boolean(accAnchorEl);
  const handleAccClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAccAnchorEl(event.currentTarget);
  };
  const handleAccClose = () => setAccAnchorEl(null);

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>

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
                      setTag(tag);
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

          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            TALLY
          </Typography>

          <div>
            {logginState.userName || ""}
          </div>

          <IconButton
            size="large"
            color="inherit"
            aria-label="account"
            onClick={handleAccClick}
          >
            <AccountCircleIcon />
          </IconButton>
          <Menu
            id="app-bar-acc-options"
            anchorEl={accAnchorEl}
            open={isAccOpen}
            onClose={handleAccClose}
          >
            {
              logginState.isLoggedIn ?
                <MenuItem onClick={() => {
                  logout();
                  handleMenuClose();
                }}>
                  <ListItemIcon>
                    <LogoutIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText inset>Logout</ListItemText>
                </MenuItem> :
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

        </Toolbar>
      </AppBar>
    </Box>

  );
}