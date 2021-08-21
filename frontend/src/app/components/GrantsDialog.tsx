import { useState, CSSProperties, useRef } from 'react';
import { useDispatch } from 'react-redux';
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
import { getGrant, getGrantOrder, getNumGrants, getSelectedAbstract, getSelectedGrant, loadingGrants, noMoreGrants } from 'app/selectors';
import { dismissAbstractDialog } from 'app/dataReducer';
import { setGrantOrder } from 'app/filterReducer';
import { useEffect } from 'react';
import { useQuery, useWindowDimensions } from 'app/hooks';

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    padding: theme.spacing(2),
    flexGrow: 1,
  },
  grantsTable: {
    paddingLeft: 0,
    paddingRight: 0,
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
    paddingLeft: theme.spacing(3),
    paddingRight: theme.spacing(1),
    borderBottom: `1px solid ${theme.palette.grey[300]}`
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
  const dispatch = useDispatch();
  const grant = useAppSelector(state => getGrant(state, index));

  if (!grant) return <div>Loading...</div>;

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
  const { divisions } = useQuery();
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

  const handleLoadGrants = (startIndex: number, stopIndex: number) => {
    console.log(loading);
    if (!loading) {
      return dispatch(loadGrants({ divisions, idx: startIndex }));
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
          height={height - 128}
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

const AbstractDialog = () => {
  
  const selectedGrant = useAppSelector(getSelectedGrant);
  const selectedAbstract = useAppSelector(getSelectedAbstract);

  const dispatch = useAppDispatch();

  const dismissDialog = () => {
    dispatch(dismissAbstractDialog());
  };
 
  return (
    <Dialog
      open={selectedGrant !== undefined}
      onClose={dismissDialog}
    >
      <DialogTitle>
        {selectedGrant?.title}
      </DialogTitle>
      <DialogContent>
        {selectedAbstract === undefined && <LinearProgress />}
        <Collapse in={selectedAbstract !== undefined}>
          <div dangerouslySetInnerHTML={{
            __html: selectedAbstract ?? ''
          }} />
        </Collapse>
      </DialogContent>
      <DialogActions>
        <Button onClick={dismissDialog}>
          Dismiss
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const GrantsDialog = () => {
  const classes = useStyles();

  const { divisions } = useQuery();
  const dispatch = useDispatch();
  const [ open, setOpen ] = useState<boolean>(false);
  const [ orderBy, order ] = useAppSelector(getGrantOrder);

  const handleSort = (property: keyof Grant) => () => {
    const newOrder = orderBy === property && order === 'desc' ? 'asc' : 'desc';

    dispatch(setGrantOrder([ property, newOrder ]));
    dispatch(loadGrants({ divisions, idx: 0 }));
  };

  const handleDownload = () => {
    window.alert('coming soon');
  };

  const handleOpen = () => {
    dispatch(loadGrants({ divisions, idx: 0 }));
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

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
        <DialogContent className={classes.grantsTable}>
          <GrantsTable />
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
