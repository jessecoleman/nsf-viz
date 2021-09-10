import queryString from 'query-string';
import { useState, useEffect, useRef, RefObject } from 'react';
import { useHistory, useLocation, useParams, useRouteMatch } from 'react-router';
import { useAsync } from 'react-async-hook';
import AwesomeDebouncePromise from 'awesome-debounce-promise';

export const useMeasure = <T extends HTMLElement>(): [ RefObject<T>, number ] => {
  
  const ref = useRef<T>(null);
  // const dims = useRef<DOMRect>();
  const padding = useRef<number>(0);

  useEffect(() => {
    if (ref.current) {
      const bbox = ref.current.getBoundingClientRect();
      const parent = ref.current.parentElement?.getBoundingClientRect();
      console.log('parent', ref.current.parentElement);
      if (parent && bbox.width) {
        padding.current = parent.width - bbox.width;
      }
    }
  }, [ref.current?.getBoundingClientRect().width]);
 
  return [ ref, padding.current ];
};

type ResultBox<T> = { v: T }

export const useConstant = <T extends unknown>(fn: () => T): T => {
  const ref = useRef<ResultBox<T>>();

  if (!ref.current) {
    ref.current = { v: fn() };
  }

  return ref.current.v;
};

function getWindowDimensions() {
  const { innerWidth: width, innerHeight: height } = window;
  return {
    width,
    height
  };
}

export const useWindowDimensions = () => {
  const [windowDimensions, setWindowDimensions] = useState(getWindowDimensions());

  useEffect(() => {
    function handleResize() {
      setWindowDimensions(getWindowDimensions());
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowDimensions;
};

export const useDebouncedCallback = (
  callback: (...args: any[]) => void,
  timeout: number
) => {
  return useConstant(() =>
    AwesomeDebouncePromise(callback, timeout)
  );
};

export const useDebouncedSearch = (
  searchFunction: (input: string) => void,
  timeout: number
) => {

  // Handle the input text state
  const [input, setInput] = useState('');

  // Debounce the original search async function
  const debouncedSearchFunction = useConstant(() =>
    AwesomeDebouncePromise(searchFunction, timeout)
  );

  // The async callback is run each time the text changes,
  // but as the search function is debounced, it does not
  // fire a new request on each keystroke
  const results = useAsync(
    async () => {
      if (input.length === 0) {
        return [];
      } else {
        return debouncedSearchFunction(input);
      }
    },
    [debouncedSearchFunction, input]
  );

  // Return everything needed for the hook consumer
  return {
    input,
    setInput,
    results,
  };
};

type Filters = 'terms' | 'divisions'

type QueryParams = Record<Filters, string[]>

type PushParams = {
  component: Filters,
  action: 'add' | 'remove' | 'set',
  payload: string[] ,
}

const qsOptions: queryString.ParseOptions = { arrayFormat: 'bracket-separator', arrayFormatSeparator: '|' };

export const useQuery = (): QueryParams => {

  const location = useLocation();
  const query = queryString.parse(location.search, qsOptions);
  // let redirect = true;
  if (!query.terms && !query.divisions) {
    query.terms = [];
    query.divisions = [];
  } else if (!query.terms) {
    query.terms = [];
  } else if (!query.divisions) {
    query.divisions = [];
  }
  return query as QueryParams;
};

export const useNavigate = (
  callback: ({ params, query }: {
    params?: ReturnType<typeof useParams>
    query: QueryParams,
    firstLoad?: boolean,
  }) => void,
  path: string,
) => {

  
  const firstLoad = useRef(true);
  const history = useHistory();
  const match = useRouteMatch(path);
  const query = useQuery();
   
  const key = JSON.stringify(query[path.replace('?', '')]);

  useEffect(() => {
    callback({
      firstLoad: firstLoad.current,
      params: match?.params,
      query: query as QueryParams,
    });
    firstLoad.current = false;
  }, [key]);
  
  const push = ({ payload, action, component }: PushParams) => {
    let target = (query as QueryParams)[component];
    switch(action) {
    case 'add': {
      target = target.concat(payload);
      break;
    }
    case 'remove': {
      const toRemove = new Set(payload);
      target = target.filter(t => !toRemove.has(t));
      break;
    }
    case 'set': {
      target = payload;
      break;
    }
    }
    query[component] = target;
    history.push('?' + queryString.stringify(query, qsOptions));
  };

  return {
    query,
    push,
  };
};