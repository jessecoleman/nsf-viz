import { createSelector } from '@reduxjs/toolkit';
import { RootState } from './store';

export const getPerYear = (state: RootState) => state.data.perYear;

export const getPerDivision = (state: RootState) => state.data.perDivision;

export const getTotal = (state: RootState) => state.data.sumTotal;

export const getDivisions = (state: RootState) => state.filter.divisions;

export const getGrants = (state: RootState) => state.data.grants;

export const getNumGrants = (state: RootState) => state.data.grants.length;

export const getGrantOrder = (state: RootState) => state.filter.grantOrder;

export const loadingGrants = (state: RootState) => state.data.loadingGrants;

export const noMoreGrants = (state: RootState) => state.data.noMoreGrants;

export const getSelectedGrantId = (state: RootState) => state.data.selectedGrantId;

export const getSelectedGrant = createSelector(
  getGrants,
  getSelectedGrantId,
  (grants, id) => {
    console.log(id, grants, grants.find(grant => grant.id === id));
    return id ? grants.find(grant => grant.id === id) : undefined;
  }
);

export const getSelectedAbstract = (state: RootState) => state.data.selectedAbstract;

export const getGrant = createSelector(
  getGrants,
  (state: RootState, idx: number) => idx,
  (grants, idx) => grants[idx]
);

export const getTerms = (state: RootState) => state.filter.terms;

export const getTypeahead = (state: RootState) => state.data.typeahead;

export const getRelated = (state: RootState) => state.data.related;