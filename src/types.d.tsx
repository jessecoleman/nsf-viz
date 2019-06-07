import { ChangeEvent } from 'react';

export type Division = {
  title: string
  selected: boolean
  count: number | ''
  amount: number | ''
}

export type SortDirection = 'asc' | 'desc' | undefined;
//export type CheckboxCallback = (e: ChangeEvent<HTMLInputElement>, checked: boolean) => void;
export type CheckboxCallback = (checked: boolean) => void;

export type GridSize = 'boolean | "auto" | 2 | 1 | 7 | 3 | 4 | 5 | 6 | 8 | 9 | 10 | 11 | 12 | undefined';

export type GrantColumn = {
  id: string,
  numeric: boolean,
  label: string,
  gridSize: GridSize,
}
