import React, { 
  useState, 
  useEffect, 
} from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Theme, makeStyles } from '@material-ui/core/styles';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
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

import { 
  Division,
  SortDirection,
  CheckboxCallback,
} from '../types';
import { 
  selectDivision, 
  selectAllDivisions,
} from '../filterReducer';
import {
  getTotal,
  getDivisions, 
} from 'app/selectors';
import{ loadDivisions } from '../actions';
import { useAppDispatch, useAppSelector } from 'app/store';

const desc = (a, b, orderBy) => {
  if (b[orderBy] < a[orderBy]) {
    return -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return 1;
  }
  return 0;
}

const stableSort = (array, cmp) => {
  const stabilizedThis = array.map((el, index) => [el, index]);
  stabilizedThis.sort((a, b) => {
    const order = cmp(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });
  return stabilizedThis.map(el => el[0]);
}

const getSorting = (order, orderBy) => {
  return order === 'desc' ? (a, b) => desc(a, b, orderBy) : (a, b) => -desc(a, b, orderBy);
}

const rows = [
  { id: 'title', numeric: false, disablePadding: true, label: 'Name' },
  { id: 'count', numeric: true, disablePadding: true, label: 'Grants' },
  { id: 'amount', numeric: false, disablePadding: true, label: 'Amount' },
];

const EnhancedTableHead: React.FC<{
  onSelectAllClick: CheckboxCallback,
  order: SortDirection,
  orderBy: string,
  numSelected: number,
  rowCount: number,
  onRequestSort: Function,
}> = (props) => {

  const {
    onSelectAllClick,
    order,
    orderBy,
    numSelected,
    rowCount,
    onRequestSort 
  } = props;

  const handleSort = property => e => {
    onRequestSort(e, property);
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
}

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

const EnhancedTableToolbar: React.FC<{
  numSelected: number
}> = (props) => {
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


const EnhancedTable : React.FC<{}> = (props) => {

  const classes = useStyles();
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(loadDivisions());
  }, []);

  const [ order, setOrder ] = useState<SortDirection>('desc');
  const [ orderBy, setOrderBy ] = useState<string>('doc_count');
  const divisions = useSelector(getDivisions);
  console.log(divisions);
  const selectedDivisions: number = Object.values(divisions).filter(d => d.selected).length;

  function handleRequestSort(event, property) {
    const isDesc = orderBy === property && order === 'desc';
    setOrder(isDesc ? 'asc' : 'desc');
    setOrderBy(property);
  }

  const select = key => () => dispatch(selectDivision(key));
  const selectAll = (selected) => dispatch(selectAllDivisions(selected));

  const total = useAppSelector(getTotal);
  //if (!total) return null;
  //const divisions = total.divisions.buckets;

  return (
    <Paper className={classes.root}>
      <EnhancedTableToolbar numSelected={selectedDivisions} />
      <div className={classes.tableWrapper}>
        <Table className={classes.table} aria-labelledby='tableTitle'>
          <EnhancedTableHead
            numSelected={selectedDivisions}
            order={order}
            orderBy={orderBy}
            onSelectAllClick={selectAll}
            onRequestSort={handleRequestSort}
            rowCount={Object.keys(divisions).length}
          />
          <TableBody>
            {stableSort(Object.values(divisions), getSorting(order, orderBy))
              .map((div: Division, idx: number) => (
                <TableRow
                  hover
                  onClick={select(idx)}
                  role='checkbox'
                  aria-checked={div.selected}
                  tabIndex={-1}
                  key={div.title}
                  selected={div.selected}
                >
                  <TableCell padding='checkbox'>
                    <Checkbox checked={div.selected} />
                  </TableCell>
                  <TableCell component='th' scope='row' padding='none'>
                    {div.title}
                  </TableCell>
                  <TableCell padding='checkbox'>
                    {div.count > 0 ? div.count : '-'}
                  </TableCell>
                  <TableCell padding='checkbox'>
                    {div.amount ? format('$.2s')(div.amount) : '-'}
                  </TableCell>
                </TableRow>
              ))
            }
          </TableBody>
        </Table>
      </div>
    </Paper>
  );
}

export default EnhancedTable;
