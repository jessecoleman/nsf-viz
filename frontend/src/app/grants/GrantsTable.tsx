import { useRef, useEffect, RefObject } from 'react';
import { FixedSizeList } from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';

import { useWindowDimensions } from 'app/hooks';
import { useGrantsDialogQuery, useQuery } from 'app/query';
import GrantRow from './GrantRow';
import { useInfiniteLoadGrants } from './useInfiniteLoadGrants';

type GrantsTableProps = {
  widthRef: RefObject<HTMLDivElement>
};

const GrantsTable = (props: GrantsTableProps) => {

  const [ dialog ] = useGrantsDialogQuery();
  const [ , height ] = useWindowDimensions();
  const hasMountedRef = useRef(false);
  const grantsRef = useRef<InfiniteLoader>(null);

  const { count, noMore, fetchNextPage } = useInfiniteLoadGrants();

  // clear grants when sort direction changes
  useEffect(() => {
    if (hasMountedRef.current && grantsRef.current) {
      grantsRef.current.resetloadMoreItemsCache();
    }
    hasMountedRef.current = true;
  }, [ dialog.grantSort, dialog.grantDirection, hasMountedRef.current ]);

  const isLoaded = (idx: number) => noMore || idx < count;

  return (
    <InfiniteLoader
      ref={grantsRef}
      isItemLoaded={isLoaded}
      itemCount={noMore ? count : count + 1}
      loadMoreItems={() => fetchNextPage()}
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
