import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { loadDivisions, loadTermCounts } from './actions';
import { Division, GrantOrder } from './types';

type Field = 'title' | 'abstract';

export type Term = {
  term: string,
  count?: number,
  selected?: boolean,
}

export type FilterState = {
  dependant: string,
  boolQuery: 'any' | 'all',
  terms: Term[],
  divisions: Division[],
  fields: Field[],
  grantOrder: GrantOrder,
  legendFilters: {
    bool: 'any' | 'all'
    counts: boolean,
    amounts: boolean,
  },
}

const initialState: FilterState = {
  dependant: 'divisions',
  boolQuery: 'any',
  terms: [],
  divisions: [],
  fields: ['title'], //, 'abstract'],
  grantOrder: [ 'date', 'desc' ],
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
    setBoolQuery: (state, action) => {
      state.boolQuery = action.payload.boolQuery;
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
      state.divisions = action.payload.map((div: Division) => ({
        key: div.key,
        name: div.name,
        count: '',
        amount: '',
      }));
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
  setTerms,
  selectTerm,
  clearTermSelection,
  addChips,
  deleteChip,
  setBoolQuery,
  setGrantOrder,
  setLegendFilters,
} = filterSlice.actions;

export default filterSlice.reducer;