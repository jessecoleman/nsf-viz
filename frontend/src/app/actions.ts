import 'whatwg-fetch';
import { createAsyncThunk } from '@reduxjs/toolkit';
import { SearchResponse, Service } from 'api';
import type { FilterState } from './filterReducer';

type FilterParams = {
  divisions: string[],
  terms: string[],
}

export const loadData = createAsyncThunk<
  SearchResponse,
  FilterParams,
  { state: { filter: FilterState }}
>(
  'loadData',
  async (query, thunkAPI) => {
    const { filter } = thunkAPI.getState();
    const { legendFilters, ...rest } = filter;

    return await Service.search({
      ...rest,
      ...query,
      boolQuery: legendFilters.bool,
      year_range: filter.yearRange,
    });
  });

type LoadGrantsParams = FilterParams & {
  idx: number,
}

export const loadGrants = createAsyncThunk(
  'loadGrants',
  async ({ idx, ...query }: LoadGrantsParams, thunkAPI) => {

    const { filter } = thunkAPI.getState() as { filter: FilterState };
    // const selected = getSelectedTerms(thunkAPI.getState() as any);
    const { grantOrder, legendFilters, grantFilter, ...rest } = filter;
    const [ orderBy, order ] = grantOrder;

    console.log(grantFilter);

    return await Service.loadGrants({
      ...rest,
      ...query,
      idx,
      order,
      order_by: orderBy === 'title' ? 'title.raw' : orderBy,
      toggle: legendFilters.bool === 'all',
      year_range: grantFilter.yearRange,
    });
  });
  
export const loadAbstract = createAsyncThunk(
  'loadAbstract',
  async (payload: string, thunkAPI) => {
    const { filter } = thunkAPI.getState() as { filter: FilterState };
    return await Service.loadAbstract(payload, filter.terms.map(t => t.term));
  }
);

export const loadDivisions = createAsyncThunk(
  'loadDivisions',
  async () => await Service.loadDivisions()
);

export const loadTermCounts = createAsyncThunk(
  'loadTermCount',
  async (payload: string) => await Service.countTerm(payload)
);

export const loadTypeahead = createAsyncThunk(
  'loadTypeahead',
  async (prefix: string) => await Service.loadTypeahead(prefix)
);

export const loadRelated = createAsyncThunk(
  'loadRelated',
  async (_, thunkAPI) => {
    const { filter } = thunkAPI.getState() as { filter: FilterState };
    return await Service.loadRelated(filter.terms.map(t => t.term).join(','));
  }
);