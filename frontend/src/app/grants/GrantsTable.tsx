import { useRef, useEffect, RefObject } from 'react';
import { FixedSizeList } from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';

import { useAppDispatch, useAppSelector } from 'app/store';
import { getNumGrants, loadingGrants, noMoreGrants } from 'app/selectors';
import { useWindowDimensions } from 'app/hooks';
import { useGrantsDialogQuery, useQuery } from 'app/query';
import { loadGrants } from 'app/actions';
import GrantRow from './GrantRow';

type GrantsTableProps = {
  widthRef: RefObject<HTMLDivElement>
};

const GrantsTable = (props: GrantsTableProps) => {

  const dispatch = useAppDispatch();
  const [ query ] = useQuery();
  const [ dialog ] = useGrantsDialogQuery();
  const [ , height ] = useWindowDimensions();
  const hasMountedRef = useRef(false);
  const grantsRef = useRef<InfiniteLoader>(null);
  console.log(grantsRef);
  const numGrants = useAppSelector(getNumGrants);
  const loading = useAppSelector(loadingGrants);
  const noMore = useAppSelector(noMoreGrants);
  
  // clear grants when sort direction changes
  useEffect(() => {
    if (hasMountedRef.current && grantsRef.current) {
      grantsRef.current.resetloadMoreItemsCache();
    }
    hasMountedRef.current = true;
  }, [ dialog.grantSort, dialog.grantDirection, hasMountedRef.current ]);

  const handleLoadGrants = async (idx: number) => {
    if (!loading) {
      await dispatch(loadGrants({
        ...query,
        order: query.direction,
        order_by: (dialog.grantSort === 'title' || !dialog.grantSort) ? 'title.raw' : dialog.grantSort,
        start: dialog.grantDialogYear ?? query.start,
        end: dialog.grantDialogYear ?? query.end,
        divisions: dialog.grantDialogDivision ? [dialog.grantDialogDivision] : query.divisions,
        idx
      }));
    }
  };

  const count = noMore ? numGrants : numGrants + 1;
  const isLoaded = (idx: number) => noMore || idx < numGrants;

  return (
    <InfiniteLoader
      ref={grantsRef}
      isItemLoaded={isLoaded}
      itemCount={count}
      loadMoreItems={handleLoadGrants}
    >
      {({ onItemsRendered, ref }) => (
        <FixedSizeList
          onItemsRendered={onItemsRendered}
          height={height - 256}
          width='100%'
          itemSize={64}
          itemCount={count}
          ref={ref}
        >
          {GrantRow}
        </FixedSizeList>
      )}
    </InfiniteLoader>
  );
};

export default GrantsTable;
