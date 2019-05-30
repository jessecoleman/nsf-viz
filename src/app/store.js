import { applyMiddleware, combineReducers, createStore } from 'redux';
import thunkMiddleware from 'redux-thunk';
import { connectRouter, routerMiddleware } from 'connected-react-router'
import { createBrowserHistory } from 'history';
import queryString from 'query-string';

import { filterReducer, dataReducer } from 'app/reducers';

export const history = createBrowserHistory();

const configureStore = (initialState) => {

  const reducers = combineReducers({
    router: connectRouter(history),
    data: dataReducer,
    filter: filterReducer,
  });

  const store = createStore(
    reducers,
    initialState,
    // REDUX DEV TOOLS + THUNK EXTENSION ENABLER.
    applyMiddleware(
      routerMiddleware(history),
      thunkMiddleware,
    ),
  );
  return store;
}

export default configureStore;
