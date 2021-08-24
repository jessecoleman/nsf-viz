import 'whatwg-fetch';
import { createAsyncThunk } from '@reduxjs/toolkit';
import { Service } from 'api';
import { FilterState } from './filterReducer';

type FilterParams = {
  divisions: string[],
}

export const loadData = createAsyncThunk(
  'loadData',
  async ({ divisions }: FilterParams, thunkAPI) => {
    //const route = queryString.stringify(query);
    const { filter } = thunkAPI.getState() as { filter: FilterState };
    const { terms, ...rest } = filter;
    console.log(terms);

    const data = await Service.search({
      terms: terms.map(t => t.term),
      ...rest,
      divisions,
    });
    return {
      perYear: data.per_year.aggregations,
      perDivision: data.per_division.aggregations,
      sumTotal: data.sum_total.aggregations,
    };
  });

type LoadGrantsParams = FilterParams & {
  idx: number,
}

export const loadGrants = createAsyncThunk(
  'loadGrants',
  async ({ divisions, idx }: LoadGrantsParams, thunkAPI) => {

    const { filter } = thunkAPI.getState() as { filter: FilterState };
    const { grantOrder, terms, ...rest } = filter;
    const [ orderBy, order ] = grantOrder;

    return await Service.loadGrants({
      idx,
      order,
      order_by: orderBy === 'title' ? 'title.keyword' : orderBy,
      toggle: false,
      terms: terms.map(t => t.term),
      ...rest,
      divisions,
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
    return await Service.loadRelated(filter.terms.join(','));
  }
);