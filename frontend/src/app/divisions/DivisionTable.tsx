import { forwardRef, useState } from 'react';
import clsx from 'clsx';
import FlipMove from 'react-flip-move';
import { Theme, makeStyles, alpha, styled } from '@material-ui/core/styles';
import { 
  TableSortLabel,
  Toolbar,
  Typography,
  Paper,
  Checkbox,
  IconButton,
  Tooltip,
  Grid,
  GridSize,
  Box
} from '@material-ui/core';
import { FilterList } from '@material-ui/icons';

import GrantsDialog from 'app/grants/GrantsDialog';

import { format } from 'd3';

import { SortDirection } from '../types';
import { getDivisionAggs } from 'app/selectors';
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

type Columns = {
  id: string,
  numeric: boolean,
  label: string,
  gridSize: GridSize,
};

const columns: Columns[] = [
  { id: 'title', numeric: false, label: 'Name', gridSize: 9 },
  { id: 'count', numeric: true, label: 'Grants', gridSize: 1 },
  { id: 'amount', numeric: false, label: 'Amount', gridSize: 1 },
];

type EnhancedTableHeadProps = {
  onSelectAllClick: (checked: boolean) => void,
  order: SortDirection,
  orderBy: string,
  numSelected: number,
  rowCount: number,
  onRequestSort: (key: string) => void,
}

const EnhancedTableHead = forwardRef((props: EnhancedTableHeadProps, ref: any) => {

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
    <Grid
      container
      ref={ref}
      direction='row'
      alignItems='center'
      style={{ paddingRight: 16 }}
    >
      <Grid item xs={1}>
        <Checkbox
          indeterminate={numSelected > 0 && numSelected < rowCount}
          checked={allSelected}
          onChange={() => onSelectAllClick(!allSelected)}
        />
      </Grid>
      {columns.map(c => (
        <Grid
          item
          key={c.id}
          xs={c.gridSize}
          // sortDirection={orderBy === row.id ? order : false}
        >
          <Tooltip
            title='Sort'
            placement={c.numeric ? 'bottom-end' : 'bottom-start'}
            enterDelay={300}
          >
            <TableSortLabel
              active={orderBy === c.id}
              direction={order}
              onClick={handleSort(c.id)}
            >
              {c.label}
            </TableSortLabel>
          </Tooltip>
        </Grid>
      ))}
    </Grid>
  );
});

const StyledToolbar = styled(Toolbar)(({ theme }) => `
  padding-right: ${theme.spacing(1)};
`);


const Actions = styled('div')(({ theme }) => `
  color: ${theme.palette.text.secondary};
`);

const Title = styled('div')(({ theme }) => `
  flex: '0 0 auto';
`);

type EnhancedTableToolbarProps = {
  numSelected: number
}

const EnhancedTableToolbar = (props: EnhancedTableToolbarProps) => {
  const { numSelected } = props;

  return (
    <StyledToolbar>
      <Title>
        {numSelected > 0 ? (
          <Typography color='inherit' variant='subtitle1'>
            {`${numSelected} division${numSelected === 1 ? '': 's'} selected`}
          </Typography>
        ) : (
          <Typography variant='h6' id='tableTitle'>
            Divisions
          </Typography>
        )}
      </Title>
      <Box flexGrow={1} />
      <Actions>
        {numSelected > 0 ? (
          <GrantsDialog />
        ) : (
          <Tooltip title='Filter list'>
            <IconButton aria-label='Filter list'>
              <FilterList />
            </IconButton>
          </Tooltip>
        )}
      </Actions>
    </StyledToolbar>
  );
};

const Container = styled(Paper)(({ theme }) => `
  width: 100%;
  max-height: 80vh;
  margin-top: ${theme.spacing(2)};
  display: flex;
  flex-direction: column;
`);


const TableWrapper = styled('div')(({ theme }) => `
  flex: 1,
  overflow-x: hidden;
  overflow-y: auto;
`);

const DivisionRow = styled(Grid)(({ theme }) => `
  cursor: pointer;
  borderBottom: 1px solid ${theme.palette.grey[300]};
  &:hover: {
    backgroundColor: ${theme.palette.grey[100]};
  }
`);


//  selected: {
//    backgroundColor: alpha(theme.palette.secondary.light, 0.7),
//    ['&:hover']: {
//      backgroundColor: alpha(theme.palette.secondary.light, 0.6),
//    },
//  }


const DivisionTable = () => {

  const dispatch = useAppDispatch();
  const [ order, setOrder ] = useState<SortDirection>('desc');
  const [ orderBy, setOrderBy ] = useState<string>('doc_count');
  const divisions = useAppSelector(getDivisionAggs);

  const { query, push } = useNavigate(({ firstLoad }) => {
    if (firstLoad) {
      dispatch(loadDivisions());
    }
  }, '?divisions');

  const selectedDivisions = new Set(query.divisions);

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
    <Container>
      <EnhancedTableToolbar numSelected={selectedDivisions.size} />
      <EnhancedTableHead
        numSelected={selectedDivisions.size}
        order={order}
        orderBy={orderBy}
        onSelectAllClick={selectAll}
        onRequestSort={handleRequestSort}
        rowCount={Object.keys(divisions).length}
      />
      <TableWrapper>
        <FlipMove>
          {stableSort(Object.values(divisions), getSorting(order, orderBy))
            .map(div => (
              <DivisionRow
                container
                alignItems='center'
                // hover
                onClick={select(div.key, selectedDivisions.has(div.key))}
                // role='checkbox'
                aria-checked={selectedDivisions.has(div.key)}
                tabIndex={-1}
                key={div.key}
              >
                <Grid item xs={1}>
                  <Checkbox checked={selectedDivisions.has(div.key)} />
                </Grid>
                <Grid item xs={9}>
                  {div.name}
                </Grid>
                <Grid item xs={1}>
                  {div.count > 0 ? format('.2s')(div.count as number) : '-'}
                </Grid>
                <Grid item xs={1}>
                  {div.amount ? format('$.2s')(div.amount).replace(/G/,'B') : '-'}
                </Grid>
              </DivisionRow>
            ))
          }
        </FlipMove>
      </TableWrapper>
    </Container>
  );
};

export default DivisionTable;