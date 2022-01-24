import * as React from 'react';

import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Paper
} from '@mui/material';

import { tallyRound } from './util';

export { SummaryTable }

function SummaryTable(params: {
  dispList: { label: string, value: number }[]
}) {
  return (
    <Box sx={{ width: '100%' }}>
      <Paper sx={{ width: '100%', mb: 2 }}>
        <Table
          size="small"
          aria-label="a dense table"
        >
          <TableBody>
            {params.dispList.map(v =>
              <TableRow key={v.label} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
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