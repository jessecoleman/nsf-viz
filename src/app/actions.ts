import 'whatwg-fetch';
import queryString from 'query-string';
import { createAsyncThunk } from '@reduxjs/toolkit';
import { SortDirection } from '@material-ui/core';
import { Service } from 'api';
import { FilterState } from './filterReducer';

export const loadData = createAsyncThunk(
  'loadData',
  async (payload, thunkAPI) => {
  //const route = queryString.stringify(query);

   const { filter } = thunkAPI.getState() as { filter: FilterState };

  const data = await Service.search({
      ...filter,
      divisions: filter.divisions.filter(d => d.selected).map(d => d.title),
  });
  return {
    type: 'LOADED_DATA',
    perYear: data.per_year.aggregations,
    perDivision: data.per_division.aggregations,
    sumTotal: data.sum_total.aggregations,
  };
})

type GrantParams = {
  idx: number
  order?: SortDirection
  orderBy?: string
}

export const loadGrants = createAsyncThunk(
  'loadGrants',
  async (payload: GrantParams, thunkAPI) => {
  const { idx, order, orderBy } = payload;

  const { filter } = thunkAPI.getState() as { filter: FilterState };

  return await Service.loadGrants({
    idx,
    order: order as string,
    order_by: orderBy!,
    toggle: false,
    ...filter,
    divisions: filter.divisions.filter(d => d.selected).map(d => d.title),
  });
});

export const sortGrants = (sort, sortBy) => async (dispatch, getState) => {

}

export const loadDivisions = createAsyncThunk(
  'loadDivisions',
  async () => await Service.loadDivisions()
);

export const loadSuggestions = createAsyncThunk(
  'loadSuggestions',
  async (prefix: string) => await Service.loadTypeahead(prefix)
)