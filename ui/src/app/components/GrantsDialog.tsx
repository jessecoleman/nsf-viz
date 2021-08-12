import React, { useState, CSSProperties } from 'react';
import { useDispatch } from 'react-redux';
import { VariableSizeList } from 'react-window';
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
} from '@material-ui/core';

import { format, timeFormat, timeParse } from 'd3';

import { loadGrants } from 'app/actions';
import { GridSize, SortDirection } from '../types';
import { useAppDispatch, useAppSelector } from 'app/store';
import { getGrant, getGrants, isViewingAbstract, loadingGrants, noMoreGrants } from 'app/selectors';

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

type Column = {
  id: 'title' | 'date' | 'amount' | 'division',
  format: (s: any) => string,
  label: string,
  gridSize: GridSize,
}

const cols: Column[] = [
  { id: 'title', format: t => t, label: 'Grant Title', gridSize: 7 },
  { id: 'date', format: d => timeFormat('%b %Y')(timeParse('%Y-%m-%d')(d)!), label: 'Date', gridSize: 1 },
  { id: 'amount', format: format('$,'), label: 'Amount', gridSize: 1 },
  { id: 'division', format: d => d, label: 'Division', gridSize: 3 },
];


const GrantsTable: React.FC = () => {

  const classes = useStyles();

  const dispatch = useAppDispatch();
  const grants = useAppSelector(getGrants);
  console.log(grants);
  const loading = useAppSelector(loadingGrants);
  const noMore = useAppSelector(noMoreGrants);
  const viewingAbstract = useAppSelector(isViewingAbstract);

  const handleLoadGrants = (startIndex: number, stopIndex: number) => (
    // TODO why does this need to be returned?
    dispatch(loadGrants({ idx: startIndex }))
  );

  const count = noMore ? grants.length : grants.length + 1;
  const loadMore = loading ? () => null : handleLoadGrants;
  const isLoaded = (idx: number) => noMore || idx < grants.length;

  const getRowSize = (idx: number) => idx === viewingAbstract
    ? 144
    : 64;

  let listRef: React.Ref<HTMLElement>;

  const setViewing = (idx: number) => {
    console.log(listRef);
    dispatch({ type: 'SET_VIEWING', idx });
    (listRef as any).current?.resetAfterIndex(idx); // TODO
  };
 
  type RowRendererProps = {
    index: number
    style: CSSProperties
  }

  const RowRenderer = (props: RowRendererProps) => {
  
    const { index, style } = props;
  
    const grant = useAppSelector(state => getGrant(state, index));
    const viewingAbstract = useAppSelector(isViewingAbstract);

    if (!isLoaded(index)) return <div>Loading...</div>;
    if (!grant) return <div>null</div>;

    return (
      <Grid 
        container 
        key={index}
        direction='row' 
        alignItems='center' 
        className={classes.listItem}
        style={style}
        onClick={() => setViewing(index)}
      >
        {cols.map(({ gridSize, format, id }, idx: number) => (
          <Grid item xs={gridSize} key={idx}>
            {format(grant[id])}
          </Grid>
        ))}
        {index === viewingAbstract ?
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
      {({ onItemsRendered, ref }) => {
        listRef = ref;
        return (
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
        );
      }}
    </InfiniteLoader>
  );
};

const GrantsDialog: React.FC = () => {
  const classes = useStyles();

  const dispatch = useDispatch();
  const [ open, setOpen ] = useState<boolean>(false);
  const [ order, setOrder ] = useState<SortDirection>('desc');
  const [ orderBy, setOrderBy ] = useState<string>('date');

  const handleRequestSort = (property: string) => () => {
    const isDesc = orderBy === property && order === 'desc';
    setOrder(isDesc ? 'asc' : 'desc');
    setOrderBy(property);
    dispatch(loadGrants({ idx: 0, order, orderBy }));
  };

  const handleOpen = () => {
    dispatch(loadGrants({ idx: 0, order, orderBy }));
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <>
      <Tooltip title='view grant detials'>
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
                  onClick={handleRequestSort(c.id)}
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
};

export default GrantsDialog;
