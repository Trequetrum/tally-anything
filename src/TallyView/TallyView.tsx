
import { Dispatch } from 'react';
import { Box } from '@mui/material';
import {
  getHours,
  endOfDay,
  getDayOfYear,
  isThisMonth,
  isThisWeek,
  isThisYear,
  isToday,
  sub,
  isWithinInterval
} from 'date-fns'

import { compareEntryTimeDesc, Entry } from '../StorageService/store'
import { EntriesTable } from './EntriesTable'
import { SummaryTable } from './SummaryTable'
import { TallyWriter } from './TallyWriter'
import { mergeDays, sum } from '../util';
import { TagStateEntries } from '../App';
import { StoreAction } from '../StorageService/store-reducer';

export { TallyView }

function TallyView(
  { tag, entries, storeDispatch }:
    {
      tag: string;
      entries: TagStateEntries;
      storeDispatch: Dispatch<StoreAction>;
    }
) {

  const entriesLoading = entries === "Loading";
  const dispList = entriesLoading ? [] : summary(entries);

  const tallyButtons = entriesLoading ? [] : decideWritterButtons(entries);

  return (
    <div>
      <h1>{tag}</h1>
      <TallyWriter tag={tag} tallyButtons={tallyButtons} storeDispatch={storeDispatch} />
      <h4 style={entriesLoading ? {} : { display: 'none' }}>
        Loading Entries
      </h4>
      <Box sx={{ display: !entriesLoading && entries.length > 0 ? 'block' : 'none' }} >
        <SummaryTable
          key="st"
          dispList={dispList}
        />
        <EntriesTable
          key="et"
          tag={tag}
          entries={entriesLoading ? [] : entries}
          storeDispatch={storeDispatch}
        />
      </Box>
    </div>
  );
}

function summary(entries: Entry[]): ({ label: string, avg: number, total: number })[] {
  let dispList: ({ label: string, avg: number, total: number })[] = []

  const mergedEntries = mergeDays(entries);

  const currentDate = new Date();
  const endOfToday = endOfDay(currentDate);

  const thisYear = mergedEntries.filter(v => isThisYear(v.date));

  const interval30Days = { start: sub(endOfToday, { days: 30 }), end: endOfToday }
  const last30Days = mergedEntries.filter(v => isWithinInterval(v.date, interval30Days));
  const interval7Days = { start: sub(endOfToday, { days: 7 }), end: endOfToday }
  const last7Days = last30Days.filter(v => isWithinInterval(v.date, interval7Days));
  const today = last7Days.filter(v => isToday(v.date));

  const todayTotal = today[0]?.count || 0
  dispList.push({
    label: "Today:",
    avg: todayTotal / getHours(currentDate),
    total: todayTotal
  });

  const totalLast7Days = sum(last7Days.map(v => v.count));
  dispList.push({
    label: "7 Days",
    avg: totalLast7Days / 7,
    total: totalLast7Days
  });

  const totalLast30Days = sum(last30Days.map(v => v.count))
  dispList.push({
    label: "30 Days",
    avg: totalLast30Days / 30,
    total: totalLast30Days
  });

  const _dayOfTheWeek = currentDate.getDay();
  const dayOfTheWeek = _dayOfTheWeek === 0 ? 7 : _dayOfTheWeek;
  const totalThisWeek = sum(last7Days
    .filter(v => isThisWeek(v.date, { weekStartsOn: 1 }))
    .map(v => v.count)
  );
  dispList.push({
    label: "This Week:",
    avg: totalThisWeek / dayOfTheWeek,
    total: totalThisWeek
  });

  const dayOfTheMonth = currentDate.getDate();
  const totalThisMonth = sum(last30Days
    .filter(v => isThisMonth(v.date))
    .map(v => v.count)
  );
  dispList.push({
    label: "This Month:",
    avg: totalThisMonth / dayOfTheMonth,
    total: totalThisMonth
  });

  const dayOfTheYear = getDayOfYear(currentDate);
  const totalThisYear = sum(thisYear.map(v => v.count));
  dispList.push({
    label: "This Year:",
    avg: totalThisYear / dayOfTheYear,
    total: totalThisYear
  });

  return dispList;
}

function decideWritterButtons(entries: Entry[]): number[] {
  let includes = new Set<number>();
  entries.sort(compareEntryTimeDesc).forEach(({ count }) => {
    if (includes.size < 8) {
      includes.add(count);
    }
  })
  return Array.from(includes);
}