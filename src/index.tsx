import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import './index.css';
import { Router, Redirect } from '@reach/router';
//import { ConnectedRouter } from 'connected-react-router';
import * as serviceWorker from './serviceWorker';

import App from './App';

import store, { reachHistory } from 'app/store';

ReactDOM.render(
  <Provider store={store}>
    <Router history={reachHistory}>
      <Redirect noThrow from='/' to='/data%20science,machine%20learning' />
      <App path='/:terms' />
    </Router>
  </Provider>,
  document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
