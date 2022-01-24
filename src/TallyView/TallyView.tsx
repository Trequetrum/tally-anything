
import { Box } from '@mui/material';
import * as React from 'react';

import { Entry } from '../StorageService/store'
import { StoreWriter } from '../StorageService/store-reducer';
import { EntriesTable } from './EntriesTable'
import { SummaryTable } from './SummaryTable'
import { TallyWriter } from './TallyWriter'
import { mergeDays, sum } from './util';

export { TallyView }

function TallyView(
  { tag, entries, storeDispatch }:
    {
      tag: string,
      entries: "Loading" | Entry[],
      storeDispatch: StoreWriter
    }
) {

  let dispList = [];

  if(entries != "Loading"){
    const mergedEntries = mergeDays(entries);

    const currentDate = new Date()
    const currentTime = currentDate.getTime()

    const thisYear = mergedEntries.filter(v => new Date(v.date).getFullYear() == currentDate.getFullYear())
    const last30Days = mergedEntries.filter(v => v.date > (currentTime - 2592000000))
    const last7Days = last30Days.filter(v => v.date > (currentTime - 604800000))
    const last24Hrs = last7Days.filter(v => v.date > (currentTime - 86400000))

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

    const dayOfTheWeek = currentDate.getDay();
    const thisWeekMs = dayOfTheWeek * 86400000
    dispList.push({
      label: "Avg this Week:", 
      value: sum(last7Days
        .filter(v => v.date > (currentTime - thisWeekMs))
        .map(v => v.count)
      ) / dayOfTheWeek == 0 ? 7 : dayOfTheWeek
    });

    const dayOfTheMonth = currentDate.getDate()
    const thisMonthMs = dayOfTheMonth * 86400000
    dispList.push({
      label: "Avg this Month:", 
      value: sum(last30Days
        .filter(v => v.date > (currentTime - thisMonthMs))
        .map(v => v.count)
      ) / dayOfTheMonth
    });

    const dayOfTheYear = (Date.UTC(
      currentDate.getFullYear(), 
      currentDate.getMonth(), 
      currentDate.getDate()
    ) - 
    Date.UTC(
      currentDate.getFullYear(), 
      0, 
      0
    )) / 24 / 60 / 60 / 1000;
    
    dispList.push({
      label: "Avg this Year:", 
      value: sum(thisYear.map(v => v.count)) / dayOfTheYear
    });
  }

  return (
    <div>
      <h1>{tag}</h1>
      <TallyWriter tag={tag} storeDispatch={storeDispatch} />
        <h4 style={entries == "Loading" ? {} : { display: 'none' }}>
          Loading Entries
        </h4>
        <Box sx={{ display: entries?.length > 0 ? 'block' : 'none'}} >
          <SummaryTable 
            key="st" 
            dispList={dispList} 
          />,
          <EntriesTable 
            key="et" 
            tag={tag}
            entries={entries == "Loading" ? [] : entries} 
            storeDispatch={storeDispatch}
          />
        </Box>
        
    </div>
  )

}