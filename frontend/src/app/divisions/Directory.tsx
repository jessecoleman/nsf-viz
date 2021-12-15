import { MouseEvent, SyntheticEvent } from 'react';
import { Flipper, Flipped } from 'react-flip-toolkit';
import match from 'autosuggest-highlight/match';
import { styled } from '@material-ui/core/styles';
import { 
  TableSortLabel,
  Checkbox,
  Tooltip,
  SelectChangeEvent,
} from '@material-ui/core';
import { TreeView } from '@material-ui/lab';

import { getSortedDivisionAggs, getDivisionOrder, getDivisionsMap, getOrganization, getDirectoryAggs, getDepartmentMap } from 'app/selectors';
import{ loadDirectory, loadDivisions } from '../actions';
import { useAppDispatch, useAppSelector } from 'app/store';
import { useDebouncedCallback, useMeasure, useNavigate } from 'app/hooks';
import { Row, NumberColumn, Column } from './DivisionRow';
import { highlightDivision, setDivisionOrder, setOrganization, SortDirection } from 'app/filterReducer';
import { colorScales } from 'theme';
import { ChangeEvent, useState } from 'react';
import Highlight from 'app/Highlight';
import DivisionToolbar from './DivisionToolbar';
import { ArrowDropDown, ArrowRight } from '@mui/icons-material';
import DirectoryEntry from './Entry';

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

const Directory = () => {

  const dispatch = useAppDispatch();
  const [ widthRef, scrollOffset ] = useMeasure<HTMLDivElement>();
  const [ divisionFilter, setDivisionFilter ] = useState<string>('');
  const org = useAppSelector(getOrganization);
  const [ orderBy, direction ] = useAppSelector(getDivisionOrder);
  const divisions = useAppSelector(getSortedDivisionAggs);
  const directory = useAppSelector(state => getDirectoryAggs(state, org));
  const depMap = useAppSelector(state => getDepartmentMap(state, org));
  console.log(directory);
  const divMap = useAppSelector(getDivisionsMap);

  const debouncedHighlight = useDebouncedCallback(key => {
    dispatch(highlightDivision(key));
  }, 150);

  const { query, push } = useNavigate(({ firstLoad }) => {
    if (firstLoad) {
      dispatch(loadDivisions());
      dispatch(loadDirectory());
    }
  }, '?divisions');

  const selectedDivisions = new Set(query.divisions);
  const [ expanded, setExpanded ] = useState<string[]>([]);
  
  function handleRequestSort(key: string) {
    const isDesc = orderBy === key && direction === 'desc';
    dispatch(setDivisionOrder([ key, isDesc ? 'asc' : 'desc' ]));
  }
  
  const handleSelect = (e: SyntheticEvent, nodeIds: string[]) => {
    e.stopPropagation();
    console.log('selected', nodeIds);
  };

  const handleCheck = (e: MouseEvent, key: string, checked: boolean) => {
    // don't trigger expand section
    e.stopPropagation();
    console.log('checked', key);
    // setSelected(nodeIds);
    let keys = [key];
    if (expanded.includes(key)) {
      keys = keys.concat(depMap[key]);
    }
    push({
      component: 'divisions',
      action: selectedDivisions.has(key) ? 'remove' : 'add',
      payload: keys
    });
  };

  const handleSelectGroup = (key: string) => () => {
    push({
      component: 'divisions',
      action: selectedDivisions.has(key) ? 'remove' : 'add',
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      payload: [key].concat(depMap[key] ?? [])
    });
  };

  const handleSelectAll = (selected: boolean) => {
    push({
      component: 'divisions',
      action: 'set',
      payload: selected ? directory.flatMap(d => 
        [d.abbr].concat(expanded.includes(d.abbr) ? depMap[d.abbr] : [])
      ) : [] 
    });
  };
  
  const handleToggle = (e: React.SyntheticEvent, keys: string[]) => {
    console.log(e);
    console.log(keys.length, expanded.length);
    let toggled: string;
    let add: boolean;
    if (keys.length < expanded.length) {
      [ toggled ] = expanded.filter(e => !keys.includes(e));
      add = false;
    } else {
      [ toggled ] = keys.filter(e => !expanded.includes(e));
      add = true;
    }
    // only selected nested elements if parent is selected
    const nested = query.divisions.includes(toggled) ? depMap[toggled] : [];
    console.log('nested', nested);
    const selected = add
      ? query.divisions.concat(nested)
      : query.divisions.filter(key => !nested.includes(key));

    console.log(new Set(selected));

    push({
      component: 'divisions',
      action: 'set',
      payload: [...new Set(selected)]
    });
    setExpanded(keys);
  };

  // const handleExpandClick = () => {
  //   setExpanded((oldExpanded) =>
  //     oldExpanded.length === 0 ? ['1', '5', '6', '7'] : [],
  //   );
  // };

  const handleChangeOrg = (e: SelectChangeEvent<string>) => {
    dispatch(setOrganization(e.target.value));
  };
  
  const handleFilterDivisions = (e: ChangeEvent<HTMLInputElement>) => {
    setDivisionFilter(e.target.value);
  };

  const filtered = Object.values(divisions)
    .filter(d => !divisionFilter || match(divMap[d.key], divisionFilter).length);
  
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
        rowCount={filtered.length}
      />
      <TreeView
        key={org}
        aria-label='directory'
        defaultCollapseIcon={<ArrowDropDown />}
        defaultExpandIcon={<ArrowRight />}
        defaultEndIcon={<div style={{ width: 24 }} />}
        expanded={expanded}
        multiSelect
        selected={query.divisions}
        onNodeToggle={handleToggle}
        onNodeSelect={handleSelect}
      >
        {directory.map(dir => (
          <DirectoryEntry
            key={dir.abbr}
            nodeId={dir.abbr}
            desc={dir.desc}
            name={<Highlight value={dir.name} query={divisionFilter} />}
            count={divisions[dir.abbr]?.count ?? 0}
            amount={divisions[dir.abbr]?.amount ?? 0}
            checked={selectedDivisions.has(dir.abbr)}
            onCheck={handleCheck}
          >
            {dir.departments?.map(dep => (
              <DirectoryEntry
                key={dep.abbr}
                nodeId={dep.abbr}
                desc={dep.desc}
                name={<Highlight value={dep.name} query={divisionFilter} />}
                count={divisions[dep.abbr]?.count ?? 0}
                amount={divisions[dep.abbr]?.amount ?? 0}
                checked={selectedDivisions.has(dep.abbr)}
                onCheck={handleCheck}
              />
            ))}
          </DirectoryEntry>
        ))}
      </TreeView>
      {/*<TableWrapper>
        <div ref={widthRef} />
        <Flipper flipKey={`${filtered.length}-${orderBy}`}>
          {filtered.map(div => (
            <Flipped key={div.key} flipId={div.key}>
              <div>
                <DivisionRow
                  checkable
                  key={div.key}
                  dataKey={div.key}
                  title={<Highlight value={divMap[div.key]} query={divisionFilter} />}
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
      */ }
    </div>
  );
};

export default Directory;