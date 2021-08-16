import 'whatwg-fetch';
import { createAsyncThunk } from '@reduxjs/toolkit';
import { Service } from 'api';
import { FilterState } from './filterReducer';

export const loadData = createAsyncThunk(
  'loadData',
  async (payload, thunkAPI) => {
    //const route = queryString.stringify(query);
    const { filter } = thunkAPI.getState() as { filter: FilterState };
    const { terms, ...rest } = filter;
    console.log(terms);

    const data = await Service.search({
      terms: terms.map(t => t.term),
      ...rest,
      divisions: filter.divisions.filter(d => d.selected).map(d => d.title),
    });
    return {
      perYear: data.per_year.aggregations,
      perDivision: data.per_division.aggregations,
      sumTotal: data.sum_total.aggregations,
    };
  });

export const loadGrants = createAsyncThunk(
  'loadGrants',
  async (payload: number, thunkAPI) => {

    const { filter } = thunkAPI.getState() as { filter: FilterState };
    const { grantOrder, terms, ...rest } = filter;
    const [ order_by, order ] = grantOrder;

    return await Service.loadGrants({
      idx: payload,
      order,
      order_by,
      toggle: false,
      terms: terms.map(t => t.term),
      ...rest,
      divisions: filter.divisions.filter(d => d.selected).map(d => d.title),
    });
  });
  
export const loadAbstract = createAsyncThunk(
  'loadAbstract',
  async (payload: string, thunkAPI) => {
    const { filter } = thunkAPI.getState() as { filter: FilterState };
    return await Service.loadAbstract(payload, filter.terms);
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