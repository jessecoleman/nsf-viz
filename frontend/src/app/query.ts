import { BooleanParam, DelimitedArrayParam, NumberParam, QueryParamConfig, StringParam, useQueryParams, withDefault } from 'use-query-params';
import { SortableKeys } from './selectors';

export type Organization = 'nsf' | 'nih';

export const OrgParam = withDefault(
  StringParam,
  'nsf',
) as QueryParamConfig<Organization>;

export const ArrayParam = withDefault(
  DelimitedArrayParam,
  [],
) as QueryParamConfig<string[]>;

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
  'name',
) as QueryParamConfig<SortableKeys>;

const SortDirectionParam = withDefault(
  StringParam,
  'desc',
) as QueryParamConfig<'asc' | 'desc'>;

const MatchParam = withDefault(
  ArrayParam,
  ['title', 'abstract']
) as QueryParamConfig<Array<'title' | 'abstract'>>;

export const paramConfigMap = {
  'org': OrgParam,
  'terms': ArrayParam,
  'divisions': ArrayParam,
  'start': DefaultNumberParam,
  'end': DefaultNumberParam,
  'intersection': DefaultBooleanParam,
  'match': MatchParam,
  'sort': SortParam,
  'direction': SortDirectionParam,
  'grantDialogOpen': BooleanParam,
  'grantDialogYear': NumberParam,
  'grantDialogDivision': StringParam,
  'grantSort': StringParam,
  'grantDirection': SortDirectionParam,
};

export const useQuery = () => (
  useQueryParams(paramConfigMap)
);

export type QueryParams = ReturnType<typeof useQuery>[0];
