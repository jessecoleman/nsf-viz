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


