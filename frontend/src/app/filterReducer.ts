import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { loadDivisions, loadTermCounts } from './actions';
import { Division } from '../api/models/Division';
import { Grant } from 'api';

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
  divisions: Division[],
  highlightedDivision?: string,
  fields: Field[],
  divisionOrder: DivisionOrder,
  grantOrder: GrantOrder,
  grantDialogOpen: boolean,
  grantFilter: {
    yearRange?: YearRange,
  },
  yearRange: YearRange,
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
  divisions: [],
  fields: ['title', 'abstract'],
  divisionOrder: ['name', 'desc'],
  grantOrder: ['date', 'desc'],
  grantDialogOpen: false,
  grantFilter: {},
  yearRange: [2005, 2018],
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
    setTerms: (state, action) => {
      state.terms = action.payload;
    },
    selectTerm: (state, action) => {
      const term = state.terms.find(t => t.term === action.payload);
      if (term) {
        term.selected = !term.selected;
      }
    },
    clearTermSelection: (state) => {
      state.terms.forEach(t => {
        t.selected = false;
      });
    },
    addChips: (state, action) => {
      state.terms = state.terms.concat(action.payload.map(t => ({ term: t })));
    },
    deleteChip: (state, action: PayloadAction<number>) => {
      state.terms.splice(action.payload, 1);
    },
    highlightDivision: (state, action) => {
      state.highlightedDivision = action.payload;
    },
    setBoolQuery: (state, action) => {
      state.boolQuery = action.payload.boolQuery;
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
    setDivisionOrder: (state, action) => {
      state.divisionOrder = action.payload;
    },
    setGrantOrder: (state, action) => {
      state.grantOrder = action.payload;
    },
    setYearRange: (state, action) => {
      state.yearRange = action.payload;
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
      state.divisions = action.payload;
    })
    .addCase(loadTermCounts.fulfilled, (state, action) => {
      action.meta.arg.split(',').forEach((t, i) => {
        const term = state.terms.find(term => term.term === t);
        if (term) {
          term.count = action.payload[i];
        }
      });
    })
});

export const {
  toggleDrawerOpen,
  setTerms,
  selectTerm,
  clearTermSelection,
  addChips,
  deleteChip,
  highlightDivision,
  setBoolQuery,
  setGrantDialogOpen,
  setGrantFilter,
  clearGrantFilter,
  setDivisionOrder,
  setGrantOrder,
  setYearRange,
  setLegendFilters,
} = filterSlice.actions;

export default filterSlice.reducer;