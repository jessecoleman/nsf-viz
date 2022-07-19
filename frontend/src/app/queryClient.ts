import { QueryClient } from 'react-query';

import Axios from 'axios';
import { stringify } from 'query-string';

if (process.env.REACT_APP_LOCAL) {
  Axios.defaults.baseURL = 'http://localhost:8888';
  // eslint-disable-next-line no-constant-condition
} else if (true) {
  //process.env.CIP_API) {
  Axios.defaults.baseURL = 'https://grantexplorer-api.apps.cip.uw.edu/data';
} else {
  Axios.defaults.baseURL = '/data';
}

Axios.defaults.paramsSerializer = (params) => stringify(params);

export const queryClient = new QueryClient();
