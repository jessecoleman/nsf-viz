import { applyMiddleware, combineReducers, createStore } from 'redux';
import thunkMiddleware from 'redux-thunk';

import { createReduxHistoryContext, reachify } from 'redux-first-history';
//import { connectRouter, routerMiddleware } from 'connected-react-router';
import { createBrowserHistory } from 'history';
import queryString from 'query-string';

import { filterReducer, dataReducer } from 'app/reducers';


const { createReduxHistory, routerMiddleware, routerReducer } = createReduxHistoryContext({
  history: createBrowserHistory(),
});

const store = createStore(
  combineReducers({
    //router: connectRouter(history),
    router: routerReducer,
    data: dataReducer,
    filter: filterReducer,
  }),
  //initialState,
  applyMiddleware(
    routerMiddleware,
    thunkMiddleware,
  ),
);

export const history = createReduxHistory(store);
export const reachHistory = reachify(history);
export default store;
