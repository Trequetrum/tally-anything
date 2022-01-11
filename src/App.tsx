
import './App.css';
import {Entry, MemoryStore} from './store'

import * as React from 'react';
import PropTypes from 'prop-types';

import { visuallyHidden } from '@mui/utils';
import {
  Button,
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  Container,
  Avatar,
  Tooltip,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  TableSortLabel
} from '@mui/material';

import MenuIcon from '@mui/icons-material/Menu';


function EnhancedTableHead(props: any) {

  const headCells = [
    {
      id: 'date',
      numeric: true,
      label: 'Date'
    },{
      id: 'count',
      numeric: false,
      label: 'Count'
    }
  ];

  const {
    order, 
    orderBy,
    rowCount, 
    onRequestSort 
  } = props;

  const createSortHandler = (property:any) => (event:any) => {
    onRequestSort(event, property);
  };

  return (
    <TableHead>
      <TableRow>
        {headCells.map((headCell) => (
          <TableCell
            key={headCell.id}
            align={headCell.numeric ? 'right' : 'left'}
            sortDirection={orderBy === headCell.id ? order : false}
          >
            <TableSortLabel
              active={orderBy === headCell.id}
              direction={orderBy === headCell.id ? order : 'asc'}
              onClick={createSortHandler(headCell.id)}
            >
              {headCell.label}
              {orderBy === headCell.id ? (
                <Box component="span" sx={visuallyHidden}>
                  {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                </Box>
              ) : null}
            </TableSortLabel>
          </TableCell>
        ))}
        <TableCell padding="normal"></TableCell>
      </TableRow>
    </TableHead>
  );
}

EnhancedTableHead.propTypes = {
  onRequestSort: PropTypes.func.isRequired,
  order: PropTypes.oneOf(['asc', 'desc']).isRequired,
  orderBy: PropTypes.string.isRequired,
  rowCount: PropTypes.number.isRequired,
};

function descendingComparator<T>(a: T, b: T, orderBy: keyof T) {
  if (b[orderBy] < a[orderBy]) {
    return -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return 1;
  }
  return 0;
}

function getComparator<Key extends keyof any>(
  order: 'asc' | 'desc',
  orderBy: Key,
): (
  a: { [key in Key]: number | string },
  b: { [key in Key]: number | string },
) => number {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

function EnhancedTable(params: any) {

  const rows: Entry[] = params.rows

  const [order, setOrder] = React.useState<'asc'|'desc'>('asc');
  const [orderBy, setOrderBy] = React.useState<keyof Entry>('date');
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(5);

  const handleRequestSort = (event:any, property:any) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleChangePage = (event:any, newPage:number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event:any) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Avoid a layout jump when reaching the last page with empty rows.
  const emptyRows = page > 0 ? 
    Math.max(0, (1 + page) * rowsPerPage - rows.length) : 
    0;

  return (
    <Box sx={{ width: '100%' }}>
      <Paper sx={{ width: '100%', mb: 2 }}>
        <TableContainer>
          <Table
            aria-labelledby="tableTitle"
            size="small"
          >
            <EnhancedTableHead
              order={order}
              orderBy={orderBy}
              onRequestSort={handleRequestSort}
              rowCount={rows.length}
            />
            <TableBody>
              {rows.slice().sort(getComparator(order, orderBy))
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((row, index) => {
                  
                  return (
                    <TableRow
                      tabIndex={-1}
                      key={`${row.count}:${row.date}`}
                    >
                      <TableCell
                        component="th"
                        scope="row"
                      >
                        {new Date(row.date).toLocaleDateString(undefined,{
                          day: "numeric",
                          year: "numeric",
                          month: "numeric",
                          hour: "numeric",
                          minute: "numeric",
                          second: "numeric"
                        })}
                      </TableCell>
                      <TableCell align="right">{row.count}</TableCell>
                      <TableCell align="center"><Button>Edit</Button></TableCell>
                    </TableRow>
                  );
                })}
              {emptyRows > 0 && (
                <TableRow
                  style={{
                    height: 33 * emptyRows,
                  }}
                >
                  <TableCell colSpan={3} />
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={rows.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </Box>
  );
}

function sum(list: Array<number>): number {
  return list.reduce((prev, curr) => prev + curr, 0);
}

function tallyRound(a: number): number {
  return Math.round(a * 10) / 10
}

function mergeDays(a: Entry[]): Entry[] {
  const mapo = new Map<number, number>();
  for (let v of a){
    const prev = mapo.get(v.date) || 0;
    mapo.set(v.date, prev + v.count);
  }
  return Array.from(mapo, ([date, count]) => ({ count, date }));
}


function TallyViewTable(params:{
  dispList: {label:string, value: number}[]
}){

  return (
    <Box sx={{ width: '100%' }}>
      <Paper sx={{ width: '100%', mb: 2 }}>
        <Table
          size="small" 
          aria-label="a dense table"
        >
          <TableBody>
            {params.dispList.map(v => 
              <TableRow sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                <TableCell component="th" scope="row">
                  <em>{v.label}</em>
                </TableCell>
                <TableCell align="right">{tallyRound(v.value)}</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  )
}

function TallyView(
  {heading, entries}: {heading: string, entries:Entry[]}
) {

  const mergedEntries = mergeDays(entries)

  const currentDate = new Date()
  const currentTime = currentDate.getMilliseconds()

  const last7Days = mergedEntries.filter(v => v.date > (currentTime - 604800000))
  const last30Days = mergedEntries.filter(v => v.date > (currentTime - 2592000000))

  const avg7Days = sum(last7Days.map(v => v.count)) / 7
  const avg30Days = sum(last30Days.map(v => v.count)) / 30

  const dayOfTheWeek = currentDate.getDay();
  const thisWeekMs = dayOfTheWeek * 86400000
  const avgWeek = sum(last7Days
    .filter(v => v.date > (currentTime - thisWeekMs))
    .map(v => v.count)
  ) / dayOfTheWeek

  const dayOfTheMonth = currentDate.getDate() 
  const thisMonthMs = dayOfTheMonth * 86400000
  const avgMonth = sum(last30Days
    .filter(v => v.date > (currentTime - thisMonthMs))
    .map(v => v.count)
  ) / dayOfTheMonth

  return (
      <div>
        <h1>{heading}</h1>
        <TallyViewTable dispList={[
          {label: "7 Day Avg:", value: avg7Days},
          {label: "30 Day Avg:", value: avg30Days},
          {label: "Avg this Week:", value: avgWeek},
          {label: "Avg this Month:", value: avgMonth}
        ]}/>
        <EnhancedTable rows={entries}/>
      </div>
  )

}


function ResponsiveAppBar() {

  const pages: string[] = [];
  const settings = ['Cookies', 'Google Docs', 'TODO', 'Clear'];

  const [anchorElNav, setAnchorElNav] = React.useState(null);
  const [anchorElUser, setAnchorElUser] = React.useState(null);

  const handleOpenNavMenu = (event:any) => {
    setAnchorElNav(event.currentTarget);
  };
  const handleOpenUserMenu = (event:any) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  return (
    <AppBar position="static">
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{ mr: 2, display: { xs: 'none', md: 'flex' } }}
          >
            TALLY
          </Typography>

          <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleOpenNavMenu}
              color="inherit"
            >
              <MenuIcon />
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorElNav}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
              }}
              open={Boolean(anchorElNav)}
              onClose={handleCloseNavMenu}
              sx={{
                display: { xs: 'block', md: 'none' },
              }}
            >
              {pages.map((page) => (
                <MenuItem key={page} onClick={handleCloseNavMenu}>
                  <Typography textAlign="center">{page}</Typography>
                </MenuItem>
              ))}
            </Menu>
          </Box>
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}
          >
            TALLY
          </Typography>
          <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
            {pages.map((page) => (
              <Button
                key={page}
                onClick={handleCloseNavMenu}
                sx={{ my: 2, color: 'white', display: 'block' }}
              >
                {page}
              </Button>
            ))}
          </Box>

          <Box sx={{ flexGrow: 0 }}>
            <Tooltip title="Open settings">
              <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                <Avatar alt="Remy Sharp" src="/static/images/avatar/2.jpg" />
              </IconButton>
            </Tooltip>
            <Menu
              sx={{ mt: '45px' }}
              id="menu-appbar"
              anchorEl={anchorElUser}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorElUser)}
              onClose={handleCloseUserMenu}
            >
              {settings.map((setting) => (
                <MenuItem key={setting} onClick={handleCloseNavMenu}>
                  <Typography textAlign="center">{setting}</Typography>
                </MenuItem>
              ))}
            </Menu>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

function App(): JSX.Element {
  const store = new MemoryStore().getTaggedData("pushups")
  return (
    <div className="App">
      <ResponsiveAppBar />
      <Box sx={{display: 'flex', justifyContent: 'center'}}>
        <TallyView heading={store.tag} entries={store.entries}/>
      </Box>
    </div>
  );
}

export default App;