import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { logger } from 'redux-logger';

// import { createReduxHistoryContext, reachify } from 'redux-first-history';
import { createBrowserHistory } from 'history';
import queryString from 'query-string';

import filter from 'app/filterReducer';
import data from 'app/dataReducer';


// const { createReduxHistory, routerMiddleware, routerReducer } = createReduxHistoryContext({
//   history: createBrowserHistory(),
// });

const store = configureStore({
  reducer: {
    //router: connectRouter(history),
    // router: routerReducer,
    data,
    filter,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(logger)
});

// export const history = createReduxHistory(store);
// export const reachHistory = reachify(history);

export default store;

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;

export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
export const useAppDispatch =  () => useDispatch<AppDispatch>();