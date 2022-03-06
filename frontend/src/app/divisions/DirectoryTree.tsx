import { MouseEvent } from 'react';
import { Flipper } from 'react-flip-toolkit';
import match from 'autosuggest-highlight/match';
import { Box, LinearProgress, SelectChangeEvent, styled } from '@material-ui/core';
import { TreeView } from '@material-ui/lab';

import { SortableKeys } from 'app/sort';
import { useMeasure } from 'app/hooks';
import { Organization, useDivisionsQuery, useSearchQuery } from 'app/query';
import { SortDirection } from '@material-ui/core';
import { colorScales } from 'theme';
import { ChangeEvent, useState } from 'react';
import Highlight from 'app/Highlight';
import DivisionToolbar from './DivisionToolbar';
import { ArrowDropDown, ArrowRight } from '@mui/icons-material';
import DirectoryEntry from './Entry';
import DirectoryTableHead, { CheckboxState } from './DirectoryTableHead';
import { DivisionAggregate } from 'api';
import { useSearch } from 'api';
import { useDirectory } from './useDirectory';

const ScrollableDiv = styled('div')`
  overflow-y: scroll;
  height: 100%;
`;

// const DivisionChip = styled('span')`
//   background-color: lightgrey;
//   text-transform: uppercase;
//   border-radius: 16px;
//   margin-left: 4px;
//   padding: 2px 8px;
// `;

