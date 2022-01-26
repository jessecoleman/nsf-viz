import { MouseEvent, SyntheticEvent, useEffect } from 'react';
import { Flipper, Flipped } from 'react-flip-toolkit';
import match from 'autosuggest-highlight/match';
import { SelectChangeEvent } from '@material-ui/core';
import { TreeView } from '@material-ui/lab';

import { getSortedDivisionAggs, getDivisionsMap, getDirectoryAggs, getDepartmentMap, SortableKeys } from 'app/selectors';
import{ loadDirectory, loadDivisions } from '../actions';
import { useAppDispatch, useAppSelector } from 'app/store';
import { useDebouncedCallback, useMeasure } from 'app/hooks';
import { Organization, useQuery } from 'app/query';
import { highlightDivision } from 'app/filterReducer';
import { colorScales } from 'theme';
import { ChangeEvent, useState } from 'react';
import Highlight from 'app/Highlight';
import DivisionToolbar from './DivisionToolbar';
import { ArrowDropDown, ArrowRight } from '@mui/icons-material';
import DirectoryEntry from './Entry';
import DirectoryTableHead, { CheckboxState } from './DirectoryTableHead';

const Directory = () => {

  const dispatch = useAppDispatch();
  const [ widthRef, scrollOffset ] = useMeasure<HTMLDivElement>();
  const [ divisionFilter, setDivisionFilter ] = useState<string>('');
  const [ query, setQuery ] = useQuery();
  const divisions = useAppSelector(state => getSortedDivisionAggs(state, query));
  const directory = useAppSelector(state => getDirectoryAggs(state, query));
  const depMap = useAppSelector(state => getDepartmentMap(state, query));
  const divMap = useAppSelector(state => getDivisionsMap(state, query));

  const debouncedHighlight = useDebouncedCallback(key => {
    dispatch(highlightDivision(key));
  }, 150);

  useEffect(() => {
    dispatch(loadDivisions());
    dispatch(loadDirectory());
  }, []);
 
  const selectedDivisions = new Set(query.divisions);
  const [ expanded, setExpanded ] = useState<string[]>([]);

  if (query.divisions === undefined) return null;
  
  function handleRequestSort(sort: SortableKeys) {
    const desc = query.sort === sort && query.direction === 'asc';
    setQuery({ sort, direction: desc ? 'desc' : 'asc' });
  }
  
  const handleSelect = (e: SyntheticEvent, nodeIds: string[]) => {
    e.stopPropagation();
  };

  const handleCheck = (e: MouseEvent, key: string, checked: boolean) => {
    // don't trigger expand section
    e.stopPropagation();
    // setSelected(nodeIds);
    let keys = [key];
    if (expanded.includes(key)) {
      keys = keys.concat(depMap[key]);
    }
    setQuery({ divisions: query.divisions.includes(key)
      ? query.divisions.filter(d => d !== key)
      : query.divisions.concat(key)
    });
  };

  const handleSelectGroup = (key: string) => () => {
    const group = [key].concat(depMap[key] ?? []);
    setQuery({ divisions: query.divisions.includes(key)
      ? query.divisions.filter(d => !group.includes(d))
      : query.divisions.concat(group)
    });
  };

  const handleSelectAll = (e: ChangeEvent, checked: boolean) => {
    if (checked) {
      setQuery({ divisions: directory.flatMap(d => 
        [d.abbr].concat(expanded.includes(d.abbr)
          ? depMap[d.abbr]
          : []
        )
      )
      });
    } else {
      setQuery({ divisions: [] });
    }
  };
  
  const handleToggle = (e: React.SyntheticEvent, keys: string[]) => {
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
    const selected = add
      ? query.divisions.concat(nested)
      : query.divisions.filter(key => !nested.includes(key));

    setQuery({ divisions: [...new Set(selected)] });
    setExpanded(keys);
  };

  // const handleExpandClick = () => {
  //   setExpanded((oldExpanded) =>
  //     oldExpanded.length === 0 ? ['1', '5', '6', '7'] : [],
  //   );
  // };

  const handleChangeOrg = (e: SelectChangeEvent<Organization>) => {
    setQuery({
      org: e.target.value as Organization,
      divisions: [],
    });
  };

  const handleFilterDivisions = (e: ChangeEvent<HTMLInputElement>) => {
    setDivisionFilter(e.target.value);
  };

  const filtered = Object.values(divisions)
    .map(d => divMap[d.key])
    .filter(d => d)
    .filter(d => !divisionFilter || match(d, divisionFilter).length);
    
  let checked: CheckboxState = 'unchecked';
  if (selectedDivisions.size === filtered.length) checked = 'checked';
  else if (selectedDivisions.size > 0) checked = 'indeterminate';

  return (
    <div>
      <DivisionToolbar
        org={query.org}
        filter={divisionFilter}
        numSelected={selectedDivisions.size}
        onChangeOrg={handleChangeOrg}
        onChangeFilter={handleFilterDivisions}
      />
      <DirectoryTableHead
        scrollOffset={scrollOffset}
        checked={checked}
        orderBy={query.sort ?? 'name'}
        direction={query.direction}
        onSelectAllClick={handleSelectAll}
        onRequestSort={handleRequestSort}
      />
      <TreeView
        key={query.org}
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
            {dir.departments
              ?.filter(d => filtered.includes(d.name))
              .map(dep => (
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
              ))
            }
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