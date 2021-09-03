import { createSelector } from '@reduxjs/toolkit';
import createCachedSelector from 're-reselect';
import type { RootState } from './store';

export const getPerYear = (state: RootState) => state.data.perYear;

export const getPerDivision = (state: RootState) => state.data.perDivision;

export const getTotal = (state: RootState) => state.data.sumTotal;

export const getDivisions = (state: RootState) => state.filter.divisions;

export const getGrants = (state: RootState) => state.data.grants;

export const getNumGrants = (state: RootState) => state.data.grants.length;

export const getLegendFilters = (state: RootState) => state.filter.legendFilters;

export const getYearRange = (state: RootState) => state.filter.yearRange;

export const isGrantDialogOpen = (state: RootState) => state.filter.grantDialogOpen;

export const getGrantFilter = (state: RootState) => state.filter.grantFilter;

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
  (total, divisions) => (
    divisions.map(d => {
      const bucket = total.find(d2 => d2.key === d.key);
      return {
        ...d,
        amount: bucket?.grant_amounts!.value ?? 0,
        count: bucket?.doc_count ?? 0,
      };
    })
  )
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