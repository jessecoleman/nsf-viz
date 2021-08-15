import { createSlice, isAnyOf } from '@reduxjs/toolkit';
import { loadAbstract, loadData, loadGrants, loadRelated, loadTypeahead } from './actions';
import { selectAllDivisions, selectDivision, setGrantOrder } from './filterReducer';
import { Grant, PerDivision, PerYear } from './types';

type GrantState = {
  perYear?: PerYear,
  perDivision?: PerDivision,
  sumTotal?: PerYear,
  grants: Grant[],
  typeahead: string[],
  related: string[],
  noMoreGrants: boolean,
  selectedGrantId?: string,
  loadingData: boolean,
  loadingGrants: boolean,
  selectedAbstract?: string,
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
    dismissAbstractDialog: (state) => {
      state.selectedGrantId = undefined;
      state.selectedAbstract = undefined;
    }
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
    .addCase(loadData.rejected, (state) => {
      state.loadingData = false;
    })
    .addCase(loadGrants.pending, (state) => {
      state.loadingGrants = true;
      state.noMoreGrants = false;
    })
    .addCase(loadGrants.fulfilled, (state, action) => {
      state.loadingGrants = false;
      state.grants = state.grants.concat(action.payload);
    })
    .addCase(loadGrants.rejected, (state) => {
      state.loadingGrants = false;
      state.noMoreGrants = true;
    })
    .addCase(loadAbstract.pending, (state, action) => {
      state.selectedGrantId = action.meta.arg;
    })
    .addCase(loadAbstract.fulfilled, (state, action) => {
      state.selectedAbstract = action.payload;
    })
    .addMatcher(isAnyOf(setGrantOrder, selectDivision, selectAllDivisions), (state) => {
      state.grants = [];
    })
});

export const {
  sortedGrants,
  dismissAbstractDialog,
} = dataSlice.actions;

export default dataSlice.reducer;