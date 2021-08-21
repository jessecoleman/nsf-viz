import queryString from 'query-string';
import { useState, useEffect, useRef } from 'react';
import { useHistory, useLocation, useParams, useRouteMatch } from 'react-router';

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