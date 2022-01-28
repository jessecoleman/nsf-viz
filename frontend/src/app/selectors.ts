import { createSelector } from '@reduxjs/toolkit';
import createCachedSelector from 're-reselect';
import { AggFields } from './chart/D3Chart';
import { SortDirection } from './filterReducer';
import { QueryParams } from './query';
import type { RootState } from './store';

export type SortableKeys = 'name' | 'count' | 'amount';

export const isAgg = (key: SortableKeys): key is keyof AggFields => ['count', 'amount'].includes(key);

const desc = <T>(a: T, b: T, key: SortableKeys) => {
  if (b[key] < a[key]) return -1;
  else if (b[key] > a[key]) return 1;
  else return 0;
};

const stableSort = <T>(array: T[], key: SortableKeys, direction: SortDirection): T[] => {
  const stabilizedThis = array.map((el, index): [T, number] => [el, index]);
  const sign = direction === 'desc' ? 1 : -1;
  stabilizedThis.sort((a, b) => {
    const order = sign * desc(a[0], b[0], key);
    if (order !== 0) return order;
    return sign * (a[1] - b[1]);
  });
  return stabilizedThis.map(el => el[0]);
};

export const isYearsLoading = (state: RootState) => state.data.loadingYears;

export const getYearAgg = (state: RootState) => state.data.yearAgg;

export const getYearDivisionAgg = (state: RootState) => state.data.yearDivisionAgg;

export const getDivisionAgg = (state: RootState) => state.data.divisionAgg;

export const getDirectoryAgg = (state: RootState) => state.data.directoryAgg;

const getDivisionMap = createSelector(
  getDivisionAgg,
  (agg) => Object.fromEntries(agg.map(d => [
    d.key,
    d
  ]))
);

const getDirectoryMap = createSelector(
  getDirectoryAgg,
  (agg) => Object.fromEntries(agg.map(d => [
    d.key,
    d
  ]))
);

export const getHighlightedDivision = (state: RootState) => state.filter.highlightedDivision;

export const getGrants = (state: RootState) => state.data.grants;

export const getNumGrants = (state: RootState) => state.data.grants.length;

export const getLegendFilters = (state: RootState) => state.filter.legendFilters;

export const isDrawerOpen = (state: RootState) => state.filter.drawerOpen;

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

const getGrantIdx = (state: RootState, idx: number) => idx;

export const getGrant = createCachedSelector(
  getGrants,
  getGrantIdx, 
  (grants, idx) => grants[idx]
)(getGrantIdx);

export const getOrg = (state: RootState, params: QueryParams) => params.org;

export const getDirectory = (state: RootState) => state.filter.directory;

const getOrgDirectory = createCachedSelector(
  getOrg,
  getDirectory,
  (org, directory) => directory[org] ?? []
)(getOrg);

export const getDepartmentMap = createSelector(
  getOrgDirectory,
  (directory) => Object.fromEntries(directory.map(dir => [
    dir.abbr,
    dir.departments?.map(d => d.abbr) ?? []
  ]))
);

export const getDivisionsMap = createCachedSelector(
  getOrg,
  getDirectory,
  (org, directory) => (
    Object.fromEntries(directory[org]?.flatMap(dir => [
      [dir.abbr, dir.name],
      ...(dir.departments?.map(dep => [dep.abbr, dep.name]) ?? [])
    ]) ?? []))
)(getOrg);

const getDivisionSort = (state: RootState, params: QueryParams) => params.sort;

const getDivisionDirection = (state: RootState, params: QueryParams) => params.direction;

export const getDirectoryAggs = createSelector(
  getOrgDirectory,
  getDivisionMap,
  getDirectoryMap,
  getDivisionSort,
  getDivisionDirection,
  (directory, divisions, directoryMap, sort, direction) => (
    stableSort(directory.map(dir => ({
      ...dir,
      key: dir.abbr,
      count: directoryMap[dir.abbr]?.count ?? 0,
      amount: directoryMap[dir.abbr]?.amount ?? 0,
      departments: stableSort(dir.departments?.map(dep => ({
        ...dep,
        key: dep.abbr,
        count: divisions[dep.abbr]?.count ?? 0,
        amount: divisions[dep.abbr]?.amount ?? 0
      })) ?? [], sort, direction),
    })) ?? [], sort, direction)
  )
);

// for use in DivisionTable
export const getSortedDivisionAggs = createSelector(
  getDivisionAgg,
  getDivisionSort,
  getDivisionDirection,
  (agg, sort, direction) => Object.fromEntries(stableSort(agg, sort, direction).map((div, idx) => [
    div.key,
    { ...div, idx }
  ]))
);

const getYear = (state: RootState, params: QueryParams & { year?: number }) => params.year ?? 0;

// for use in D3Tooltip
export const getDivisionYear = createCachedSelector(
  getYear, 
  getYearDivisionAgg,
  getDivisionSort,
  getDivisionDirection,
  (year, agg, sort, direction) => stableSort(
    agg.find(d => d.key === year)?.divisions ?? [],
    sort, direction
  )
)(getYear);

// for use in D3Chart
export const getStackedData = createSelector(
  getYearDivisionAgg,
  getDivisionSort,
  getDivisionDirection,
  (agg, sort, direction) => agg.map(({ key, divisions }) => ({
    year: key,
    aggs: Object.fromEntries(stableSort(divisions, sort, direction)
      .map(({ key, ...aggs }) => [ key, aggs ])
    )
  }))
);

export const getYearData = createSelector(
  getYearAgg,
  (aggs) => aggs.map(agg => ({
    ...agg,
    year: agg.key
  }))
);

export const getTerms = (state: RootState) => state.filter.terms;

export const getSelectedTerms = createSelector(
  getTerms,
  (terms) => terms.filter(t => t.selected).map(t => t.term)
);

export const getTypeahead = (state: RootState) => state.data.typeahead;

export const getRelated = (state: RootState) => state.data.related;