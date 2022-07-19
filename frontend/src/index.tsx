import ReactDOM from 'react-dom';
import { QueryClientProvider } from 'react-query';
import { Route, BrowserRouter as Router } from 'react-router-dom';

import ThemeProvider from 'theme';
import { QueryParamProvider } from 'use-query-params';

import { queryClient } from 'app/queryClient';

import App from './App';
import './index.css';
import * as serviceWorker from './serviceWorker';

ReactDOM.render(
  <Router>
    <QueryParamProvider ReactRouterRoute={Route as any}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </QueryClientProvider>
    </QueryParamProvider>
  </Router>,
  document.getElementById('root')
);
//<Redirect noThrow from='/' to='/data%20science,machine%20learning' />

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
