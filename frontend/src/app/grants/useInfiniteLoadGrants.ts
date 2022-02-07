import { Grant, loadGrants } from 'api';
import { useGrantsDialogQuery, useQuery } from 'app/query';
import { queryClient } from 'app/queryClient';
import { useEffect, useMemo, useRef } from 'react';
import { useInfiniteQuery } from 'react-query';
import InfiniteLoader from 'react-window-infinite-loader';

export const useInfiniteLoadGrants = () => {
  const [ query ] = useQuery();
  const [ dialog ] = useGrantsDialogQuery();
  const hasMountedRef = useRef(false);
  const loaderRef = useRef<InfiniteLoader>(null);

  const loadMoreGrants = async ({ pageParam = 0 }) => {
    console.log('loading!!');
    const { data } = await loadGrants({
      ...query,
      order: dialog.grantDirection,
      sort: dialog.grantSort,
      start: dialog.grantDialogYear ?? query.start,
      end: dialog.grantDialogYear ?? query.end,
      divisions: dialog.grantDialogDivision ? [dialog.grantDialogDivision] : query.divisions,
      idx: pageParam,
    });
    return data;
  };

  const { data, isError, ...rest } = useInfiniteQuery('grants', loadMoreGrants, {
    getNextPageParam: (lastPage, pages) => (
      pages.length === 0 
        ? 0
        : lastPage?.length === 50
          ? pages.length * 50
          : undefined
    )
  });
  
  const clearGrants = () => {
    loaderRef.current?.resetloadMoreItemsCache();
    queryClient.setQueryData('grants', () => ({
      pages: [],
      pageParams: undefined,
    }));
    console.log('fetching after clear');
    rest.fetchNextPage();
  };

  // clear grants when any params change
  useEffect(() => {
    if (hasMountedRef.current && loaderRef.current) {
      console.log('clearing!!');
      clearGrants();
    }
    hasMountedRef.current = true;
  }, [
    JSON.stringify(dialog),
    JSON.stringify(query),
    hasMountedRef.current,
  ]);

  const count = (data?.pages?.reduce((count, page) => count += page.length, 0)) ?? 0;
  return {
    loaderRef,
    noMore: isError,
    count,
    data,
    clearGrants,
    ...rest,
  };
};

export const useGrant = (index: number) => {
  const data = queryClient.getQueryData('grants') as { pages: Grant[][] };
  const page = data?.pages[Math.floor(index / 50)];
  return useMemo(() => (
    page?.[index % 50]
  ), [page, index]);
};
