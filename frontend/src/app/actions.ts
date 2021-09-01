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
    const { terms, yearRange, legendFilters, ...rest } = filter;
    const selected = terms.filter(t => t.selected).map(t => t.term);
    if (selected.length) {
      query.terms = selected;
    }

    return await Service.search({
      ...rest,
      ...query,
      boolQuery: legendFilters.bool,
      year_range: yearRange,
    });
  });

type LoadGrantsParams = FilterParams & {
  idx: number,
}

export const loadGrants = createAsyncThunk(
  'loadGrants',
  async (query: LoadGrantsParams, thunkAPI) => {

    const { filter } = thunkAPI.getState() as { filter: FilterState };
    const { terms, grantOrder, legendFilters, grantFilter, ...rest } = filter;
    const selected = terms.filter(t => t.selected).map(t => t.term);
    if (selected.length) {
      query.terms = selected;
    }
    const [ orderBy, order ] = grantOrder;

    return await Service.loadGrants({
      ...rest,
      ...query,
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
    let terms = filter.terms.map(t => t.term);
    const selected = filter.terms.filter(t => t.selected).map(t => t.term);
    if (selected.length) {
      terms = selected;
    }
    return await Service.loadAbstract(payload, terms);
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