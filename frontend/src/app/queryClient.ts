import { QueryClient } from 'react-query';
import Axios from 'axios';
import { stringify } from 'query-string';

Axios.defaults.baseURL = 'http://localhost:8888';
Axios.defaults.paramsSerializer = params => stringify(params);

export const queryClient = new QueryClient();
