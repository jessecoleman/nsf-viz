import { useState, CSSProperties, useRef } from 'react';
import { FixedSizeList } from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';

import { Theme, makeStyles } from '@material-ui/core/styles';

import { 
  Dialog,
  DialogTitle,
  DialogContent,
  Grid,
  Button,
  Tooltip,
  TableSortLabel,
  DialogActions,
  Collapse,
  LinearProgress,
  GridSize,
} from '@material-ui/core';

import { format, timeFormat, timeParse } from 'd3';

import { loadAbstract, loadGrants } from 'app/actions';
import { Grant } from '../types';
import { useAppDispatch, useAppSelector } from 'app/store';
import { getGrant, getGrantOrder, getNumGrants, loadingGrants, noMoreGrants } from 'app/selectors';
import { clearGrants } from 'app/dataReducer';
import { setGrantOrder } from 'app/filterReducer';
import { useEffect } from 'react';
import { useNavigate, useQuery, useWindowDimensions } from 'app/hooks';
import AbstractDialog from './AbstractDialog';

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    padding: theme.spacing(2),
    flexGrow: 1,
  },
  grantsDialog: {
    paddingLeft: 0,
    paddingRight: 0,
    overflowY: 'hidden'
  },
  grantsTable: {
    overflowY: 'hidden'
  },
  grantCell: {
    paddingLeft: '24px',
  },
  fab: {
    marginRight: theme.spacing(1)
    //position: 'fixed',
    //bottom: theme.spacing(4),
    //left: theme.spacing(4),
  },
  listItem: {
    cursor: 'pointer',
    paddingLeft: theme.spacing(3),
    paddingRight: theme.spacing(1),
    borderBottom: `1px solid ${theme.palette.grey[300]}`,
    ['&:hover']: {
      backgroundColor: theme.palette.grey[100],
    },
  },
}));

const cols: Column[] = [
  { id: 'title', format: t => t, label: 'Grant Title', gridSize: 7 },
  { id: 'date', format: d => timeFormat('%b %Y')(timeParse('%Y-%m-%d')(d)!), label: 'Date', gridSize: 1 },
  { id: 'amount', format: format('$,'), label: 'Amount', gridSize: 1 },
  { id: 'division', format: d => d, label: 'Division', gridSize: 3 },
];

type GrantRowProps = {
  index: number
  style: CSSProperties
}

const GrantRow = (props: GrantRowProps) => {

  const { index, style } = props;

  const classes = useStyles();
  const dispatch = useAppDispatch();
  const grant = useAppSelector(state => getGrant(state, index));

  if (!grant) return null;

  const setSelectedGrant = () => {
    console.log(grant);
    dispatch(loadAbstract(grant.id));
  };

  return (
    <Grid 
      container 
      key={index}
      direction='row' 
      alignItems='center' 
      className={classes.listItem}
      style={style}
      onClick={setSelectedGrant}
    >
      {cols.map(({ gridSize, format, id }, idx: number) => (
        <Grid item xs={gridSize} key={idx}>
          {format(grant[id])}
        </Grid>
      ))}
    </Grid>
  );
};

type Column = {
  id: keyof Grant
  format: (s: any) => string,
  label: string,
  gridSize: GridSize,
}

const GrantsTable = () => {

  const dispatch = useAppDispatch();
  const query = useQuery();
  const { height } = useWindowDimensions();
  const hasMountedRef = useRef(false);
  const grantsRef = useRef<InfiniteLoader>(null);
  const numGrants = useAppSelector(getNumGrants);
  const [ orderBy, order ] = useAppSelector(getGrantOrder);
  const loading = useAppSelector(loadingGrants);
  const noMore = useAppSelector(noMoreGrants);
  
  useEffect(() => {
    if (hasMountedRef.current) {
      if (grantsRef.current) {
        grantsRef.current.resetloadMoreItemsCache();
      }
    }
    hasMountedRef.current = true;
  }, [ orderBy, order ]);

  const handleLoadGrants = (idx: number) => {
    if (!loading) {
      return dispatch(loadGrants({ ...query, idx }));
    } else {
      return null;
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
  const classes = useStyles();

  const { query } = useNavigate(() => {
    // TODO put this in reducer
    dispatch(clearGrants());
  }, '?divisions');
  const dispatch = useAppDispatch();
  const loading = useAppSelector(loadingGrants);
  const numGrants = useAppSelector(getNumGrants);
  const [ open, setOpen ] = useState<boolean>(false);
  const [ orderBy, order ] = useAppSelector(getGrantOrder);

  const handleSort = (property: keyof Grant) => () => {
    const newOrder = orderBy === property && order === 'desc' ? 'asc' : 'desc';

    dispatch(setGrantOrder([ property, newOrder ]));
    dispatch(loadGrants({ ...query, idx: 0 }));
  };

  const handleDownload = () => {
    window.alert('coming soon');
  };

  const handleOpen = () => {
    dispatch(loadGrants({ ...query, idx: 0 }));
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  console.log(numGrants > 0);

  return (
    <>
      <Tooltip title='view grant details'>
        <Button 
          variant='text' 
          aria-label='grants' 
          className={classes.fab}
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
        <DialogTitle>
          <Grid 
            container 
            direction='row'
          >
            {cols.map(c => (
              <Grid key={c.id} item xs={(c.gridSize as GridSize)}>
                <TableSortLabel
                  active={orderBy === c.id}
                  direction={order}
                  onClick={handleSort(c.id)}
                >
                  {c.label}
                </TableSortLabel>
              </Grid>
            ))}
          </Grid>
        </DialogTitle>
        <DialogContent className={classes.grantsDialog}>
          <Collapse in={numGrants > 0} className={classes.grantsTable}>
            <GrantsTable />
          </Collapse>
          {loading && <LinearProgress />}
        </DialogContent>
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
