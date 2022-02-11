import * as React from "react";
import { Dispatch } from "react";

import { Entry, StoreEntry } from "../StorageService/store";
import { visuallyHidden } from "@mui/utils";
import type {} from "@mui/lab/themeAugmentation";
import AdapterDateFns from "@mui/lab/AdapterDateFns";
import { LocalizationProvider, MobileDateTimePicker } from "@mui/lab";
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
  TextField,
  tableCellClasses,
} from "@mui/material";
import { getComparator, dateString, shallowEqual } from "../util";
import {
  NumericFieldOutput,
  NumericTextField,
} from "../BasicComponents/NumericTextField";
import { StoreAction } from "../StorageService/store-reducer";

export { EntriesTable };

function EntriesTable({
  tag,
  entries,
  storeDispatch,
}: {
  tag: string;
  entries: Entry[];
  storeDispatch: Dispatch<StoreAction>;
}) {
  const rows = entries;

  const [order, setOrder] = React.useState<"asc" | "desc">("desc");
  const [orderBy, setOrderBy] = React.useState<keyof Entry>("date");
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(5);
  const [editDialogState, setEditDialogState] = React.useState<
    "Closed" | StoreEntry
  >("Closed");

  const handleRequestSort = (property: keyof Entry) => () => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = ({
    target,
  }: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(target.value, 10));
    setPage(0);
  };

  // Avoid a layout jump when reaching the last page with empty rows.
  const emptyRows =
    page > 0 ? Math.max(0, (1 + page) * rowsPerPage - rows.length) : 0;

  const headCells: {
    id: keyof Entry;
    numeric: boolean;
    label: string;
  }[] = [
    {
      id: "date",
      numeric: false,
      label: "Date",
    },
    {
      id: "count",
      numeric: true,
      label: "Count",
    },
  ];
  //sx={{ width: '100%' }}
  return (
    <Box>
      <TableContainer>
        <Table
          aria-labelledby="tableTitle"
          size="small"
          sx={{
            [`& .${tableCellClasses.root}`]: {
              borderBottom: "none",
            },
          }}
        >
          <TableHead>
            <TableRow>
              {headCells.map((headCell) => (
                <TableCell
                  key={headCell.id}
                  align={headCell.numeric ? "right" : "left"}
                  sortDirection={orderBy === headCell.id ? order : false}
                >
                  <TableSortLabel
                    active={orderBy === headCell.id}
                    direction={orderBy === headCell.id ? order : "asc"}
                    onClick={handleRequestSort(headCell.id)}
                  >
                    {headCell.label}
                    {orderBy === headCell.id ? (
                      <Box component="span" sx={visuallyHidden}>
                        {order === "desc"
                          ? "sorted descending"
                          : "sorted ascending"}
                      </Box>
                    ) : null}
                  </TableSortLabel>
                </TableCell>
              ))}
              <TableCell padding="normal"></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows
              .slice()
              .sort(getComparator(order, orderBy))
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((entry) => (
                <TableRow
                  tabIndex={-1}
                  key={`${tag}:${entry.count}:${entry.date.getTime()}`}
                >
                  <TableCell component="th" scope="row">
                    {dateString(entry.date)}
                  </TableCell>
                  <TableCell align="right">{entry.count}</TableCell>
                  <TableCell align="center">
                    <Button
                      onClick={() =>
                        setEditDialogState({
                          tag,
                          ...entry,
                        })
                      }
                    >
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
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
      <EditEntryDialog
        storeDispatch={storeDispatch}
        state={editDialogState}
        setState={setEditDialogState}
      />
    </Box>
  );
}

function EditEntryDialog({
  state,
  setState,
  storeDispatch,
}: {
  state: "Closed" | StoreEntry;
  setState: (a: "Closed" | StoreEntry) => void;
  storeDispatch: Dispatch<StoreAction>;
}) {
  const open = state !== "Closed";
  const [num, setNum] = React.useState<NumericFieldOutput>("Empty");
  const [dateTimeValue, setDateTimeValue] = React.useState<Date | null>(null);
  const handleClose = () => setState("Closed");

  const handleUpdate = () => {
    if (open) {
      const newEntry: StoreEntry = {
        tag: state.tag,
        count: typeof num == "number" ? num : state.count,
        date: dateTimeValue != null ? dateTimeValue : state.date,
      };

      if (!shallowEqual(state, newEntry)) {
        storeDispatch({
          type: "Update",
          oldEntry: state,
          newEntry,
        });
      }

      handleClose();
    }
  };

  const handleDelete = () => {
    if (open) {
      storeDispatch({
        type: "Delete",
        entry: state,
      });

      handleClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>Edit {open ? state.tag : ""} Entry</DialogTitle>
      <DialogContent
        sx={{
          rowGap: 2,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <NumericTextField
          sx={{ marginTop: 1 }}
          id="count_by_numbers"
          label={`Update Tally: ${open ? state.count : ""}`}
          onChange={setNum}
        />
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <MobileDateTimePicker
            renderInput={(props) => <TextField {...props} />}
            label="Update Date & Time"
            value={dateTimeValue}
            onChange={(newValue) => {
              setDateTimeValue(newValue);
            }}
          />
        </LocalizationProvider>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleDelete}>Delete</Button>
        <Button onClick={handleUpdate}>Update</Button>
      </DialogActions>
    </Dialog>
  );
}
