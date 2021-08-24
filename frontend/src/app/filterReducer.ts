import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { loadData, loadDivisions, loadTermCounts } from './actions';
import { Division, GrantOrder } from './types';

type Field = 'title' | 'abstract';

export type Term = {
  term: string,
  count?: number,
}

export type FilterState = {
  dependant: string,
  boolQuery: 'any' | 'all',
  terms: Term[],
  divisions: Division[],
  fields: Field[],
  grantOrder: GrantOrder,
}

const initialState: FilterState = {
  dependant: 'divisions',
  boolQuery: 'any',
  terms: [{ term: 'data science' }, { term: 'machine learning' }],
  divisions: [],
  fields: ['title'], //, 'abstract'],
  grantOrder: [ 'date', 'desc' ],
};

const filterSlice = createSlice({
  name: 'filter',
  initialState,
  reducers: {
    setTerms: (state, action) => {
      state.terms = action.payload;
    },
    addChips: (state, action) => {
      state.terms = state.terms.concat(action.payload.map(t => ({ term: t })));
    },
    deleteChip: (state, action: PayloadAction<{ idx: number, chip: Term }>) => {
      state.terms.splice(action.payload.idx, 1);
    },
    setBoolQuery: (state, action) => {
      state.boolQuery = action.payload.boolQuery;
    },
    setGrantOrder: (state, action) => {
      state.grantOrder = action.payload;
    },
  },
  extraReducers: builder => builder
    .addCase(loadDivisions.fulfilled, (state, action) => {
      console.log(action.payload);
      state.divisions = action.payload.map((div: Division) => ({
        key: div.key,
        name: div.name,
        count: '',
        amount: '',
      }));
    })
    .addCase(loadData.fulfilled, (state, action) => {
      // TODO add return type to OpenAPI spec
      action.payload.sumTotal.divisions.buckets.forEach((d: any) => {
        const div = state.divisions.find(o => d.key === o.name);
        if (div) {
          div.amount = d.grant_amounts_total.value;
          div.count = d.doc_count;
        }
      });
    })
    .addCase(loadTermCounts.fulfilled, (state, action) => {
      console.log(action);
      const term = state.terms.find(term => term.term === action.meta.arg);
      if (term) {
        term.count = action.payload.count;
      }
    })
});

export const {
  setTerms,
  addChips,
  deleteChip,
  setBoolQuery,
  setGrantOrder,
} = filterSlice.actions;

export default filterSlice.reducer;