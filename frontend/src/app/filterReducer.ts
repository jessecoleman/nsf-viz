import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { loadData, loadDivisions, loadTermCounts } from './actions';
import { Division, GrantOrder } from './types';

type Field = 'title' | 'abstract';

type Term = {
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
    deleteChip: (state, action: PayloadAction<{ idx: number, chip: string }>) => {
      state.terms.splice(action.payload.idx, 1);
    },
    setBoolQuery: (state, action) => {
      state.boolQuery = action.payload.boolQuery;
    },
    setGrantOrder: (state, action) => {
      state.grantOrder = action.payload;
    },
    selectDivision: (state, action) => {
      const div = state.divisions.find(o => action.payload === o.title); 
      if (div) div.selected = !div.selected;
    },
    selectAllDivisions: (state, action) => {
      state.divisions.forEach(d => { d.selected = action.payload; });
    },
  },
  extraReducers: builder => builder
    .addCase(loadDivisions.fulfilled, (state, action) => {
      console.log(action.payload);
      state.divisions = action.payload.map((div: Division) => ({
        title: div.title,
        selected: div.selected,
        count: '',
        amount: '',
      }));
    })
    .addCase(loadData.fulfilled, (state, action) => {
      // TODO at return type to OpenAPI spec
      action.payload.sumTotal.divisions.buckets.forEach(d => {
        const div = state.divisions.find(o => d.key === o.title);
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
  selectDivision,
  selectAllDivisions,
} = filterSlice.actions;

export default filterSlice.reducer;