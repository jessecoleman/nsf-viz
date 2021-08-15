import { createSlice } from '@reduxjs/toolkit';
import { loadData, loadGrants, loadRelated, loadTypeahead } from './actions';
import { PerDivision, PerYear } from './types';

type Grant = {
  abstract: string
}

type GrantState = {
  perYear?: PerYear,
  perDivision?: PerDivision,
  sumTotal?: PerYear,
  grants: Grant[],
  typeahead: string[],
  related: string[],
  noMoreGrants: boolean,
  viewingAbstract: number,
  loadingData: boolean,
  loadingGrants: boolean,
  sort: boolean,
  sortBy: 'title' | 'abstract',
}

const initialState: GrantState = {
  perYear: undefined,
  perDivision: undefined,
  sumTotal: undefined,
  grants: [],
  typeahead: [],
  related: [],
  noMoreGrants: false,
  viewingAbstract: 10,
  loadingData: false,
  loadingGrants: false,
  sort: false,
  sortBy: 'title',
};

const dataSlice = createSlice({
  name: 'data',
  initialState,
  reducers: {
    sortedGrants: (state, action) => {
      state.sortBy = action.payload.sortBy;
      state.sort = action.payload.sort;
    },
    setViewing: (state, action) => {
      state.viewingAbstract = action.payload.idx;
    },
  }, 
  extraReducers: builder => builder
    .addCase(loadTypeahead.fulfilled, (state, action) => {
      state.typeahead = action.payload;
    })
    .addCase(loadRelated.fulfilled, (state, action) => {
      state.related = action.payload;
    })
    .addCase(loadData.pending, (state) => {
      state.loadingData = true; 
    })
    .addCase(loadData.fulfilled, (state, action) => {
      state.loadingData = false;
      state.perYear = action.payload.perYear;
      state.perDivision = action.payload.perDivision;
      state.sumTotal = action.payload.sumTotal;
    })
    .addCase(loadData.rejected, (state, action) => {
      state.loadingData = false;
    })
    .addCase(loadGrants.pending, (state) => {
      state.loadingGrants = true;
    })
    .addCase(loadGrants.fulfilled, (state, action) => {
      state.loadingGrants = false;
      console.log(action);
      state.grants = state.grants.concat(action.payload);
    })
    .addCase(loadGrants.rejected, (state, action) => {
      state.loadingGrants = false;
      state.noMoreGrants = true;
    })
});

export const {
  sortedGrants,
  setViewing, 
} = dataSlice.actions;

export default dataSlice.reducer;