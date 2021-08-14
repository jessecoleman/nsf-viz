import 'whatwg-fetch';
import { createAsyncThunk } from '@reduxjs/toolkit';
import { SortDirection } from '@material-ui/core';
import { Service } from 'api';
import { FilterState } from './filterReducer';
import { Division } from './types';

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
      perYear: data.per_year.aggregations,
      perDivision: data.per_division.aggregations,
      sumTotal: data.sum_total.aggregations,
    };
  });

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
  

type SortGrantsPayload = {
  sort: SortDirection
  sortBy: keyof Division
}

export const sortGrants = createAsyncThunk(
  'sortGrants',
  async (payload: SortGrantsPayload) => {
    // pass
  }
);

export const loadDivisions = createAsyncThunk(
  'loadDivisions',
  async () => await Service.loadDivisions()
);

export const loadTypeahead = createAsyncThunk(
  'loadTypeahead',
  async (prefix: string) => await Service.loadTypeahead(prefix)
);

export const loadRelated = createAsyncThunk(
  'loadRelated',
  async (_, thunkAPI) => {
    const { filter } = thunkAPI.getState() as { filter: FilterState };
    return await Service.loadRelated(filter.terms);
  }
);