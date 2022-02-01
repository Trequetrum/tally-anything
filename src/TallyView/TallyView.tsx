
import { Box } from '@mui/material';
import { getDayOfYear, isThisMonth, isThisWeek, isThisYear } from 'date-fns'

import { compareEntryTimeDesc, Entry } from '../StorageService/store'
import { StoreWriter } from '../StorageService/store-reducer';
import { EntriesTable } from './EntriesTable'
import { SummaryTable } from './SummaryTable'
import { TallyWriter } from './TallyWriter'
import { mergeDays, sum } from '../util';
import { TagStateEntries } from '../App';

export { TallyView }

function TallyView(
  { tag, entries, storeDispatch }:
    {
      tag: string,
      entries: TagStateEntries,
      storeDispatch: StoreWriter
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

const HOUR_MS = 3600000;
const DAY_MS = 24 * HOUR_MS;
const DAY_7_MS = 7 * DAY_MS;
const DAY_30_MS = 30 * DAY_MS;

function summary(entries: Entry[]): ({ label: string, value: number })[] {
  let dispList: ({ label: string, value: number })[] = []

  const mergedEntries = mergeDays(entries);

  const currentDate = new Date();
  const currentTime = currentDate.getTime();

  const thisYear = mergedEntries.filter(v => isThisYear(v.date));
  const last30Days = mergedEntries.filter(v => v.date.getTime() > (currentTime - DAY_30_MS));
  const last7Days = last30Days.filter(v => v.date.getTime() > (currentTime - DAY_7_MS));
  const last24Hrs = last7Days.filter(v => v.date.getTime() > (currentTime - DAY_MS));

  dispList.push({
    label: "Total Today:",
    value: last24Hrs[0]?.count || 0
  });
  dispList.push({
    label: "7 Day Avg:",
    value: sum(last7Days.map(v => v.count)) / 7
  });
  dispList.push({
    label: "30 Day Avg:",
    value: sum(last30Days.map(v => v.count)) / 30
  });

  const _dayOfTheWeek = currentDate.getDay();
  const dayOfTheWeek = _dayOfTheWeek == 0 ? 7 : _dayOfTheWeek;
  dispList.push({
    label: "Avg this Week:",
    value: sum(last7Days
      .filter(v => isThisWeek(v.date, { weekStartsOn: 1 }))
      .map(v => v.count)
    ) / dayOfTheWeek
  });

  const dayOfTheMonth = currentDate.getDate();
  dispList.push({
    label: "Avg this Month:",
    value: sum(last30Days
      .filter(v => isThisMonth(v.date))
      .map(v => v.count)
    ) / dayOfTheMonth
  });

  const dayOfTheYear = getDayOfYear(currentDate);

  dispList.push({
    label: "Avg this Year:",
    value: sum(thisYear.map(v => v.count)) / dayOfTheYear
  });

  return dispList;
}

function decideWritterButtons(entries: Entry[]): number[] {
  let includes = new Set<number>();
  entries.sort(compareEntryTimeDesc).forEach(({count}) => {
    if(includes.size < 8){
      includes.add(count);
    }
  })
  return Array.from(includes);
}