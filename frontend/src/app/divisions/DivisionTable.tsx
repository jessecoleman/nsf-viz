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
import { getSortedDivisionAggs, getDivisionOrder, getDivisionsMap } from 'app/selectors';
import{ loadDivisions } from '../actions';
import { useAppDispatch, useAppSelector } from 'app/store';
import { useDebouncedCallback, useMeasure, useNavigate } from 'app/hooks';
import DivisionRow, { Row, NumberColumn, Column } from './DivisionRow';
import { highlightDivision, setDivisionOrder, SortDirection } from 'app/filterReducer';
import { colorScales } from 'theme';

type Columns = {
  Component: typeof Column | typeof NumberColumn,
  id: string,
  numeric: boolean,
  label: string,
};

const columns: Columns[] = [
  { Component: Column, id: 'name', numeric: false, label: 'Name' },
  { Component: NumberColumn, id: 'count', numeric: true, label: 'Gnts' }, 
  { Component: NumberColumn, id: 'amount', numeric: false, label: 'Amt' },
];

type EnhancedTableHeadProps = {
  scrollOffset?: number
  orderBy: string,
  direction: SortDirection,
  numSelected: number,
  rowCount: number,
  onRequestSort: (key: string) => void,
  onSelectAllClick: (checked: boolean) => void,
}

const EnhancedTableHead = (props: EnhancedTableHeadProps) => {

  const {
    scrollOffset,
    orderBy,
    direction,
    numSelected,
    rowCount,
    onRequestSort,
    onSelectAllClick,
  } = props;

  const handleSort = (property: string) => () => {
    onRequestSort(property);
  };

  const allSelected = numSelected === rowCount;

  return (
    <Row checkable nohover scrollOffset={scrollOffset}>
      <Column column='checkbox'>
        <Checkbox
          indeterminate={numSelected > 0 && numSelected < rowCount}
          checked={allSelected}
          onChange={() => onSelectAllClick(!allSelected)}
        />
      </Column>
      {columns.map(c => (
        <c.Component
          column={c.id}
          key={c.id}
          light
        >
          <Tooltip
            title={`sort by ${c.label}`}
            placement='bottom-end'
            enterDelay={300}
          >
            <TableSortLabel
              active={orderBy === c.id}
              direction={direction}
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

const Title = styled('div')`
  flex: '0 0 auto';
`;

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

const Container = styled(Paper)`
  width: 100%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
`;


const TableWrapper = styled('div')`
  overflow-x: hidden;
  overflow-y: auto;
`;

const DivisionTable = () => {

  const dispatch = useAppDispatch();
  const [ widthRef, scrollOffset ] = useMeasure<HTMLDivElement>();
  const [ orderBy, direction ] = useAppSelector(getDivisionOrder);
  const divisions = useAppSelector(getSortedDivisionAggs);
  const divMap = useAppSelector(getDivisionsMap);

  const debouncedHighlight = useDebouncedCallback(key => {
    dispatch(highlightDivision(key));
  }, 150);

  const { query, push } = useNavigate(({ firstLoad }) => {
    if (firstLoad) {
      dispatch(loadDivisions());
    }
  }, '?divisions');

  const selectedDivisions = new Set(query.divisions);

  function handleRequestSort(key: string) {
    const isDesc = orderBy === key && direction === 'desc';
    dispatch(setDivisionOrder([ key, isDesc ? 'asc' : 'desc' ]));
  }

  const handleSelect = (key: string, selected: boolean) => () => {
    push({
      component: 'divisions',
      action: selected ? 'remove' : 'add',
      payload: [key]
    });
  };

  const handleSelectAll = (selected: boolean) => {
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
        scrollOffset={scrollOffset}
        numSelected={selectedDivisions.size}
        orderBy={orderBy}
        direction={direction}
        onSelectAllClick={handleSelectAll}
        onRequestSort={handleRequestSort}
        rowCount={divisions.length}
      />
      <TableWrapper>
        <div ref={widthRef} />
        <FlipMove>
          {divisions.map(div => (
            <DivisionRow
              checkable
              key={div.key}
              dataKey={div.key}
              title={divMap[div.key]}
              onCheck={handleSelect(div.key, selectedDivisions.has(div.key))}
              onMouseOver={debouncedHighlight}
              onMouseOut={debouncedHighlight}
              checked={selectedDivisions.has(div.key)}
              aria-checked={selectedDivisions.has(div.key)}
              cells={['count', 'amount'].map(field => ({
                name: field,
                value: div[field],
                fill: selectedDivisions.has(div.key)
                  ? colorScales[field](div.key)
                  : 'white' 
              }))}
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