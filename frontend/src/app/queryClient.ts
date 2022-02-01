import { QueryClient } from 'react-query';
import Axios from 'axios';

Axios.defaults.baseURL = 'http://localhost:8888';
export const queryClient = new QueryClient();