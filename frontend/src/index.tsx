import ReactDOM from 'react-dom';
import './index.css';
import { BrowserRouter as Router, Route } from 'react-router-dom';
import { QueryClientProvider } from 'react-query';
import * as serviceWorker from './serviceWorker';

import ThemeProvider from 'theme';
import App from './App';

import { QueryParamProvider } from 'use-query-params';
import { queryClient } from 'app/queryClient';

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
