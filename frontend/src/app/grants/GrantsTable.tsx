import { RefObject } from 'react';
import { FixedSizeList } from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';

import { useWindowDimensions } from 'app/hooks';
import GrantRow from './GrantRow';
import { useInfiniteLoadGrants } from './useInfiniteLoadGrants';
import { Collapse, LinearProgress, styled } from '@material-ui/core';

const ProgressBar = styled(LinearProgress)`
  margin-bottom: -4px;
`;

type GrantsTableProps = {
  widthRef: RefObject<HTMLDivElement>
};

const GrantsTable = (props: GrantsTableProps) => {

  const [ , height ] = useWindowDimensions();
  const { loaderRef, count, hasNextPage, isFetching, isFetchingNextPage, isFetchedAfterMount, fetchNextPage } = useInfiniteLoadGrants();

  const isLoaded = (idx: number) => !hasNextPage || (!isFetching && idx < count);
  const ITEM_SIZE = 64;

  const handleLoadGrants = async (idx: number) => {
    if (isFetchingNextPage) {
      await fetchNextPage({ pageParam: idx });
    }
  };

  return (
    <>
      <Collapse in={count > 0 && isFetchedAfterMount}>
        <InfiniteLoader
          ref={loaderRef}
          isItemLoaded={isLoaded}
          itemCount={hasNextPage ? count + 1 : count}
          loadMoreItems={handleLoadGrants}
        >
          {({ onItemsRendered, ref }) => (
            <FixedSizeList
              onItemsRendered={onItemsRendered}
              height={Math.min(ITEM_SIZE * (count + 1), height - 256)}
              width='100%'
              itemSize={ITEM_SIZE}
              itemCount={hasNextPage ? count : count + 1}
              ref={ref}
            >
              {GrantRow}
            </FixedSizeList>
          )}
        </InfiniteLoader>
      </Collapse>
      {isFetching && hasNextPage && <ProgressBar />}
    </>
  );
};

export default GrantsTable;
