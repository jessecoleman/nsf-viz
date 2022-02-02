import { createSlice } from '@reduxjs/toolkit';
import { loadDirectory, loadDivisions } from './actions';
import { Division } from '../oldapi/models/Division';
import { Directory, Grant } from 'api';

type Field = 'title' | 'abstract';

export type Term = {
  term: string,
  count?: number,
  selected?: boolean,
}

export type SortDirection = 'asc' | 'desc';

export type GrantOrder = [ keyof Grant, SortDirection ];

export type DivisionKey = 'name' | 'count' | 'amount';

export type DivisionOrder = [ DivisionKey, SortDirection ];

export type FilterState = {
  drawerOpen: boolean,
  boolQuery: 'any' | 'all',
  terms: Term[],
  directory: Record<string, Directory[]>,
  divisions: Record<string, Division[]>,
  highlightedDivision?: string,
  fields: Field[],
  divisionOrder: DivisionOrder,
  grantOrder: GrantOrder,
  legendFilters: {
    bool: 'any' | 'all'
    counts: boolean,
    amounts: boolean,
  },
}

const initialState: FilterState = {
  drawerOpen: false,
  boolQuery: 'any',
  terms: [],
  directory: {},
  divisions: {},
  fields: ['title', 'abstract'],
  divisionOrder: ['name', 'desc'],
  grantOrder: ['date', 'desc'],
  legendFilters: {
    bool: 'any',
    counts: true,
    amounts: true,
  }
};

const filterSlice = createSlice({
  name: 'filter',
  initialState,
  reducers: {
    toggleDrawerOpen: (state, action) => {
      state.drawerOpen = action.payload;
    },
    highlightDivision: (state, action) => {
      state.highlightedDivision = action.payload;
    },
    setGrantOrder: (state, action) => {
      state.grantOrder = action.payload;
    },
    setLegendFilters: (state, action) => {
      state.legendFilters = {
        ...state.legendFilters,
        ...action.payload,
      };
    }
  },
  extraReducers: builder => builder
    .addCase(loadDivisions.fulfilled, (state, action) => {
      state.divisions = Object.fromEntries(action.payload.map((divs, i) => [
        ['nsf', 'nih', 'dod'][i], divs
      ]));
    })
    .addCase(loadDirectory.fulfilled, (state, action) => {
      state.directory = Object.fromEntries(action.payload.map((divs, i) => [
        ['nsf', 'nih', 'dod'][i], divs
      ]));
    })
});

export const {
  toggleDrawerOpen,
  highlightDivision,
  setGrantOrder,
  setLegendFilters,
} = filterSlice.actions;

export default filterSlice.reducer;