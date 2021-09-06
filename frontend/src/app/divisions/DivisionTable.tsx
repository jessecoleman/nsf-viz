import { useState } from 'react';
import FlipMove from 'react-flip-move';
import { styled } from '@material-ui/core/styles';
import { 
  TableSortLabel,
  Toolbar,
  Typography,
  Paper,
  Checkbox,
  IconButton,
  Tooltip,
  Box
} from '@material-ui/core';
import { FilterList } from '@material-ui/icons';

import GrantsDialog from 'app/grants/GrantsDialog';

import { getDivisionAggs, getDivisionsMap } from 'app/selectors';
import{ loadDivisions } from '../actions';
import { useAppDispatch, useAppSelector } from 'app/store';
import { useNavigate } from 'app/hooks';
import DivisionRow, { CheckBoxBox, NumberBox, Row, StyledBox } from './DivisionRow';
import { deepPurpleScale, greenScale } from 'app/chart/Chart';
import { SortDirection } from 'app/filterReducer';


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
  Component: any
  id: string,
  numeric: boolean,
  label: string,
};

const columns: Columns[] = [
  { Component: StyledBox, id: 'title', numeric: false, label: 'Name' },
  { Component: NumberBox, id: 'count', numeric: true, label: 'Grants' }, 
  { Component: NumberBox, id: 'amount', numeric: false, label: 'Amount' },
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
    <Row>
      <CheckBoxBox>
        <Checkbox
          indeterminate={numSelected > 0 && numSelected < rowCount}
          checked={allSelected}
          onChange={() => onSelectAllClick(!allSelected)}
        />
      </CheckBoxBox>
      {columns.map((c, idx) => (
        <c.Component
          key={c.id}
          style={{
            color: 'black',
            marginLeft: idx === 1 ? 'auto' : 'initial',
            marginRight: idx === 2 ? '16px' : 'initial'
          }}>
          <Tooltip
            title={`sort by ${c.label}`}
            placement='bottom-end'
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
        </c.Component>
      ))}
    </Row>
  );
};

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

const DivisionTable = () => {

  const dispatch = useAppDispatch();
  const [ order, setOrder ] = useState<SortDirection>('desc');
  const [ orderBy, setOrderBy ] = useState<string>('doc_count');
  const divisions = useAppSelector(getDivisionAggs);
  const divMap = useAppSelector(getDivisionsMap);

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
                key={div.key}
                dataKey={div.key}
                title={divMap[div.key]}
                onCheck={select(div.key, selectedDivisions.has(div.key))}
                checked={selectedDivisions.has(div.key)}
                aria-checked={selectedDivisions.has(div.key)}
                cells={[
                  { name: 'count', value: div.count, fill: selectedDivisions.has(div.key) ? deepPurpleScale(div.key) : undefined },
                  { name: 'amount', value: div.amount, fill: selectedDivisions.has(div.key) ? greenScale(div.key) : undefined },
                ]}
                // tabIndex={-1}
              />
            ))
          }
        </FlipMove>
      </TableWrapper>
    </Container>
  );
};

export default DivisionTable;