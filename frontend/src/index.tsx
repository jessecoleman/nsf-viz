import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import './index.css';
import { BrowserRouter as Router, Route } from 'react-router-dom';
import * as serviceWorker from './serviceWorker';

import ThemeProvider from 'theme';
import App from './App';

import store from 'app/store';
import { QueryParamProvider } from 'use-query-params';

ReactDOM.render(
  <Provider store={store}>
    <Router>
      <QueryParamProvider ReactRouterRoute={Route}>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </QueryParamProvider>
    </Router>
  </Provider>,
  document.getElementById('root')
);
//<Redirect noThrow from='/' to='/data%20science,machine%20learning' />

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
