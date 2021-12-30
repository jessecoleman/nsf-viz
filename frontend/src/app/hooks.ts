import queryString from 'query-string';
import { BooleanParam, DelimitedArrayParam, NumberParam, QueryParamConfig, StringParam, useQueryParams, withDefault } from 'use-query-params';
import { useState, useEffect, useRef, RefObject } from 'react';
import { useHistory, useLocation, useParams, useRouteMatch } from 'react-router';
import { useAsync } from 'react-async-hook';
import AwesomeDebouncePromise from 'awesome-debounce-promise';
import { useAppDispatch, useAppSelector } from './store';
import { isDrawerOpen, SortableKeys } from './selectors';
import { toggleDrawerOpen } from './filterReducer';
import { SortDirection } from '@material-ui/core';

export const useDrawer = (): [ boolean, () => void ] => {
  const dispatch = useAppDispatch();
  const drawerOpen = useAppSelector(isDrawerOpen);
  
  const handleToggle = () => {
    dispatch(toggleDrawerOpen(!drawerOpen));
  };
 
  return [ drawerOpen, handleToggle ];
};

export const useMeasure = <T extends HTMLElement>(): [ RefObject<T>, number ] => {
  
  const ref = useRef<T>(null);
  const padding = useRef<number>(0);

  useEffect(() => {
    if (ref.current) {
      const bbox = ref.current.getBoundingClientRect();
      const parent = ref.current.parentElement?.getBoundingClientRect();
      if (parent && bbox.width) {
        padding.current = parent.width - bbox.width;
      }
    }
  }, [ref.current?.getBoundingClientRect().width]);
 
  return [ ref, padding.current ];
};

type Dims = {
  width: number
  height: number
}

export const useMeasureChart = <T extends HTMLElement>(): [ RefObject<T>, Dims ] => {
  
  const ref = useRef<T>(null);
  const [ dims, setBox ] = useState({ width: 0, height: 0 });
  const [ windowWidth, windowHeight ] = useWindowDimensions();
  const [{ terms }] = useQuery();

  useEffect(() => {
    if (ref.current) {
      const bbox = ref.current.getBoundingClientRect();
      if (parent && bbox.height) {
        setBox({
          width: bbox.width,
          height: windowHeight - bbox.height,
        });
      }
    }
  }, [ref.current, windowWidth, windowHeight, JSON.stringify(terms)]);
 
  return [ ref, dims ];
};

type ResultBox<T> = { v: T }

export const useConstant = <T extends unknown>(fn: () => T): T => {
  const ref = useRef<ResultBox<T>>();

  if (!ref.current) {
    ref.current = { v: fn() };
  }

  return ref.current.v;
};

const getWindowDimensions = () => {
  return [ window.innerWidth, window.innerHeight ];
};

export const useWindowDimensions = () => {
  const [windowDimensions, setWindowDimensions] = useState(getWindowDimensions());

  useEffect(() => {
    const handleResize = () => {
      setWindowDimensions(getWindowDimensions());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowDimensions;
};

export const useDebouncedCallback = <T extends (...args: unknown[]) => void>(
  callback: T,
  timeout: number
) => {
  return useConstant(() =>
    AwesomeDebouncePromise<T>(callback, timeout)
  );
};

export const useDebouncedSearch = (
  searchFunction: (input: string) => void,
  timeout: number
) => {

  // Handle the input text state
  const [ input, setInput ] = useState('');

  // Debounce the original search async function
  const debouncedSearchFunction = useConstant(() =>
    AwesomeDebouncePromise(searchFunction, timeout)
  );

  // The async callback is run each time the text changes,
  // but as the search function is debounced, it does not
  // fire a new request on each keystroke
  const results = useAsync(async () => (
    input.length === 0 ? [] : debouncedSearchFunction(input)
  ), [debouncedSearchFunction, input]);

  // Return everything needed for the hook consumer
  return {
    input,
    setInput,
    results,
  };
};

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

export const useQuery = () => (
  useQueryParams({
    'org': OrgParam,
    'terms': ArrayParam,
    'divisions': ArrayParam,
    'start': DefaultNumberParam,
    'end': DefaultNumberParam,
    'intersection': DefaultBooleanParam,
    'match': MatchParam,
    'sort': SortParam,
    'direction': SortDirectionParam,
  })
);

export type QueryParams = ReturnType<typeof useQuery>[0];
