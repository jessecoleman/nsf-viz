import { MouseEvent, useState, ChangeEvent, useEffect } from 'react';

import FlipMove from 'react-flip-move';
import { styled } from '@material-ui/core/styles';
import { alpha } from '@material-ui/core/styles';

import {
  IconButton,
  Tooltip,
} from '@material-ui/core';

import {
  Search,
  ClearAll,
  HighlightOff,
} from '@material-ui/icons';

import {
  loadData,
  loadRelated,
  loadTermCounts,
  loadTypeahead,
} from 'app/actions';
import { useAppDispatch, useAppSelector } from 'app/store';
import { getSelectedTerms, getTerms } from 'app/selectors';
import { addChips, clearTermSelection, deleteChip, selectTerm, setTerms, Term } from 'app/filterReducer';
import { useDebouncedSearch, useNavigate, useQuery } from 'app/hooks';
import TermChip from './TermChip';
import TermsInput from './TermsInput';

const SearchContainer = styled('div')(({ theme }) => `
  min-width: 25em;
  display: flex;
  align-items: center;
  color: ${theme.palette.common.white};
  border-radius: ${theme.shape.borderRadius}px;
  background-color: ${alpha(theme.palette.common.white, 0.15)};
  &:hover {
    background-color: ${alpha(theme.palette.common.white, 0.25)};
  }
  margin-left: 0;
  ${theme.breakpoints.up('sm')}: {
    width: 100%;
    margin-left: ${theme.spacing(1)};
    width: auto;
  }
`);

const ChipContainer = styled('div')(({ theme }) => `
  flex-grow: 1;
  display: flex;
  flex-wrap: wrap;
  padding-top: ${theme.spacing(1)};
`);

const SearchIcon = styled('div')(({ theme }) => `
  width: ${theme.spacing(8)};
  pointer-events: none;
  display: flex;
  justify-content: center;
`);

const TermsFilter = () => {

  const dispatch = useAppDispatch();
  const query = useQuery();
  const { input, setInput } = useDebouncedSearch((input) => {
    if (input.length) {
      dispatch(loadTypeahead(input));
    }
  }, 300);
  const terms = useAppSelector(getTerms);
  const selected = useAppSelector(getSelectedTerms);

  const { push } = useNavigate(({ query, firstLoad }) => {
    // only run on first load
    if (query.terms && firstLoad) {
      dispatch(setTerms(query.terms.map(t => ({ term: t, count: 0 }))));
      dispatch(loadTermCounts(query.terms.join(',')));
      dispatch(loadRelated());
    }
  }, '?terms');

  useEffect(() => {
    if (selected.length > 0) {
      dispatch(loadData({ ...query, terms: selected }));
    } else {
      dispatch(loadData(query));
    }
  }, [selected]);

  const handleChangeInput = (e: ChangeEvent<HTMLInputElement>) => {
    console.log(e.target.value);
    setInput(e.target.value);
  };

  const handleClickChip = (e: MouseEvent, key: string) => {
    e.preventDefault();
    dispatch(selectTerm(key));
  };

  const handleAddChip = (chipString: string) => {
    setInput('');
    const chips = chipString.split(',').filter(c => c.length > 0); 
    if (terms.find(t => chips.includes(t.term))) {
      return;
    }
    push({
      component: 'terms',
      action: 'add',
      payload: chips,
    });
    dispatch(addChips(chips));
    dispatch(loadTermCounts(chipString));
    dispatch(loadData(query));
    dispatch(loadRelated());
  };

  const handleDeleteChip = (idx: number) => () => {
    const chip = terms[idx];
    push({
      component: 'terms',
      action: 'remove',
      payload: [chip.term],
    });
    dispatch(deleteChip(idx));
    dispatch(loadData(query));
    dispatch(loadRelated());
  };
 
  const handleClearTerms = () => {
    if (selected.length > 0) {
      dispatch(clearTermSelection());
      dispatch(loadData(query));
    } else {
      push({
        component: 'terms',
        action: 'set',
        payload: [],
      });
      dispatch(setTerms([]));
      dispatch(loadData({ ...query, terms: [] }));
    }
  };
  
  return (
    <SearchContainer>
      <SearchIcon>
        <Search />
      </SearchIcon>
      <ChipContainer>
        <FlipMove typeName={null}>
          {terms.map((chip, idx) => (
            <TermChip
              key={chip.term}
              chip={chip}
              selected={selected.includes(chip.term)}
              onClick={handleClickChip}
              onDelete={handleDeleteChip(idx)}
            />
          ))}
        </FlipMove>
        <TermsInput 
          value={input}
          onChange={handleChangeInput}
          onAddChip={handleAddChip}
          onDeleteLastChip={handleDeleteChip(terms.length - 1)}
        />
      </ChipContainer>
      <Tooltip title={selected.length === 0 ? 'clear all terms' : 'clear selection'}>
        <IconButton
          color='inherit'
          onClick={handleClearTerms}
        >
          {selected.length === 0
            ? <ClearAll />
            : <HighlightOff />
          }
        </IconButton>
      </Tooltip>
    </SearchContainer>
  );
};

export default TermsFilter;
