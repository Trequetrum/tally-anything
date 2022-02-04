import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Paper,
  TableHead,
  tableCellClasses,
} from "@mui/material";

import { mergeDays, sum, tallyRound } from "../util";
import {
  endOfDay,
  isThisYear,
  sub,
  isWithinInterval,
  isToday,
  isThisWeek,
  isThisMonth,
  getDayOfYear,
} from "date-fns";
import { Entry } from "../StorageService/store";

export { SummaryTable };

function SummaryTable({ entries }: { entries: Entry[] }) {
  const dispList = summary(entries);

  return (
    <Box sx={{ width: "100%" }}>
      <Paper elevation={1} sx={{ mx: 1 }}>
        <Table
          size="small"
          aria-label="a dense table"
          sx={{
            [`& .${tableCellClasses.root}`]: {
              borderBottom: "none",
            },
          }}
        >
          <TableHead>
            <TableRow>
              <TableCell></TableCell>
              <TableCell align="right">Avg/Day</TableCell>
              <TableCell align="right">Total</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {dispList.map((v) => (
              <TableRow
                key={v.label}
                sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
              >
                <TableCell component="th" scope="row">
                  <em>{v.label}</em>
                </TableCell>
                <TableCell align="right">
                  {v.avg !== v.total ? tallyRound(v.avg) : ""}
                </TableCell>
                <TableCell align="right">{tallyRound(v.total)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}

function summary(entries: Entry[]): {
  label: string;
  avg: number;
  total: number;
}[] {
  
  let dispList: {
    label: string;
    avg: number;
    total: number;
  }[] = [];

  const mergedEntries = mergeDays(entries);

  const currentDate = new Date();
  const endOfToday = endOfDay(currentDate);

  const thisYear = mergedEntries.filter((v) => isThisYear(v.date));

  const interval30Days = {
    start: sub(endOfToday, { days: 30 }),
    end: endOfToday,
  };
  const last30Days = mergedEntries.filter((v) =>
    isWithinInterval(v.date, interval30Days)
  );
  const interval7Days = {
    start: sub(endOfToday, { days: 7 }),
    end: endOfToday,
  };
  const last7Days = last30Days.filter((v) =>
    isWithinInterval(v.date, interval7Days)
  );
  const today = last7Days.filter((v) => isToday(v.date));

  const todayTotal = today[0]?.count || 0;
  dispList.push({
    label: "Today",
    avg: todayTotal,
    total: todayTotal,
  });

  const totalLast7Days = sum(last7Days.map((v) => v.count));
  dispList.push({
    label: "7 Days",
    avg: totalLast7Days / 7,
    total: totalLast7Days,
  });

  const totalLast30Days = sum(last30Days.map((v) => v.count));
  dispList.push({
    label: "30 Days",
    avg: totalLast30Days / 30,
    total: totalLast30Days,
  });

  const _dayOfTheWeek = currentDate.getDay();
  const dayOfTheWeek = _dayOfTheWeek === 0 ? 7 : _dayOfTheWeek;
  const totalThisWeek = sum(
    last7Days
      .filter((v) => isThisWeek(v.date, { weekStartsOn: 1 }))
      .map((v) => v.count)
  );
  dispList.push({
    label: "This Week",
    avg: totalThisWeek / dayOfTheWeek,
    total: totalThisWeek,
  });

  const dayOfTheMonth = currentDate.getDate();
  const totalThisMonth = sum(
    last30Days.filter((v) => isThisMonth(v.date)).map((v) => v.count)
  );
  dispList.push({
    label: "This Month",
    avg: totalThisMonth / dayOfTheMonth,
    total: totalThisMonth,
  });

  const dayOfTheYear = getDayOfYear(currentDate);
  const totalThisYear = sum(thisYear.map((v) => v.count));
  dispList.push({
    label: "This Year",
    avg: totalThisYear / dayOfTheYear,
    total: totalThisYear,
  });

  return dispList;
}
