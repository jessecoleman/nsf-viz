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
  years: {
    buckets: Key[]
  }
}

export type PerDivision = {
  years: {
    buckets: Key[]
  }
}

export type Division = {
  title: string
  count: number | ''
  amount: number | ''
  selected: boolean
}

export type SortDirection = 'asc' | 'desc' | undefined;
//export type CheckboxCallback = (e: ChangeEvent<HTMLInputElement>, checked: boolean) => void;
export type CheckboxCallback = (checked: boolean) => void;

export type GridSize = boolean | "auto" | 2 | 1 | 7 | 3 | 4 | 5 | 6 | 8 | 9 | 10 | 11 | 12 | undefined;

export type GrantColumn = {
  id: string,
  numeric: boolean,
  label: string,
  gridSize: GridSize,
}
