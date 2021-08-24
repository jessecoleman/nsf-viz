import { GridSize } from '@material-ui/core';

export type Grant = {
  id: string
  title: string
  date: string
  amount: number
  division: string
}

export type GrantOrder = [ keyof Grant, SortDirection ];

export type Bucket = {
  key: string
  doc_count: number
}

export type Key = {
  key_as_string: string
  doc_count: number
  divisions: {
    buckets: Bucket[]
  }
}

export type PerYear = {
  divisions: {
    buckets: Key[]
  }
}

export type PerDivision = {
  years: {
    buckets: Key[]
  }
}

export type Division = {
  key: string
  name: string
  count: number | ''
  amount: number | ''
}

export type SortDirection = 'asc' | 'desc';

export type GrantColumn = {
  id: string,
  numeric: boolean,
  label: string,
  gridSize: GridSize,
}