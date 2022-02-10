import { SortDirection } from '@material-ui/core';
import { AggFields } from './chart/D3Chart';

const desc = <T>(a: T, b: T, key: SortableKeys) => {
  if (b[key] < a[key]) return -1;
  else if (b[key] > a[key]) return 1;
  else return 0;
};

export const stableSort = <T>(array: T[], key: SortableKeys, direction: SortDirection): T[] => {
  const stabilizedThis = array.map((el, index): [T, number] => [el, index]);
  const sign = direction === 'desc' ? 1 : -1;
  stabilizedThis.sort((a, b) => {
    const order = sign * desc(a[0], b[0], key);
    if (order !== 0) return order;
    return sign * (a[1] - b[1]);
  });
  return stabilizedThis.map(el => el[0]);
};

export type SortableKeys = 'name' | 'count' | 'amount';

export const isAgg = (key: SortableKeys): key is keyof AggFields => ['count', 'amount'].includes(key);