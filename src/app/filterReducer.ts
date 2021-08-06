import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { loadDivisions, loadGrants } from './actions';
import { Division } from './types';

type Field = 'title' | 'abstract';

export type FilterState = {
  dependant: string,
  boolQuery: 'any' | 'all',
  terms: string[],
  divisions: Division[],
  fields: Field[]
}

const initialState: FilterState = {
  dependant: 'divisions',
  boolQuery: 'any',
  terms: ['data science', 'machine learning'],
  divisions: [],
  fields: ['title'] //, 'abstract'],
};

const filterSlice = createSlice({
  name: 'filter',
  initialState,
  reducers: {
    setTerms: (state, action) => {
      state.terms = action.payload.terms;
    },
    addChips: (state, action) => {
      state.terms = state.terms.concat(action.payload);
    },
    deleteChip: (state, action: PayloadAction<{ idx: number, chip: string }>) => {
      console.log(action);
      const { idx } = action.payload;
      state.terms.splice(idx, 1);
      console.log(JSON.stringify(state.terms));
    },
    setBoolQuery: (state, action) => {
      state.boolQuery = action.payload.boolQuery;
    },
    loadedData: (state, action) => {
    //   const divisions = action.payload.sumTotal.divisions.buckets.reduce((obj, div) => {
    //     obj[div.key] = div;
    //     return obj;
    //   }, {});
    //   return {
    //     ...state,
    //     divisions: Object.values(state.divisions).reduce((obj, div) => {
    //       const bucket = divisions[div.title];
    //       obj[div.title] = {
    //         ...div,
    //         count: bucket ? bucket.doc_count : 0,
    //         amount: bucket ? bucket.grant_amounts_total.value : 0,
    //       };
    //       return obj;
    //     }, {}),
    //   };
    },
    selectDivision: (state, action) => {
      console.log(action.payload);
      // TODO key as array or object
      const div = state.divisions[action.payload]; 
      div.selected = !div.selected;
    },
    selectAllDivisions: (state, action) => {
      state.divisions.forEach(d => { d.selected = true; });
    },
  },
  extraReducers: builder => {
    builder.addCase(loadDivisions.fulfilled, (state, action) => {
      console.log(action.payload);
      state.divisions = action.payload.map((div: Division) => ({
        title: div.title,
        selected: div.selected,
        count: '',
        amount: '',
      }));
    }).addCase(loadGrants.fulfilled, (state, action) => {
      // pass
    }).addCase(loadGrants.rejected, (state, action) => {
      // state.noM
    });
  }
});

export const {
  setTerms,
  addChips,
  deleteChip,
  setBoolQuery,
  loadedData,
  selectDivision,
  selectAllDivisions,
} = filterSlice.actions;

export default filterSlice.reducer;