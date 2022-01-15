
import * as React from 'react';

import { Entry } from '../store'
import { EntriesTable } from './EntriesTable'
import { SummaryTable } from './SummaryTable'
import { TallyWriter } from './TallyWriter'
import { mergeDays, sum } from './util';
import { StoreCashe, TaggedEntries } from '../store';

export { TallyView }

function TallyView(
  { taggedEntries, store }:
    {
      taggedEntries: TaggedEntries,
      store: StoreCashe
    }
) {
  const tag = taggedEntries.tag

  const mergedEntries = mergeDays(taggedEntries.entries)

  const currentDate = new Date()
  const currentTime = currentDate.getTime()

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

  return (
    <div>
      <h1>{tag}</h1>
      <TallyWriter tag={tag} store={store} />
      <SummaryTable dispList={[
        { label: "Total Today:", value: numToday },
        { label: "7 Day Avg:", value: avg7Days },
        { label: "30 Day Avg:", value: avg30Days },
        { label: "Avg this Week:", value: avgWeek },
        { label: "Avg this Month:", value: avgMonth }
      ]} />
      <EntriesTable taggedEntries={taggedEntries} store={store}/>
    </div>
  )

}