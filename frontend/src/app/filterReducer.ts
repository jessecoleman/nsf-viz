import { createSlice } from '@reduxjs/toolkit';
import { loadDirectory, loadDivisions } from './actions';
import { Division } from '../api/models/Division';
import { Directory, Grant } from 'api';

type Field = 'title' | 'abstract';

export type Term = {
  term: string,
  count?: number,
  selected?: boolean,
}

type YearRange = [ number, number ];

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
  grantDialogOpen: boolean,
  grantFilter: {
    yearRange?: YearRange,
  },
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
  grantDialogOpen: false,
  grantFilter: {},
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
    setGrantDialogOpen: (state, action) => {
      state.grantDialogOpen = action.payload;
    },
    setGrantFilter: (state, action) => {
      const { year } = action.payload;
      if (year) {
        state.grantFilter.yearRange = [year, year];
      }
    },
    clearGrantFilter: (state) => {
      state.grantFilter = {};
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
        ['nsf', 'nih'][i], divs
      ]));
    })
    .addCase(loadDirectory.fulfilled, (state, action) => {
      state.directory = Object.fromEntries(action.payload.map((divs, i) => [
        ['nsf', 'nih'][i], divs
      ]));
    })
});

export const {
  toggleDrawerOpen,
  highlightDivision,
  setGrantDialogOpen,
  setGrantFilter,
  clearGrantFilter,
  setGrantOrder,
  setLegendFilters,
} = filterSlice.actions;

export default filterSlice.reducer;