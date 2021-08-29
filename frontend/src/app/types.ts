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
  grant_amounts: { value: number }
}

export type Key = {
  key_as_string: string
  doc_count: number
  grant_amounts: { value: number }
  divisions: {
    buckets: Bucket[]
  }
}

export type PerYear = Array<{
  key?: string
  key_as_string: string
  doc_count: number
  grant_amounts: {
    value: number
  },
}>

export type PerDivision = Array<{
  key_as_string: string
  doc_count: number
  grant_amounts: {
    value: number
  },
  divisions: {
    buckets: Array<{
      key: string
      doc_count: number
    }>
  }
}>

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