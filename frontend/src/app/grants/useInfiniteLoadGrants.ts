import { loadGrants } from 'api';
import { useGrantsDialogQuery, useQuery } from 'app/query';
import { queryClient } from 'app/queryClient';
import { useInfiniteQuery } from 'react-query';

export const useInfiniteLoadGrants = () => {
  const [ { direction, ...query }] = useQuery();
  const [ dialog ] = useGrantsDialogQuery();

  const loadMoreGrants = async ({ pageParam = 0 }) => {
    const { data } = await loadGrants({
      ...query,
      order: direction,
      sort: dialog.grantSort,
      start: dialog.grantDialogYear ?? query.start,
      end: dialog.grantDialogYear ?? query.end,
      divisions: dialog.grantDialogDivision ? [dialog.grantDialogDivision] : query.divisions,
      idx: pageParam,
    });
    return data;
  };

  const { data, isError, ...rest } = useInfiniteQuery('grants', loadMoreGrants, {
    getNextPageParam: (lastPage, pages) => (pages.length + 1) * 50
  });
  
  const clearGrants = () => {
    console.log('clearing!!');
    queryClient.setQueryData('grants', () => ({
      pages: [],
      pageParams: undefined,
    }));
    rest.fetchNextPage();
  };
  const count = (data?.pages?.reduce((count, page) => count += page.length, 0)) ?? 0;
  return {
    noMore: isError,
    count,
    data,
    clearGrants,
    ...rest,
  };
};

