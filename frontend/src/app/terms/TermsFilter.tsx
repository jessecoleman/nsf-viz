import { MouseEvent, ChangeEvent, useEffect, useState } from 'react';
import { Flipper, Flipped } from 'react-flip-toolkit';
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
} from '@mui/icons-material';

import {
  loadRelated,
  loadTermCounts,
  loadTypeahead,
} from 'app/actions';
import { useAppDispatch } from 'app/store';
import { useDebouncedSearch } from 'app/hooks';
import { ArrayParam } from 'app/query';
import TermChip from './TermChip';
import TermsInput from './TermsInput';
import { clearTypeahead } from 'app/dataReducer';
import { useQueryParam } from 'use-query-params';

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

const exitThenFlipThenEnter = ({
  hideEnteringElements,
  animateEnteringElements,
  animateExitingElements,
  animateFlippedElements
}) => {
  hideEnteringElements();
  animateExitingElements()
    .then(animateFlippedElements)
    .then(animateEnteringElements);
};

const TermsFilter = () => {

  const dispatch = useAppDispatch();
  const { input, setInput, results } = useDebouncedSearch(input => (
    dispatch(loadTypeahead(input))
  ), 300);

  const [ terms, setTerms ] = useQueryParam('terms', ArrayParam);
  const selected = terms.find(term => term.match('~'));
  const [ termCounts, setTermCounts ] = useState<number[]>([]);

  useEffect(() => {
    dispatch(loadRelated(terms));
    dispatch(loadTermCounts(terms)).then(({ type, payload }) => {
      if (type.endsWith('fulfilled')) {
        setTermCounts(payload);
      }
    });
  }, [JSON.stringify(terms)]);

  const handleChangeInput = (e: ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleClickChip = (e: MouseEvent, chip: string) => {
    e.preventDefault();
    setTerms(terms.map(term => {
      if (term === chip) return `~${term}~`;
      else return term.replaceAll('~', '');
    }));
  };

  const handleAddChip = (chipString: string) => {
    setInput('');
    const chips = chipString.split(',').filter(c => c.length > 0); 
    if (terms.find(t => chips.includes(t))) {
      return;
    }
    setTerms(terms.concat(chips));
  };

  const handleDeleteChip = (idx: number) => () => {
    const chip = terms[idx];
    if (!chip) {
      return;
    }
    setTerms(terms.filter(t => t !== chip));
  };
  
  const handleClearInput = () => {
    dispatch(clearTypeahead());
  };
 
  const handleClearTerms = () => {
    if (selected) {
      setTerms(terms.map(term => term.replaceAll('~', '')));
    } else {
      setTerms([]);
    }
  };
  
  return (
    <Flipper
      flipKey={terms.length}
      // handleEnterUpdateDelete={exitThenFlipThenEnter}
    >
      <SearchContainer>
        <SearchIcon>
          <Search />
        </SearchIcon>
        <ChipContainer>
          {terms.map((term, idx) => (
            <TermChip
              key={term}
              term={term.replaceAll('~', '')}
              count={termCounts[idx]}
              selected={term === selected}
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
        </ChipContainer>
        <Tooltip title={selected ? 'clear selection' : 'clear all terms'}>
          <IconButton
            color='inherit'
            onClick={handleClearTerms}
          >
            {selected
              ? <HighlightOff />
              : <ClearAll />
            }
          </IconButton>
        </Tooltip>
      </SearchContainer>
    </Flipper>
  );
};

export default TermsFilter;
