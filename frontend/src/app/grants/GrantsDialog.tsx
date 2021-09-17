import { useRef, useState } from 'react';
import { FixedSizeList } from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';

import { styled } from '@material-ui/core/styles';

import { 
  Dialog,
  Button,
  Tooltip,
  TableSortLabel,
  DialogActions,
  Collapse,
  LinearProgress,
} from '@material-ui/core';

import { loadGrants } from 'app/actions';
import { Grant } from '../../api/models/Grant';
import { useAppDispatch, useAppSelector } from 'app/store';
import { getGrantOrder, getNumGrants, isGrantDialogOpen, loadingGrants, noMoreGrants } from 'app/selectors';
import { clearGrants } from 'app/dataReducer';
import { clearGrantFilter, setGrantDialogOpen, setGrantOrder } from 'app/filterReducer';
import { useEffect } from 'react';
import { useNavigate, useQuery, useWindowDimensions } from 'app/hooks';
import AbstractDialog from './AbstractDialog';
import GrantRow, { cols, GrantColumn, GrantListHeader } from './GrantRow';

const ProgressBar = styled(LinearProgress)`
  margin-bottom: -4px;
`;

const GrantsTable = () => {

  const dispatch = useAppDispatch();
  const query = useQuery();
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
      await dispatch(loadGrants({ ...query, idx }));
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

  const { query } = useNavigate(() => {
    // TODO put this in reducer
    dispatch(clearGrants());
  }, '?divisions');
  const dispatch = useAppDispatch();
  const loading = useAppSelector(loadingGrants);
  const numGrants = useAppSelector(getNumGrants);
  const open = useAppSelector(isGrantDialogOpen);
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
    dispatch(loadGrants({ ...query, idx: 0 }));
  };

  const handleDownload = () => {
    window.alert('coming soon');
  };

  const handleOpen = () => {
    dispatch(clearGrants());
    dispatch(setGrantDialogOpen(true));
  };

  const handleClose = () => {
    dispatch(setGrantDialogOpen(false));
    dispatch(clearGrantFilter());
  };

  return (
    <>
      <Tooltip title='view grant details'>
        <Button 
          variant='text' 
          aria-label='grants' 
          onClick={handleOpen}
        >
          GRANTS
        </Button>
      </Tooltip>
      <Dialog
        fullWidth={true}
        maxWidth='xl'
        open={open}
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
