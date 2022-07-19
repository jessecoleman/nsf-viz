import {
  BooleanParam,
  DelimitedArrayParam,
  NumberParam,
  QueryParamConfig,
  StringParam,
  useQueryParam,
  useQueryParams,
  withDefault,
} from 'use-query-params';

import { SortableKeys } from 'app/sort';

export type Organization = 'nsf' | 'nih';

export const OrgParam = withDefault(
  StringParam,
  'nsf'
) as QueryParamConfig<Organization>;

export const ArrayParam = withDefault(
  DelimitedArrayParam,
  []
) as QueryParamConfig<string[]>;

export const DivisionsArrayParam = withDefault(
  DelimitedArrayParam,
  undefined
) as QueryParamConfig<string[] | undefined>;

export const DefaultStringParam = withDefault(
  StringParam,
  undefined
) as QueryParamConfig<string | undefined>;

export const DefaultNumberParam = withDefault(
  NumberParam,
  undefined
) as QueryParamConfig<number | undefined>;

export const DefaultBooleanParam = withDefault(
  BooleanParam,
  undefined
) as QueryParamConfig<boolean | undefined>;

const SortParam = withDefault(
  StringParam,
  'amount'
) as QueryParamConfig<SortableKeys>;

const SortDirectionParam = withDefault(StringParam, 'desc') as QueryParamConfig<
  'asc' | 'desc'
>;

const MatchParam = withDefault(ArrayParam, [
  'title',
  'abstract',
]) as QueryParamConfig<Array<'title' | 'abstract'>>;

export const paramConfigMap = {
  org: OrgParam,
  terms: ArrayParam,
  start: DefaultNumberParam,
  end: DefaultNumberParam,
  intersection: DefaultBooleanParam,
  match: MatchParam,
  sort: SortParam,
  direction: SortDirectionParam,
};

const grantParamConfig = {
  grantDialogOpen: BooleanParam,
  grantDialogYear: NumberParam,
  grantDialogDivision: StringParam,
  grantSort: DefaultStringParam,
  grantDirection: SortDirectionParam,
};

export const useSearchQuery = () => useQueryParams(paramConfigMap);

export const useGrantsDialogQuery = () => useQueryParams(grantParamConfig);

export const useTermsQuery = () => useQueryParam('terms', ArrayParam);

export const useGrantIdQuery = () =>
  useQueryParam('grantId', DefaultStringParam);

export const useQuery = () =>
  useQueryParams({
    ...paramConfigMap,
    divisions: ArrayParam,
  });

export const useSortQuery = () =>
  useQueryParams({
    sort: SortParam,
    direction: SortDirectionParam,
  });

export const useDivisionsQuery = () => {
  return useQueryParam('divisions', DivisionsArrayParam);
  // const [ divisions, setDivisions ] = useQueryParam('divisions', DelimitedArrayParam);
  // const { divisionMap } = useDirectory();
  // if (divisions && divisions.every(d => d)) {
  //   return [ new Set(divisions as string[]), setDivisions ];
  // } else {
  //   return [ new Set(Object.keys(divisionMap)), setDivisions ];
  // }
};

export const useBeta = () => useQueryParam('beta', DefaultBooleanParam);

export const useTutorial = () => useQueryParam('tutorial', DefaultNumberParam);

export const useAbout = () => useQueryParam('about', DefaultBooleanParam);

export type QueryParams = ReturnType<typeof useQuery>[0];
