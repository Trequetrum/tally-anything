import * as React from 'react';

import { 
  Entry,
  TaggedEntries, 
  StoreEntry, 
  StoreWriter
} from '../store'
import { visuallyHidden } from '@mui/utils';
import type {} from '@mui/lab/themeAugmentation';
import AdapterDateFns from '@mui/lab/AdapterDateFns';
import {
  LocalizationProvider, 
  MobileDateTimePicker
} from '@mui/lab';
import {
  Button,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  TableSortLabel,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField
} from '@mui/material';
import {
  getComparator,
  dateString,
  shallowEqual
} from './util';
import {
  NumericFieldOutput,
  NumericTextField
} from '../BasicComponents/NumericTextField';

export { EntriesTable }

function EntriesTable(
  { taggedEntries, storeDispatch }:
    {
      taggedEntries: TaggedEntries,
      storeDispatch: StoreWriter
    }
) {

  console.log("Render EntriesTable")

  const rows = taggedEntries.entries

  const [order, setOrder] = React.useState<'asc' | 'desc'>('desc');
  const [orderBy, setOrderBy] = React.useState<keyof Entry>('date');
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(5);
  const editDialogOpener = React.useRef((entry: StoreEntry) => {});

  const handleRequestSort = (property: keyof Entry) => () => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = ({ target }: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(target.value, 10));
    setPage(0);
  };

  // Avoid a layout jump when reaching the last page with empty rows.
  const emptyRows = page > 0 ?
    Math.max(0, (1 + page) * rowsPerPage - rows.length) :
    0;

  const headCells: ({
    id: keyof Entry
    numeric: boolean
    label: string
  })[] = [
      {
        id: 'date',
        numeric: true,
        label: 'Date'
      }, {
        id: 'count',
        numeric: false,
        label: 'Count'
      }
    ];

  return (
    <Box sx={{ width: '100%' }}>
      <Paper sx={{ width: '100%', mb: 2 }}>
        <TableContainer>
          <Table
            aria-labelledby="tableTitle"
            size="small"
          >
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
                      onClick={handleRequestSort(headCell.id)}
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
            <TableBody>
              {rows.slice().sort(getComparator(order, orderBy))
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map(entry => (
                  <TableRow tabIndex={-1} key={`${entry.count}:${entry.date}`}>
                    <TableCell component="th" scope="row">
                      {dateString(entry.date)}
                    </TableCell>
                    <TableCell align="right">{entry.count}</TableCell>
                    <TableCell align="center">
                      <Button onClick={() => editDialogOpener.current({
                        tag: taggedEntries.tag,
                        ...entry
                      })}>
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              }
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
      <EditEntryDialog storeDispatch={storeDispatch} opener={editDialogOpener}/>
    </Box>
  );
}

function EditEntryDialog(
  { opener, storeDispatch }:
    {
      opener: { current: (entry: StoreEntry) => void },
      storeDispatch: StoreWriter
    }
) {

    console.log("Calling useEditEntryDialog")

    const [open, setOpen] = React.useState(false);
    const [oldEntry, setOldEntry] = React.useState<StoreEntry>({ tag: "", count: 0, date: 0 });
    const [tagField, setTagField] = React.useState("")

    const [num, setNum] = React.useState<NumericFieldOutput>("Empty")

    const [dateTimeValue, setDateTimeValue] = React.useState<Date | null>(null);

    const handleClose = () => setOpen(false)
    const handleUpdate = () => {

      const newEntry = {
        tag: tagField.length > 0 ? tagField : oldEntry.tag,
        count: typeof num == 'number' ?
          num :
          oldEntry.count,
        date: dateTimeValue != null ? 
          dateTimeValue.getTime() :
          oldEntry.date
      } as StoreEntry

      if (!shallowEqual(oldEntry, newEntry)) {
        storeDispatch({oldEntry, newEntry})
      }

      handleClose()

    }

    opener.current = (entry: StoreEntry) => {
      setOldEntry(entry)
      setTagField('')
      setNum("Empty")
      setDateTimeValue(new Date(entry.date))
      setOpen(true)
    }

    return (
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Edit Tally Entry</DialogTitle>
        <DialogContent sx={{
          minWidth: 350,
          minHeight: 300,
          rowGap: 2,
          display: 'flex',
          flexDirection: 'column'
        }}>
          <TextField
            sx={{marginTop:2}}
            id="newTagField"
            label={`Current thing is ${oldEntry.tag}, update?`}
            variant="outlined"
            onChange={({ target }: any) => setTagField(target.value)}
          />
          <NumericTextField
            id="count_by_numbers"
            label={`Current Tally is ${oldEntry.count}, update?`}
            onChange={setNum}
          />
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <MobileDateTimePicker
              renderInput={(props) => <TextField {...props} />}
              label="DateTimePicker"
              value={dateTimeValue}
              onChange={(newValue) => {
                setDateTimeValue(newValue);
              }}
            />
          </LocalizationProvider>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleUpdate}>Update</Button>
        </DialogActions>
      </Dialog>
    )
  }

