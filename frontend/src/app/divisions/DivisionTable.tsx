import { Flipper, Flipped } from 'react-flip-toolkit';
import match from 'autosuggest-highlight/match';
import { styled } from '@material-ui/core/styles';
import { 
  TableSortLabel,
  Checkbox,
  Tooltip,
  SelectChangeEvent,
} from '@material-ui/core';

import { getSortedDivisionAggs, getDivisionOrder, getDivisionsMap, getOrganization, getDirectory } from 'app/selectors';
import{ loadDivisions } from '../actions';
import { useAppDispatch, useAppSelector } from 'app/store';
import { useDebouncedCallback, useMeasure, useNavigate } from 'app/hooks';
import DivisionRow, { Row, NumberColumn, Column } from './DivisionRow';
import { highlightDivision, setDivisionOrder, setOrganization, SortDirection } from 'app/filterReducer';
import { colorScales } from 'theme';
import { ChangeEvent, useState } from 'react';
import Highlight from 'app/Highlight';
import DivisionToolbar from './DivisionToolbar';

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

const TableWrapper = styled('div')`
  overflow-x: hidden;
  overflow-y: auto;
`;

const DivisionTable = () => {

  const dispatch = useAppDispatch();
  const [ widthRef, scrollOffset ] = useMeasure<HTMLDivElement>();
  const [ divisionFilter, setDivisionFilter ] = useState<string>('');
  const org = useAppSelector(getOrganization);
  const [ orderBy, direction ] = useAppSelector(getDivisionOrder);
  const divisions = Object.values(useAppSelector(getSortedDivisionAggs));
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
  
  const handleChangeOrg = (e: SelectChangeEvent<string>) => {
    push({
      component: 'divisions',
      action: 'set',
      payload: []
    });
    dispatch(setOrganization(e.target.value));
  };
  
  const handleFilterDivisions = (e: ChangeEvent<HTMLInputElement>) => {
    setDivisionFilter(e.target.value);
  };

  const filtered = divisions.filter(d => !divisionFilter || match(divMap[d.key], divisionFilter).length);
  
  return (
    <div>
      <DivisionToolbar
        org={org}
        filter={divisionFilter}
        numSelected={selectedDivisions.size}
        onChangeOrg={handleChangeOrg}
        onChangeFilter={handleFilterDivisions}
      />
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
        <Flipper flipKey={`${filtered.length}-${orderBy}`}>
          {filtered.map(div => (
            <Flipped key={div.key} flipId={div.key}>
              <div>
                <DivisionRow
                  checkable
                  key={div.key}
                  dataKey={div.key}
                  name={<Highlight value={divMap[div.key]} query={divisionFilter} />}
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
              </div>
            </Flipped>
          ))
          }
        </Flipper>
      </TableWrapper>
    </div>
  );
};

export default DivisionTable;