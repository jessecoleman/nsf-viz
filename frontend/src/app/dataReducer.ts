import { createSlice, isAnyOf } from '@reduxjs/toolkit';
import { Aggregate } from 'api/models/Aggregate';
import { DivisionAggregate } from 'api/models/DivisionAggregate';
import { loadAbstract, loadData, loadGrants, loadRelated, loadTypeahead } from './actions';
import { addChips, deleteChip, setGrantOrder, setTerms } from './filterReducer';
import { Grant } from '../api/models/Grant';

type GrantState = {
  perYear: Aggregate[],
  perDivision: DivisionAggregate[],
  sumTotal: Aggregate[],
  grants: Grant[],
  typeahead: string[],
  related: string[],
  noMoreGrants: boolean,
  selectedGrantId?: string,
  loadingData: boolean,
  loadingGrants: boolean,
  selectedAbstract?: string,
}

const initialState: GrantState = {
  perYear: [],
  perDivision: [],
  sumTotal: [],
  grants: [],
  typeahead: [],
  related: [],
  noMoreGrants: false,
  loadingData: false,
  loadingGrants: false,
};

const dataSlice = createSlice({
  name: 'data',
  initialState,
  reducers: {
    clearGrants: (state) => {
      state.grants = [];
    },
    dismissAbstractDialog: (state) => {
      state.selectedGrantId = undefined;
      state.selectedAbstract = undefined;
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
      state.perDivision = action.payload.per_division;
      state.sumTotal = action.payload.sum_total;
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
      // TODO this needs to run conditionally on reorder
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
    }).addMatcher(isAnyOf(setGrantOrder, setTerms, addChips, deleteChip), (state) => {
      state.grants = [];
    })
});

export const {
  clearGrants,
  dismissAbstractDialog,
} = dataSlice.actions;

export default dataSlice.reducer;