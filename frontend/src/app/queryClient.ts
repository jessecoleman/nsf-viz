import { QueryClient } from 'react-query';
import Axios from 'axios';
import { stringify } from 'query-string';

// if (process.env.NODE_ENV === 'development') {
//   Axios.defaults.baseURL = 'http://localhost:8888';
// } else {
//   Axios.defaults.baseURL = 'http://backend:8888';
// }
Axios.defaults.baseURL = './data';

Axios.defaults.paramsSerializer = params => stringify(params);

export const queryClient = new QueryClient();
