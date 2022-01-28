import { MouseEvent, useEffect } from 'react';
import { Flipper, Flipped } from 'react-flip-toolkit';
import match from 'autosuggest-highlight/match';
import { SelectChangeEvent } from '@material-ui/core';
import { TreeView } from '@material-ui/lab';

import { getSortedDivisionAggs, getDivisionsMap, getDirectoryAggs, getDepartmentMap, SortableKeys } from 'app/selectors';
import{ loadDirectory, loadDivisions } from '../actions';
import { useAppDispatch, useAppSelector } from 'app/store';
import { useDebouncedCallback, useMeasure } from 'app/hooks';
import { Organization, useQuery } from 'app/query';
import { highlightDivision, SortDirection } from 'app/filterReducer';
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
  console.log(directory);
  const depMap = useAppSelector(state => getDepartmentMap(state, query));
  const divMap = useAppSelector(state => getDivisionsMap(state, query));
  const allDivisions = directory.flatMap(directory =>
    [directory.abbr].concat((directory.departments ?? []).map(div => div.abbr))
  );

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
    let direction: SortDirection | undefined;
    if (sort === 'name') {
      direction = query.sort === sort && query.direction === 'asc' ? 'desc' : 'asc';
    } else {
      direction = query.sort === sort && query.direction === 'desc' ? 'asc' : 'desc';
    }
    setQuery({ sort, direction });
  }
  
  const handleCheck = (e: MouseEvent, key: string, checked: CheckboxState) => {
    // don't trigger expand section
    e.stopPropagation();
    setQuery({ divisions: checked === 'checked'
      ? query.divisions.concat([key])
      : query.divisions.filter(d => d !== key)
    });
  };

  const handleSelectGroup = (e: MouseEvent, key: string, checked: CheckboxState) => {
    e.stopPropagation();
    const group = [key].concat(depMap[key] ?? []);
    const divisions = checked === 'checked'
      ? [...new Set(query.divisions.concat(group))]
      : query.divisions.filter(d => !group.includes(d));

    setQuery({ divisions });
  };

  const handleSelectAll = (checked: CheckboxState) => {
    switch (checked) {
      case 'checked':
        setQuery({ divisions: allDivisions });
        break;
      case 'indeterminate':
      case 'unchecked':
        setQuery({ divisions: [] });
        break;
    }
  };
  
  const handleExpandAll = () => {
    const directorates = directory.map(dir => dir.abbr);
    if (expanded.length < directorates.length) {
      setExpanded(directorates);
    } else {
      setExpanded([]);
    }
  };
  
  const handleToggle = (e: React.SyntheticEvent, keys: string[]) => {
    // TODO maybe adjust query based on toggle state?
    // let toggled: string;
    // let add: boolean;
    // if (keys.length < expanded.length) {
    //   [ toggled ] = expanded.filter(e => !keys.includes(e));
    //   add = false;
    // } else {
    //   [ toggled ] = keys.filter(e => !expanded.includes(e));
    //   add = true;
    // }
    // only selected nested elements if parent is selected
    // const nested = query.divisions.includes(toggled) ? depMap[toggled] : [];
    // const selected = add
    //   ? query.divisions.concat(nested)
    //   : query.divisions.filter(key => !nested.includes(key));

    // setQuery({ divisions: [...new Set(selected)] });
    setExpanded(keys);
  };

  const handleChangeOrg = (e: SelectChangeEvent<Organization>) => {
    setQuery({
      org: e.target.value as Organization,
      divisions: [],
    });
  };

  const handleFilterDivisions = (e: ChangeEvent<HTMLInputElement>) => {
    setDivisionFilter(e.target.value);
  };
  
  const getDirectoryCheckState = (abbr: string) => {
    const checked = selectedDivisions.has(abbr);
    const children = directory.find(dir => dir.abbr === abbr)?.departments ?? [];
    if (!checked) {
      return 'unchecked';
    } else if (children.every(div => selectedDivisions.has(div.abbr))) {
      return 'checked';
    } else {
      return 'indeterminate';
    }
  };

  const filtered = Object.values(divisions)
    .map(d => divMap[d.key])
    .filter(d => d)
    .filter(d => !divisionFilter || match(d, divisionFilter).length);
    
  let checked: CheckboxState = 'unchecked';
  if (selectedDivisions.size == allDivisions.length) checked = 'checked';
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
        allExpanded={directory.every(dir => expanded.includes(dir.abbr))}
        orderBy={query.sort ?? 'name'}
        direction={query.direction}
        onExpandAll={handleExpandAll}
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
        // onNodeSelect={handleSelect}
      >
        {directory.map(dir => (
          <DirectoryEntry
            key={dir.abbr}
            nodeId={dir.abbr}
            desc={dir.desc}
            name={<Highlight value={dir.name} query={divisionFilter} />}
            count={dir.count ?? 0}
            amount={dir.amount ?? 0}
            checked={getDirectoryCheckState(dir.abbr)}
            onCheck={handleSelectGroup}
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
                  checked={selectedDivisions.has(dep.abbr) ? 'checked' : 'unchecked'}
                  onCheck={handleCheck}
                />
              ))
            }
          </DirectoryEntry>
        ))}
      </TreeView>
    </div>
  );
};

export default Directory;