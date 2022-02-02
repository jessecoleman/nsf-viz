import createCachedSelector from 're-reselect';
import { AggFields } from './chart/D3Chart';
import type { RootState } from './store';

export type SortableKeys = 'name' | 'count' | 'amount';

export const isAgg = (key: SortableKeys): key is keyof AggFields => ['count', 'amount'].includes(key);

export const isYearsLoading = (state: RootState) => state.data.loadingYears;

export const getYearAgg = (state: RootState) => state.data.yearAgg;

export const getYearDivisionAgg = (state: RootState) => state.data.yearDivisionAgg;

export const getDivisionAgg = (state: RootState) => state.data.divisionAgg;

export const getDirectoryAgg = (state: RootState) => state.data.directoryAgg;

export const getHighlightedDivision = (state: RootState) => state.filter.highlightedDivision;

export const getGrants = (state: RootState) => state.data.grants;

export const getNumGrants = (state: RootState) => state.data.grants.length;

export const getLegendFilters = (state: RootState) => state.filter.legendFilters;

export const isDrawerOpen = (state: RootState) => state.filter.drawerOpen;

export const isLoadingData = (state: RootState) => state.data.loadingData;

export const loadingGrants = (state: RootState) => state.data.loadingGrants;

export const noMoreGrants = (state: RootState) => state.data.noMoreGrants;

export const getSelectedGrantId = (state: RootState, grantId: string | undefined) => grantId;

export const getSelectedGrant = createCachedSelector(
  getGrants,
  getSelectedGrantId,
  (grants, id) => id ? grants.find(grant => grant.id === id) : undefined
)(getSelectedGrantId);

export const getSelectedAbstract = (state: RootState) => state.data.selectedAbstract;

const getGrantIdx = (state: RootState, idx: number) => idx;

export const getGrant = createCachedSelector(
  getGrants,
  getGrantIdx, 
  (grants, idx) => grants[idx]
)(getGrantIdx);
