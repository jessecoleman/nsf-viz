import { MouseEvent, ChangeEvent } from 'react';

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
  loadRelated,
  loadTermCounts,
  loadTypeahead,
} from 'app/actions';
import { useAppDispatch, useAppSelector } from 'app/store';
import { getSelectedTerms, getTerms } from 'app/selectors';
import { addChips, clearTermSelection, deleteChip, selectTerm, setTerms } from 'app/filterReducer';
import { useDebouncedSearch, useNavigate } from 'app/hooks';
import TermChip from './TermChip';
import TermsInput from './TermsInput';
import { clearTypeahead } from 'app/dataReducer';

const SearchContainer = styled('div')(({ theme }) => `
  min-width: 25em;
  max-height: 12em;
  overflow-y: auto;
  display: flex;
  align-items: center;
  color: ${theme.palette.common.white};
  border-radius: ${theme.shape.borderRadius}px;
  background-color: ${alpha(theme.palette.common.white, 0.15)};
  &:hover {
    background-color: ${alpha(theme.palette.common.white, 0.25)};
  }
  margin-left: 0;
  ${theme.breakpoints.down('sm')} {
    width: 100%;
    max-height: 8em;
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

  const handleChangeInput = (e: ChangeEvent<HTMLInputElement>) => {
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
    dispatch(loadRelated());
  };

  const handleDeleteChip = (idx: number) => () => {
    const chip = terms[idx];
    if (!chip) {
      return;
    }
    push({
      component: 'terms',
      action: 'remove',
      payload: [chip.term],
    });
    dispatch(deleteChip(idx));
    dispatch(loadRelated());
  };
  
  const handleClearInput = () => {
    dispatch(clearTypeahead());
  };
 
  const handleClearTerms = () => {
    if (selected.length > 0) {
      dispatch(clearTermSelection());
    } else {
      push({
        component: 'terms',
        action: 'set',
        payload: [],
      });
      dispatch(setTerms([]));
    }
  };
  
  return (
    <SearchContainer>
      <SearchIcon>
        <Search />
      </SearchIcon>
      <ChipContainer>
        <FlipMove>
          {terms.map((chip, idx) => (
            <TermChip
              key={chip.term}
              term={chip.term}
              count={chip.count}
              selected={selected.includes(chip.term)}
              onClick={handleClickChip}
              onDelete={handleDeleteChip(idx)}
            />
          ))}
          <TermsInput
            value={input}
            onChange={handleChangeInput}
            onAddChip={handleAddChip}
            onDeleteLastChip={handleDeleteChip(terms.length - 1)}
            onClearInput={handleClearInput}
          />
        </FlipMove>
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
