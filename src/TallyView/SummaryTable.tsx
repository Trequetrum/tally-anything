import * as React from 'react';

import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Paper,
  TableHead
} from '@mui/material';

import { tallyRound } from '../util';

export { SummaryTable }

function SummaryTable(params: {
  dispList: { label: string, avg: number, total: number }[];
}) {
  return (
    <Box sx={{ width: '100%' }}>
      <Paper sx={{ width: '100%', mb: 2 }}>
        <Table
          size="small"
          aria-label="a dense table"
        >
          <TableHead>
            <TableRow>
              <TableCell></TableCell>
              <TableCell align="right">Avg</TableCell>
              <TableCell align="right">Total</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {params.dispList.map(v =>
              <TableRow key={v.label} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                <TableCell component="th" scope="row">
                  <em>{v.label}</em>
                </TableCell>
                <TableCell align="right">{tallyRound(v.avg)}</TableCell>
                <TableCell align="right">{tallyRound(v.total)}</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  )
}