const DirectoryTree = () => {

  const [ widthRef, scrollOffset ] = useMeasure<HTMLDivElement>();
  const [ query, setQuery ] = useSearchQuery();
  const [ divisions, setDivisions ] = useDivisionsQuery();
  const selectedDivisions = new Set(divisions);
  const [ divisionFilter, setDivisionFilter ] = useState<string>('');
  const [ expanded, setExpanded ] = useState<string[]>([]);

  const orderDivisions = (a: DivisionAggregate, b: DivisionAggregate) => (
    (a[query.sort] - b[query.sort]) 
    * (query.direction === 'asc' ? 1 : -1)
  );

  const { data: divisionAggs } = useSearch(query, {
    query: {
      keepPreviousData: true,
      select: ({ data: { divisions }}) => {
        divisions.sort(orderDivisions);
        divisions.forEach(d => d.divisions.sort(orderDivisions));
        return divisions;
      } 
    }
  });
  
  const { divisionMap, divisionTree, isLoading } = useDirectory();

  const handleRequestSort = (sort: SortableKeys) => {
    let direction: SortDirection | undefined;
    if (sort === 'name') {
      direction = query.sort === sort && query.direction === 'asc' ? 'desc' : 'asc';
    } else {
      direction = query.sort === sort && query.direction === 'desc' ? 'asc' : 'desc';
    }
    setQuery({ sort, direction });
  };
  
  const handleCheck = (e: MouseEvent, key: string, checked: CheckboxState) => {
    // don't trigger expand section
    const [ div, div2 ] = key.split('-');
    e.stopPropagation();
    setDivisions(checked === 'checked'
      ? (divisions ?? []).concat([div2])
      : (divisions ?? []).filter(d => d !== div2)
    );
  };

  const handleSelectGroup = (e: MouseEvent, key: string, checked: CheckboxState) => {
    e.stopPropagation();
    const group = [key].concat(divisionTree[key] ?? []);
    setDivisions(checked === 'checked'
      ? [...new Set((divisions ?? []).concat(group))]
      : (divisions ?? []).filter(d => !group.includes(d))
    );
  };
  
  const handleSelectAll = (checked: CheckboxState) => {
    switch (checked) {
      case 'checked':
        setDivisions(Object.keys(divisionMap));
        break;
      case 'indeterminate':
      case 'unchecked':
        setDivisions([]);
        break;
    }
  };
  
  const handleExpandAll = () => {
    const roots = Object.keys(divisionTree).filter(key => divisionAggs?.find(div => div.key === key));
    if (expanded.length < roots.length) {
      setExpanded(roots);
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
    setQuery({ org: e.target.value as Organization });
    setDivisions(undefined);
  };

  const handleFilterDivisions = (e: ChangeEvent<HTMLInputElement>) => {
    setDivisionFilter(e.target.value);
  };
  
  const getDirectoryCheckState = (key: string) => {
    const checked = selectedDivisions.has(key);
    const children = divisionTree[key];
    // TODO
    if (!checked || !children) {
      return 'unchecked';
    } else if (children.every(div => selectedDivisions.has(div))) {
      return 'checked';
    } else {
      return 'indeterminate';
    }
  };
  
  let allChecked: CheckboxState = 'unchecked';
  if (selectedDivisions.size == Object.keys(divisionMap).length) allChecked = 'checked';
  else if (selectedDivisions.size > 0) allChecked = 'indeterminate';
  
  const isFiltered = (key: string) => !divisionFilter || match(divisionMap[key].name, divisionFilter).length > 0;
  const isDirFiltered = (key: string) => (divisionTree[key] ?? []).concat([key]).filter(isFiltered).length > 0;
  const isExpanded = (key: string) => expanded.includes(key);
  const isExpandedOrFiltered = (key: string) => isExpanded(key) || (divisionFilter && isDirFiltered(key));
  
  return (
    <Box
      display='flex'
      flexDirection='column'
      overflow='hidden'
      height='100%'
    >
      <DivisionToolbar
        org={query.org}
        filter={divisionFilter}
        numSelected={selectedDivisions.size}
        onChangeOrg={handleChangeOrg}
        onChangeFilter={handleFilterDivisions}
      />
      <DirectoryTableHead
        scrollOffset={scrollOffset}
        checked={allChecked}
        allExpanded={Object.keys(divisionTree).every(isExpanded)}
        orderBy={query.sort ?? 'name'}
        direction={query.direction}
        onExpandAll={handleExpandAll}
        onSelectAll={handleSelectAll}
        onRequestSort={handleRequestSort}
      />
      <ScrollableDiv>
        <Flipper flipKey={JSON.stringify([divisionFilter, query.terms, query.direction, query.sort])}>
          {!divisionAggs || isLoading 
            ? <LinearProgress />
            : <TreeView
              key={query.org}
              aria-label='directory'
              defaultCollapseIcon={<ArrowDropDown />}
              defaultExpandIcon={<ArrowRight />}
              defaultEndIcon={<div style={{ width: 24 }} />}
              expanded={Object.keys(divisionTree).filter(isExpandedOrFiltered)}
              multiSelect
              // selected={query.divisions}
              onNodeToggle={handleToggle}
            // onNodeSelect={handleSelect}
            >
              {divisionAggs
                .filter(div => (
                  isDirFiltered(div.key)
                  && divisionMap[div.key]
                ))
                .map(div => (
                  <DirectoryEntry
                    key={div.key}
                    nodeId={div.key}
                    desc={divisionMap[div.key].desc}
                    name={<Highlight value={divisionMap[div.key].name} query={divisionFilter} />}
                    count={div.count}
                    amount={div.amount}
                    checked={getDirectoryCheckState(div.key)}
                    onCheck={handleSelectGroup}
                  >
                    {div.divisions
                      ?.filter(div2 => (
                        isFiltered(div2.key) 
                        && divisionMap[div2.key]
                        && div.divisions.length > 1
                      ))
                      ?.map(div2 => (
                        <DirectoryEntry
                          key={div2.key}
                          nodeId={`${div.key}-${div2.key}`}
                          desc={divisionMap[div2.key].desc}
                          name={(
                            div.key !== div2.key 
                              ? <Highlight value={divisionMap[div2.key].name} query={divisionFilter} />
                              : 'Other'
                          )}
                          count={div2.count}
                          amount={div2.amount}
                          checked={selectedDivisions.has(div2.key) ? 'checked' : 'unchecked'}
                          onCheck={handleCheck}
                        />
                      ))
                    }
                    {/*divisionTree[div.key].length > div.divisions.length && (
                      <ListItem sx={{ paddingLeft: 7, borderBottom: '1px solid lightgrey' }}>
                        no hits in {' '}
                        {divisionTree[div.key]
                          .filter(key => !div.divisions.find(d => d.key === key))
                          .map(key => key.toUpperCase())
                          .join(', ')
                          //.map(key => <DivisionChip key={key}>{key}</DivisionChip>)
                        }
                      </ListItem>
                      )*/}
                  </DirectoryEntry>
                ))}
            </TreeView>
          }
        </Flipper>
      </ScrollableDiv>
    </Box>
  );
};

export default DirectoryTree;