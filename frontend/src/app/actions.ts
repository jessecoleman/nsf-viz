import 'whatwg-fetch';
import { createAsyncThunk } from '@reduxjs/toolkit';
import { Grant, GrantsRequest, ServiceService as Service } from 'api';
import type { FilterState } from './filterReducer';
import { QueryParams } from './query';

type ThunkAPI = { state: { filter: FilterState }}

export const loadData = createAsyncThunk(
  'loadData',
  async (query: QueryParams) => await Service.search(query)
);

export const loadYears = createAsyncThunk(
  'loadYears',
  async (query: QueryParams) => await Service.years(query)
);

type LoadGrantsParams = QueryParams & GrantsRequest; //{ idx: number }

export const loadGrants = createAsyncThunk<
  Array<Grant>,
  LoadGrantsParams,
  ThunkAPI
>(
  'loadGrants',
  Service.loadGrants
);

type AbstractPayload = {
  id: string,
  terms: string[]
};

export const loadAbstract = createAsyncThunk(
  'loadAbstract',
  async (payload: AbstractPayload) => (
    await Service.loadAbstract(payload.id, payload.terms.join(','))
  )
);

export const loadDivisions = createAsyncThunk(
  'loadDivisions',
  async () => Promise.all(['nsf', 'nih', 'dod'].map(Service.loadDivisions))
);

export const loadDirectory = createAsyncThunk(
  'loadDirectory',
  async () => Promise.all(['nsf', 'nih', 'dod'].map(Service.loadDirectory))
);

export const loadTermCounts = createAsyncThunk(
  'loadTermCount',
  async (terms: string[]) => await Service.countTerm(terms.join(','))
);

export const loadTypeahead = createAsyncThunk(
  'loadTypeahead',
  async (prefix: string) => await Service.loadTypeahead(prefix)
);

export const loadRelated = createAsyncThunk(
  'loadRelated',
  async (terms: string[]) => {
    return await Service.loadRelated(terms.join(','));
  }
);