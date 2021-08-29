import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import { AnyAction, configureStore, ThunkAction } from '@reduxjs/toolkit';
import { logger } from 'redux-logger';

import filter from 'app/filterReducer';
import data from 'app/dataReducer';


const store = configureStore({
  reducer: {
    data,
    filter,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(logger)
});

export default store;

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;

export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
export const useAppDispatch =  () => useDispatch<AppDispatch>();