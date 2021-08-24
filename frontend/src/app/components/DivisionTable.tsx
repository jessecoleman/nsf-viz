import { useState } from 'react';
import { Theme, makeStyles } from '@material-ui/core/styles';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableSortLabel,
  Toolbar,
  Typography,
  Paper,
  Checkbox,
  IconButton,
  Tooltip
} from '@material-ui/core';
import { FilterList } from '@material-ui/icons';
import { lighten } from '@material-ui/core/styles/colorManipulator';

import GrantsDialog from 'app/components/GrantsDialog';

import { format } from 'd3';

import { SortDirection } from '../types';
import { getDivisions } from 'app/selectors';
import{ loadDivisions } from '../actions';
import { useAppDispatch, useAppSelector } from 'app/store';
import { useNavigate } from 'app/hooks';

const desc = <T extends unknown>(a: T, b: T, orderBy: keyof T) => {
  if (b[orderBy] < a[orderBy]) {
    return -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return 1;
  }
  return 0;
};

const stableSort = <T extends unknown>(array: Array<T>, cmp) => {
  const stabilizedThis = array.map((el, index): [T, number] => [el, index]);
  stabilizedThis.sort((a, b) => {
    const order = cmp(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });
  return stabilizedThis.map(el => el[0]);
};

const getSorting = <T extends unknown>(order: SortDirection, orderBy: keyof T) => {
  return order === 'desc' ? (a: T, b: T) => desc(a, b, orderBy) : (a: T, b: T) => -desc(a, b, orderBy);
};

const rows = [
  { id: 'title', numeric: false, disablePadding: true, label: 'Name' },
  { id: 'count', numeric: true, disablePadding: true, label: 'Grants' },
  { id: 'amount', numeric: false, disablePadding: true, label: 'Amount' },
];

type EnhancedTableHeadProps = {
  onSelectAllClick: (checked: boolean) => void,
  order: SortDirection,
  orderBy: string,
  numSelected: number,
  rowCount: number,
  onRequestSort: (key: string) => void,
}

const EnhancedTableHead = (props: EnhancedTableHeadProps) => {

  const {
    onSelectAllClick,
    order,
    orderBy,
    numSelected,
    rowCount,
    onRequestSort 
  } = props;

  const handleSort = (property: string) => () => {
    onRequestSort(property);
  };

  const allSelected = numSelected === rowCount;

  return (
    <TableHead>
      <TableRow>
        <TableCell padding='checkbox'>
          <Checkbox
            indeterminate={numSelected > 0 && numSelected < rowCount}
            checked={allSelected}
            onChange={() => onSelectAllClick(!allSelected)}
          />
        </TableCell>
        {rows.map(row => (
          <TableCell
            key={row.id}
            padding={row.disablePadding ? 'none' : 'default'}
            sortDirection={orderBy === row.id ? order : false}
          >
            <Tooltip
              title='Sort'
              placement={row.numeric ? 'bottom-end' : 'bottom-start'}
              enterDelay={300}
            >
              <TableSortLabel
                active={orderBy === row.id}
                direction={order}
                onClick={handleSort(row.id)}
              >
                {row.label}
              </TableSortLabel>
            </Tooltip>
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
};

const useToolbarStyles = makeStyles((theme: Theme) => ({
  root: {
    paddingRight: theme.spacing(1),
  },
  highlight: theme.palette.type === 'light'
    ? {
      color: theme.palette.secondary.main,
      backgroundColor: lighten(theme.palette.secondary.light, 0.85),
    }
    : {
      color: theme.palette.text.primary,
      backgroundColor: theme.palette.secondary.dark,
    },
  spacer: {
    flex: '1 1 100%',
  },
  actions: {
    color: theme.palette.text.secondary,
  },
  title: {
    flex: '0 0 auto',
  },
}));

type EnhancedTableToolbarProps = {
  numSelected: number
}

const EnhancedTableToolbar = (props: EnhancedTableToolbarProps) => {
  const classes = useToolbarStyles();
  const { numSelected } = props;

  return (
    <Toolbar className={classes.root}>
      <div className={classes.title}>
        {numSelected > 0 ? (
          <Typography color='inherit' variant='subtitle1'>
            {`${numSelected} division${numSelected === 1 ? '': 's'} selected`}
          </Typography>
        ) : (
          <Typography variant='h6' id='tableTitle'>
            Divisions
          </Typography>
        )}
      </div>
      <div className={classes.spacer} />
      <div className={classes.actions}>
        {numSelected > 0 ? (
          <GrantsDialog />
        ) : (
          <Tooltip title='Filter list'>
            <IconButton aria-label='Filter list'>
              <FilterList />
            </IconButton>
          </Tooltip>
        )}
      </div>
    </Toolbar>
  );
};

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    width: '100%',
    maxHeight: '80vh',
    marginTop: theme.spacing(2),
    display: 'flex',
    flexDirection: 'column',
  },
  table: {
  },
  tableWrapper: {
    flex: 1,
    overflowY: 'scroll',
  },
}));


const EnhancedTable = () => {

  const classes = useStyles();
  const dispatch = useAppDispatch();
  const [ order, setOrder ] = useState<SortDirection>('desc');
  const [ orderBy, setOrderBy ] = useState<string>('doc_count');
  const divisions = useAppSelector(getDivisions);

  const { query, push } = useNavigate(({ firstLoad }) => {
    if (firstLoad) {
      dispatch(loadDivisions());
    }
  }, '?divisions');

  const selectedDivisions = new Set(query.divisions);
  const numSelected = query.divisions?.length ?? 0;

  function handleRequestSort(property: string) {
    const isDesc = orderBy === property && order === 'desc';
    setOrder(isDesc ? 'asc' : 'desc');
    setOrderBy(property);
  }

  const select = (key: string, selected: boolean) => () => {
    push({
      component: 'divisions',
      action: selected ? 'remove' : 'add',
      payload: [key]
    });
  };

  const selectAll = (selected: boolean) => {
    push({
      component: 'divisions',
      action: 'set',
      payload: selected ? divisions.map(d => d.key) : [] 
    });
  };

  return (
    <Paper className={classes.root}>
      <EnhancedTableToolbar numSelected={numSelected} />
      <div className={classes.tableWrapper}>
        <Table className={classes.table} aria-labelledby='tableTitle'>
          <EnhancedTableHead
            numSelected={numSelected}
            order={order}
            orderBy={orderBy}
            onSelectAllClick={selectAll}
            onRequestSort={handleRequestSort}
            rowCount={Object.keys(divisions).length}
          />
          <TableBody>
            {stableSort(Object.values(divisions), getSorting(order, orderBy))
              .map(div => (
                <TableRow
                  hover
                  onClick={select(div.key, selectedDivisions.has(div.key))}
                  role='checkbox'
                  aria-checked={selectedDivisions.has(div.key)}
                  tabIndex={-1}
                  key={div.key}
                  selected={selectedDivisions.has(div.key)}
                >
                  <TableCell padding='checkbox'>
                    <Checkbox checked={selectedDivisions.has(div.key)} />
                  </TableCell>
                  <TableCell component='th' scope='row' padding='none'>
                    {div.name}
                  </TableCell>
                  <TableCell padding='checkbox'>
                    {div.count > 0 ? div.count : '-'}
                  </TableCell>
                  <TableCell padding='checkbox'>
                    {div.amount ? format('$.2s')(div.amount).replace(/G/,'B') : '-'}
                  </TableCell>
                </TableRow>
              ))
            }
          </TableBody>
        </Table>
      </div>
    </Paper>
  );
};

export default EnhancedTable;
