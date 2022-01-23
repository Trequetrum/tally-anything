
import { Entry } from '../StorageService/store'

export function shallowEqual(a:any, b:any){
  return a === b || (
    Object.keys(a).length === Object.keys(b).length &&
    Object.keys(a).every(key => 
      b.hasOwnProperty(key) && a[key] === b[key]
    )
  )
}

export function dateString(date: number): string {
  const a = new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    year: "numeric",
    month: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric"
  });
  return a.format(new Date(date))
}

export function descendingComparator<T>(a: T, b: T, orderBy: keyof T): 1 | -1 | 0 {
  if (b[orderBy] < a[orderBy]) {
    return -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return 1;
  }
  return 0;
}

export function getComparator<Key extends keyof any>(
  order: 'asc' | 'desc',
  orderBy: Key,
): (
    a: { [key in Key]: number | string },
    b: { [key in Key]: number | string },
  ) => number {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => descendingComparator(b, a, orderBy);
}

export function sum(list: Array<number>): number {
  return list.reduce((prev, curr) => prev + curr, 0);
}

export function tallyRound(a: number): number {
  return Math.round(a * 10) / 10
}

export function mergeDays(a: Entry[]): Entry[] {
  const dayInMs = 86400000
  const mapo = new Map<number, number>();
  for (let v of a) {
    const newDate = Math.floor(v.date / dayInMs) * dayInMs
    const prev = mapo.get(newDate) || 0;
    mapo.set(newDate, prev + v.count);
  }
  return Array.from(mapo, ([date, count]) => ({ date, count }));
}