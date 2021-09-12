import { createSelector } from '@reduxjs/toolkit';
import { DivisionAggregate } from 'api';
import createCachedSelector from 're-reselect';
import { Data } from './chart/D3Chart';
import { SortDirection } from './filterReducer';
import type { RootState } from './store';

// TODO
type SortableKeys = 'name' | 'count' | 'amount';

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

export const getYearDivisionAgg = (state: RootState) => state.data.yearDivisionAggg;

export const getDivisionAgg = (state: RootState) => state.data.divisionAgg;

export const getDivisions = (state: RootState) => state.filter.divisions;

export const getHighlightedDivision = (state: RootState) => state.filter.highlightedDivision;

export const getGrants = (state: RootState) => state.data.grants;

export const getNumGrants = (state: RootState) => state.data.grants.length;

export const getLegendFilters = (state: RootState) => state.filter.legendFilters;

export const getYearRange = (state: RootState) => state.filter.yearRange;

export const isGrantDialogOpen = (state: RootState) => state.filter.grantDialogOpen;

export const getGrantFilter = (state: RootState) => state.filter.grantFilter;

export const getDivisionOrder = (state: RootState) => state.filter.divisionOrder;

export const getGrantOrder = (state: RootState) => state.filter.grantOrder;

export const loadingGrants = (state: RootState) => state.data.loadingGrants;

export const noMoreGrants = (state: RootState) => state.data.noMoreGrants;

export const getSelectedGrantId = (state: RootState) => state.data.selectedGrantId;

export const getSelectedGrant = createSelector(
  getGrants,
  getSelectedGrantId,
  (grants, id) => id ? grants.find(grant => grant.id === id) : undefined
);

export const getSelectedAbstract = (state: RootState) => state.data.selectedAbstract;

export const getDivisionsMap = (state: RootState) => state.filter.divisions.reduce((accum, div) => {
  accum[div.key] = div.name;
  return accum;
}, {});

export const getGrant = createCachedSelector(
  getGrants,
  getDivisionsMap,
  (state: RootState, idx: number) => idx,
  (grants, divMap, idx) => grants[idx]
)(
  (state, idx) => idx
);

export const getDivisionAggs = createSelector(
  getDivisionAgg,
  getDivisions,
  getDivisionOrder,
  (total, divisions, order) => (
    stableSort(divisions.map(d => {
      const bucket = total.find(d2 => d2.key === d.key);
      return {
        ...d,
        amount: bucket?.amount ?? 0,
        count: bucket?.count ?? 0,
      };
    }), ...order)
  )
);

// TODO fix this selector
export const getDivisionYear = createCachedSelector(
  (state: RootState, year: number | undefined) => year,
  getYearDivisionAgg,
  getDivisions,
  getDivisionOrder,
  (year, perDivision, divisions, order) => (
    stableSort(divisions.map(d => {
      const bucket = perDivision.find(d => d.key === year)?.divisions.find(d2 => d2.key === d.key);
      return {
        ...d,
        amount: bucket?.amount ?? 0,
        count: bucket?.count ?? 0,
      };
    }), ...order)
  )
)(
  (state: RootState, year: number | undefined) => year
);

export const getStackedData = createCachedSelector(
  getYearDivisionAgg,
  getDivisionOrder,
  (state: RootState, divs: string[]) => divs,
  (agg, order,divs) => agg.map((year): Data => ({
    year: year.key,
    //aggs: Object.fromEntries(divs.map(key => {
    aggs: Object.fromEntries(stableSort(year.divisions
      .filter(div => divs.includes(div.key)),
      ...order)
      .map(({ key, ...aggs }) => [ key, aggs ])
    )
  })))(
  (state, divs) => JSON.stringify(divs)
);

export const getTerms = (state: RootState) => state.filter.terms;

export const getSelectedTerms = createSelector(
  getTerms,
  (terms) => terms.filter(t => t.selected).map(t => t.term)
);

export const getTypeahead = (state: RootState) => state.data.typeahead;

export const getRelated = (state: RootState) => state.data.related;