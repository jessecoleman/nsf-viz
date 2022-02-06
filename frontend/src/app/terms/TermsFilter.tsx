import { MouseEvent, ChangeEvent } from 'react';
import { Flipper } from 'react-flip-toolkit';
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

import { useDebouncedSearch } from 'app/hooks';
import { ArrayParam, useQuery } from 'app/query';
import TermChip from './TermChip';
import TermsInput from './TermsInput';
// import { clearTypeahead } from 'app/dataReducer';
import { useQueryParam } from 'use-query-params';
import { useLoadTermCounts } from 'api';

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

  const { input, setInput, results } = useDebouncedSearch(input => (
    console.log(input)
  ), 300);

  const [ terms, setTerms ] = useQueryParam('terms', ArrayParam);
  const [{ org }] = useQuery();
  const selected = terms.find(term => term.match('~'));

  const { data: counts } = useLoadTermCounts({ org, terms }, {
    query: {
      // enabled: terms.length,
      select: ({ data }) => data
    }
  });

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

  const handleDeleteChip = (term: string) => () => {
    setTerms(terms.filter(t => t !== term));
  };
  
  const handleClearInput = () => {
    // dispatch(clearTypeahead());
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
          {terms.map(term => (
            <TermChip
              key={term}
              term={term.replaceAll('~', '')}
              count={counts?.[term]}
              selected={term === selected}
              onClick={handleClickChip}
              onDelete={handleDeleteChip(term)}
            />
          ))}
          <TermsInput
            value={input}
            onChange={handleChangeInput}
            onAddChip={handleAddChip}
            onDeleteLastChip={handleDeleteChip(terms[terms.length - 1])}
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
