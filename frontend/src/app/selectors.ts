import { createSelector } from '@reduxjs/toolkit';
import createCachedSelector from 're-reselect';
import { DivisionAggregate } from 'api';
import { AggFields } from './chart/D3Chart';
import { SortDirection } from './filterReducer';
import type { RootState } from './store';

type SortableKeys = 'name' | 'count' | 'amount';

export const isAgg = (key: SortableKeys): key is keyof AggFields => ['count', 'amount'].includes(key);

const desc = (a: DivisionAggregate, b: DivisionAggregate, key: SortableKeys) => {
  if (b[key] < a[key]) return -1;
  else if (b[key] > a[key]) return 1;
  else return 0;
};

const stableSort = (array: DivisionAggregate[], key: SortableKeys, direction: SortDirection): DivisionAggregate[] => {
  const stabilizedThis = array.map((el, index): [DivisionAggregate, number] => [el, index]);
  const sign = direction === 'desc' ? 1 : -1;
  stabilizedThis.sort((a, b) => {
    const order = sign * desc(a[0], b[0], key);
    if (order !== 0) return order;
    return sign * (a[1] - b[1]);
  });
  return stabilizedThis.map(el => el[0]);
};

export const getYearAgg = (state: RootState) => state.data.yearAgg;

export const getYearDivisionAgg = (state: RootState) => state.data.yearDivisionAgg;

export const getDivisionAgg = (state: RootState) => state.data.divisionAgg;

export const getDivisions = (state: RootState) => state.filter.divisions;

export const getHighlightedDivision = (state: RootState) => state.filter.highlightedDivision;

export const getGrants = (state: RootState) => state.data.grants;

export const getNumGrants = (state: RootState) => state.data.grants.length;

export const getLegendFilters = (state: RootState) => state.filter.legendFilters;

export const getYearRange = (state: RootState) => state.filter.yearRange;

export const isDrawerOpen = (state: RootState) => state.filter.drawerOpen;

export const isGrantDialogOpen = (state: RootState) => state.filter.grantDialogOpen;

export const getGrantFilter = (state: RootState) => state.filter.grantFilter;

export const getDivisionOrder = (state: RootState) => state.filter.divisionOrder;

export const getGrantOrder = (state: RootState) => state.filter.grantOrder;

export const isLoadingData = (state: RootState) => state.data.loadingData;

export const loadingGrants = (state: RootState) => state.data.loadingGrants;

export const noMoreGrants = (state: RootState) => state.data.noMoreGrants;

export const getSelectedGrantId = (state: RootState) => state.data.selectedGrantId;

export const getSelectedGrant = createSelector(
  getGrants,
  getSelectedGrantId,
  (grants, id) => id ? grants.find(grant => grant.id === id) : undefined
);

export const getSelectedAbstract = (state: RootState) => state.data.selectedAbstract;

export const getDivisionsMap = (state: RootState) => (
  Object.fromEntries(state.filter.divisions.map(div => [div.key, div.name]))
);

const getGrantIdx = (state: RootState, idx: number) => idx;

export const getGrant = createCachedSelector(
  getGrants,
  getGrantIdx, 
  (grants, idx) => grants[idx]
)(getGrantIdx);

// for use in DivisionTable
export const getSortedDivisionAggs = createSelector(
  getDivisionAgg,
  getDivisionOrder,
  (agg, order) => stableSort(agg, ...order)
);

const getYear = (state: RootState, year: number | undefined) => year ?? 0;

// for use in D3Tooltip
export const getDivisionYear = createCachedSelector(
  getYear, 
  getYearDivisionAgg,
  getDivisionOrder,
  (year, agg, order) => stableSort(
    agg.find(d => d.key === year)?.divisions ?? [],
    ...order
  )
)(getYear);

// for use in D3Chart
export const getStackedData = createSelector(
  getYearDivisionAgg,
  getDivisionOrder,
  (agg, order) => agg.map(({ key, divisions }) => ({
    year: key,
    aggs: Object.fromEntries(stableSort(divisions, ...order)
      .map(({ key, ...aggs }) => [ key, aggs ])
    )
  }))
);

export const getTerms = (state: RootState) => state.filter.terms;

export const getSelectedTerms = createSelector(
  getTerms,
  (terms) => terms.filter(t => t.selected).map(t => t.term)
);

export const getTypeahead = (state: RootState) => state.data.typeahead;

export const getRelated = (state: RootState) => state.data.related;