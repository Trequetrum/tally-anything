
import * as React from 'react';

import { Entry } from '../store'
import { EntriesTable } from './EntriesTable'
import { SummaryTable } from './SummaryTable'
import { TallyWriter } from './TallyWriter'
import { mergeDays, sum } from './util';
import { TaggedEntries, StoreWriter } from '../store';

export { TallyView }
function TallyView(
  { tagSate, storeDispatch }:
    {
      tagSate: {
        tag: null | string,
        entries: "Loading" | Entry[]
      },
      storeDispatch: StoreWriter
    }
) {
  const tag = tagSate.tag

  const mergedEntries = mergeDays(tagSate.entries)

  const currentDate = new Date()
  const currentTime = currentDate.getTime()

  const thisYear = mergedEntries.filter(v => new Date(v.date).getFullYear() == currentDate.getFullYear())
  const last30Days = mergedEntries.filter(v => v.date > (currentTime - 2592000000))
  const last7Days = last30Days.filter(v => v.date > (currentTime - 604800000))
  const last24Hrs = last7Days.filter(v => v.date > (currentTime - 86400000))

  const numToday = last24Hrs[0]?.count || 0
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
  
  const avgThisYear = sum(thisYear.map(v => v.count)) / dayOfTheYear

  return (
    <div>
      <h1>{tag}</h1>
      <TallyWriter tag={tag} storeDispatch={storeDispatch} />
      <SummaryTable dispList={[
        { label: "Total Today:", value: numToday },
        { label: "7 Day Avg:", value: avg7Days },
        { label: "30 Day Avg:", value: avg30Days },
        { label: "Avg this Week:", value: avgWeek },
        { label: "Avg this Month:", value: avgMonth },
        { label: "Avg this Year:", value: avgThisYear }
      ]} />
      <EntriesTable taggedEntries={taggedEntries} storeDispatch={storeDispatch}/>
    </div>
  )

}