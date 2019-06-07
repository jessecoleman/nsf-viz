import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { VariableSizeList } from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';

import { Theme, makeStyles } from '@material-ui/core/styles';

import { 
  Dialog,
  DialogTitle,
  DialogContent,
  Grid,
  Button,
  TableSortLabel,
} from '@material-ui/core';

import { getGrants } from 'app/actions';
import { GrantColumn, GridSize } from 'types.d';

const useStyles = makeStyles((theme: Theme) => ({
    root: {
      padding: theme.spacing(2),
      flexGrow: 1,
    },
    fab: {
      marginRight: theme.spacing(1)
      //position: 'fixed',
      //bottom: theme.spacing(4),
      //left: theme.spacing(4),
    },
    listItem: {
      borderBottom: `1px solid ${theme.palette.grey[300]}`
    },
}));

const cols = [
  { id: 'title', numeric: false, label: 'Grant Title', gridSize: 7 },
  { id: 'date', numeric: false, label: 'Date', gridSize: 1 },
  { id: 'amount', numeric: false, label: 'Amount', gridSize: 1 },
  { id: 'division', numeric: false, label: 'Division', gridSize: 3 },
];


const GrantsTable: React.FC = () => {

  const classes = useStyles();

  const dispatch = useDispatch();
  const grants = useSelector(state => state.data.grants);
  const loadingGrants = useSelector(state => state.data.loadingGrants);
  const noMoreGrants = useSelector(state => state.data.noMoreGrants);
  const viewingAbstract = useSelector(state => state.data.viewingAbstract);

  const loadGrants = (idx) => {
    dispatch(getGrants(idx));
  }

  const count = noMoreGrants ? grants.length : grants.length + 1;
  const loadMore = loadingGrants ? () => {} : loadGrants;
  const isLoaded = index => noMoreGrants || index < grants.length;

  const getRowSize = idx => {
    if (idx === viewingAbstract) {
      return 144
    } else {
      return 64
    }
  }

  const setViewing = idx => {
    dispatch({ type: 'SET_VIEWING', idx: idx });
  }
 
  const RowRenderer: React.FC = (props) => {
    // data,
    // rowIndex,
    // columnIndex,
    // style,
  //}) => {
  
    const idx = (props as any).index;
  
    const dispatch = useDispatch();
    const grant = useSelector(state => state.data.grants[idx]);
    const viewingAbstract = useSelector(state => state.data.viewingAbstract);

    if (!isLoaded(idx)) { console.log('not loaded'); return <div>Loading...</div> }
    if (!grant) return null;

    return (
      <Grid 
        container 
        direction='row' 
        alignItems='center' 
        className={classes.listItem}
        style={(props as any).style}
        onClick={() => setViewing(idx)}
      >
        <Grid item xs={7}>{grant.title}</Grid>
        <Grid item xs={1}>{grant.date}</Grid>
        <Grid item xs={1}>{grant.amount}</Grid>
        <Grid item xs={3}>{grant.division}</Grid>
        {idx === viewingAbstract ?
          <Grid item xs={12}>Abstract Abstract Abstract Abstract Abstract Abstract Abstract Abstract Abstract Abstract Abstract Abstract Abstract Abstract Abstract Abstract Abstract Abstract Abstract Abstract Abstract Abstract Abstract Abstract Abstract Abstract Abstract Abstract Abstract Abstract Abstract Abstract Abstract Abstract Abstract Abstract Abstract Abstract Abstract Abstract Abstract Abstract Abstract Abstract Abstract Abstract Abstract Abstract Abstract Abstract Abstract Abstract Abstract Abstract Abstract Abstract Abstract Abstract Abstract Abstract Abstract</Grid> : null
        }
      </Grid>
    );
  };

  return (
    <InfiniteLoader
      isItemLoaded={isLoaded}
      itemCount={count}
      loadMoreItems={loadMore}
    >
      {({ onItemsRendered, ref }) => (
        <VariableSizeList
          onItemsRendered={onItemsRendered}
          height={600}
          width='100%'
          itemSize={getRowSize}
          itemCount={count}
          ref={ref}
        >
          {RowRenderer}
        </VariableSizeList>
      )}
    </InfiniteLoader>
  );
}

const GrantsDialog: React.FC = () => {
  const classes = useStyles();

  const dispatch = useDispatch();
  const [ open, setOpen ] = useState(false);

  const handleOpen = () => {
    dispatch(getGrants(0));
    setOpen(true);
  }

  const handleClose = () => {
    setOpen(false);
  }

  return (
    <>
      <Button 
        variant='text' 
        aria-label='grants' 
        className={classes.fab}
        onClick={handleOpen}
      >
        GRANTS
      </Button>
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
              <Grid key={c.id} item>
                <TableSortLabel
                  active={true}
                  direction={'asc'}
                  onClick={() => null}
                >
                  {c.label}
                </TableSortLabel>
              </Grid>
            ))}
          </Grid>
        </DialogTitle>
        <DialogContent>
          <GrantsTable />
        </DialogContent>
      </Dialog>
    </>
  );
}

export default GrantsDialog;
