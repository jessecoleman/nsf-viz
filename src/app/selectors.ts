import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "./store";

export const getPerYear = (state: RootState) => state.data.perYear;

export const getPerDivision = (state: RootState) => state.data.perDivision;

export const getTotal = (state: RootState) => state.data.sumTotal;

export const getDivisions = (state: RootState) => state.filter.divisions;

export const getGrants = (state: RootState) => state.data.grants;

export const loadingGrants = (state: RootState) => state.data.loadingGrants;

export const noMoreGrants = (state: RootState) => state.data.noMoreGrants;

export const isViewingAbstract = (state: RootState) => state.data.viewingAbstract;

export const getGrant = createSelector(
  getGrants,
  (state: RootState, idx: number) => idx,
  (grants, idx) => grants[idx]
);

export const getTerms = (state: RootState) => state.filter.terms;

export const getSuggestions = (state: RootState) => state.data.suggestions;