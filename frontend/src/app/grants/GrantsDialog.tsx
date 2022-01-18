import { useRef, useState } from 'react';
import { FixedSizeList } from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';

import { styled } from '@material-ui/core/styles';

import { 
  Dialog,
  Button,
  TableSortLabel,
  DialogActions,
  Collapse,
  LinearProgress,
} from '@material-ui/core';

import { loadGrants } from 'app/actions';
import { Grant } from '../../api/models/Grant';
import { useAppDispatch, useAppSelector } from 'app/store';
import { getGrantOrder, getNumGrants, loadingGrants, noMoreGrants } from 'app/selectors';
import { clearGrants } from 'app/dataReducer';
import { setGrantOrder } from 'app/filterReducer';
import { useEffect } from 'react';
import { useQuery, useWindowDimensions } from 'app/hooks';
import AbstractDialog from './AbstractDialog';
import GrantRow, { cols, GrantColumn, GrantListHeader } from './GrantRow';
import { BooleanParam, NumberParam, StringParam, useQueryParam } from 'use-query-params';

const ProgressBar = styled(LinearProgress)`
  margin-bottom: -4px;
`;

const GrantsTable = () => {

  const dispatch = useAppDispatch();
  const [ query ] = useQuery();
  const [ , height ] = useWindowDimensions();
  const hasMountedRef = useRef(false);
  const grantsRef = useRef<InfiniteLoader>(null);
  const numGrants = useAppSelector(getNumGrants);
  const [ orderBy, order ] = useAppSelector(getGrantOrder);
  const loading = useAppSelector(loadingGrants);
  const noMore = useAppSelector(noMoreGrants);
  
  useEffect(() => {
    if (hasMountedRef.current && grantsRef.current) {
      grantsRef.current.resetloadMoreItemsCache();
    }
    hasMountedRef.current = true;
  }, [ orderBy, order ]);

  const handleLoadGrants = async (idx: number) => {
    if (!loading) {
      await dispatch(loadGrants({
        ...query,
        order,
        order_by: orderBy === 'title' ? 'title.raw' : orderBy,
        start: query.grantDialogYear ?? query.start,
        end: query.grantDialogYear ?? query.end,
        divisions: query.grantDialogDivision ? [query.grantDialogDivision] : query.divisions,
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

const GrantsDialog = () => {

  const [ query ] = useQuery();

  useEffect(() => {
    dispatch(clearGrants());
  }, [JSON.stringify(query)]);

  const dispatch = useAppDispatch();
  const loading = useAppSelector(loadingGrants);
  const numGrants = useAppSelector(getNumGrants);
  const [ open, setOpen ] = useQueryParam('grantDialog', BooleanParam);
  const [ year, setYear ] = useQueryParam('grantDialogYear', NumberParam);
  const [ division, setDivision ] = useQueryParam('grantDialogDivision', StringParam);

  const [ firstOpen, setFirstOpen ] = useState(0);
  const [ orderBy, order ] = useAppSelector(getGrantOrder);
  
  useEffect(() => {
    if (open) {
      setFirstOpen(c => c + 1);
    } else {
      setFirstOpen(0);
    }
  }, [open, numGrants]);

  const handleSort = (property: keyof Grant) => () => {
    const newOrder = orderBy === property && order === 'desc' ? 'asc' : 'desc';

    dispatch(setGrantOrder([ property, newOrder ]));
    dispatch(loadGrants({
      ...query,
      order,
      order_by: orderBy === 'title' ? 'title.raw' : orderBy,
      start: query.grantDialogYear ?? query.start,
      end: query.grantDialogYear ?? query.end,
      divisions: query.grantDialogDivision ? [query.grantDialogDivision] : query.divisions,
      idx: 0,
    }));
  };

  const handleDownload = () => {
    window.alert('coming soon');
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <>
      <Dialog
        fullWidth={true}
        maxWidth='xl'
        open={!!open}
        onClose={handleClose}
      >
        <GrantListHeader>
          {cols.map(({ id, label }) => (
            <GrantColumn key={id} column={id}>
              <TableSortLabel
                active={orderBy === id}
                direction={order}
                onClick={handleSort(id)}
              >
                {label}
              </TableSortLabel>
            </GrantColumn>
          ))}
        </GrantListHeader>
        <Collapse in={firstOpen !== 1 || numGrants > 0}>
          <GrantsTable />
        </Collapse>
        {loading && <ProgressBar />}
        <DialogActions>
          <Button onClick={handleDownload}>
            Download
          </Button>
          <Button onClick={handleClose}>
            Dismiss
          </Button>
        </DialogActions>
      </Dialog>
      <AbstractDialog />
    </>
  );
};

export default GrantsDialog;
