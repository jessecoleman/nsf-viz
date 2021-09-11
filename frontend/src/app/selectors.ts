import { createSelector } from '@reduxjs/toolkit';
import createCachedSelector from 're-reselect';
import { SortDirection } from './filterReducer';
import type { RootState } from './store';

const desc = <T extends unknown>(a: T, b: T, key: keyof T) => {
  if (b[key] < a[key]) return -1;
  else if (b[key] > a[key]) return 1;
  else return 0;
};

const stableSort = <T extends unknown>(array: Array<T>, cmp: (a: T, b: T) => number) => {
  const stabilizedThis = array.map((el, index): [T, number] => [el, index]);
  stabilizedThis.sort((a, b) => {
    const order = cmp(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });
  return stabilizedThis.map(el => el[0]);
};

const getSorting = <T extends unknown>(key: keyof T, direction: SortDirection) => {
  return direction === 'desc' ? (a: T, b: T) => desc(a, b, key) : (a: T, b: T) => -desc(a, b, key);
};

export const getPerYear = (state: RootState) => state.data.perYear;

export const getPerDivision = (state: RootState) => state.data.perDivision;

export const getTotal = (state: RootState) => state.data.sumTotal;

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
  getTotal,
  getDivisions,
  getDivisionOrder,
  (total, divisions, order) => (
    stableSort(divisions.map(d => {
      const bucket = total.find(d2 => d2.key === d.key);
      return {
        ...d,
        amount: bucket?.grant_amounts!.value ?? 0,
        count: bucket?.doc_count ?? 0,
      };
    }), getSorting(...order))
  )
);

// TODO fix this selector
export const getDivisionYear = createCachedSelector(
  (state: RootState, year: number | undefined) => year,
  getPerDivision,
  getDivisions,
  getDivisionOrder,
  (year, perDivision, divisions, order) => (
    stableSort(divisions.map(d => {
      const bucket = perDivision.find(d => +d.key_as_string! === year)?.divisions.buckets.find(d2 => d2.key === d.key);
      return {
        ...d,
        amount: bucket?.grant_amounts!.value ?? 0,
        count: bucket?.doc_count ?? 0,
      };
    }), getSorting(...order))
  )
)(
  (state: RootState, year: number | undefined) => year
);

export const getStackedData = createCachedSelector(
  getPerDivision,
  (state: RootState, divs: string[]) => divs,
  (agg, divs) => agg.map((year, idx) => ({
    year: +year.key_as_string!,
    // v: idx,
    ...divs.reduce((obj, key) => {
      const div = year.divisions.buckets.find(d => d.key === key);
      obj[`${key}-count`] = div?.doc_count ?? 0;
      obj[`${key}-amount`] = div?.grant_amounts.value ?? 0;
      return obj;
    }, {}),
  })))(
  (state, divisions) => JSON.stringify(divisions)
);

export const getTerms = (state: RootState) => state.filter.terms;

export const getSelectedTerms = createSelector(
  getTerms,
  (terms) => terms.filter(t => t.selected).map(t => t.term)
);

export const getTypeahead = (state: RootState) => state.data.typeahead;

export const getRelated = (state: RootState) => state.data.related;