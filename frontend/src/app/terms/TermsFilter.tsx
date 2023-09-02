import { MouseEvent, ChangeEvent, useState } from 'react';
import { Flipper, Flipped } from 'react-flip-toolkit';
import { alpha, styled } from '@material-ui/core/styles';

import {
  Box,
  IconButton,
  Tooltip,
} from '@material-ui/core';

import {
  Search,
  ClearAll,
  HighlightOff,
  Sort,
  SortByAlpha,
} from '@mui/icons-material';

import { useDebounce } from 'app/hooks';
import { ArrayParam, useBeta, useQuery } from 'app/query';
import TermChip from './TermChip';
import TermsInput from './TermsInput';
import TermsPreset from './TermsPreset';
// import { clearTypeahead } from 'app/dataReducer';
import { useQueryParam } from 'use-query-params';
import { useLoadTermCounts, useLoadRelated, useLoadTypeahead } from 'api';
import TermsList from './TermsList';
import { queryClient } from 'app/queryClient';
import { useWizardRef } from 'app/wizard/wizard';

const SearchContainer = styled('div')(({ theme }) => `
  min-width: 25em;
  flex-shrink: 1;
  // width: 100%;
  // max-height: 12em;
  overflow: hidden;
  display: flex;
  align-items: start;
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
  & .MuiIconButton-root {
    justify-self: end;
    padding: ${theme.spacing(1.5)};
  }
  // targets Flipper container
  & > div:nth-child(1) {
    flex-grow: 1;
    display: flex;
  }
  ${theme.breakpoints.down('sm')} {
    border-radius: 0;
    width: 100%;
  }
`);

const ChipContainer = styled('div')(({ theme }) => `
  flex-grow: 1;
  display: flex;
  flex-wrap: wrap;
  padding-top: ${theme.spacing(1)};
  padding-left: ${theme.spacing(1)};
  & .MuiIconButton-root {
    margin-top: -8px;
    margin-left: -8px;
  }
`);

const SearchIcon = styled('div')(({ theme }) => `
  padding: ${theme.spacing(0.5, 1)};
  pointer-events: none;
`);

const exitThenFlipAndEnter = ({
  hideEnteringElements,
  animateEnteringElements,
  animateExitingElements,
  animateFlippedElements
}) => {
  hideEnteringElements();
  animateExitingElements()
    .then(() => {
      animateFlippedElements();
      animateEnteringElements();
    });
};

const TermsFilter = () => {

  const [ input, setInput ] = useState('');
  const [ beta ] = useBeta();
  const debouncedInput = useDebounce(input, 300);
  const { ref: filterTermsRef } = useWizardRef<HTMLDivElement>('filterTerms');
  const { ref: clearTermsRef } = useWizardRef<HTMLButtonElement>('clearTerms');

  const [ terms, setTerms ] = useQueryParam('terms', ArrayParam);
  const [ sort, setSort ] = useState<'alpha' | 'count' | undefined>();
  const [{ org }] = useQuery();
  const selected = terms.find(term => term.match('~'));

  const { data: counts } = useLoadTermCounts({ org, terms }, {
    query: {
      keepPreviousData: true,
      enabled: terms.length > 0,
      select: ({ data }) => data
    }
  });

  const { data: typeahead, queryKey: typeaheadKey } = useLoadTypeahead(debouncedInput, { selected_terms: terms }, {
    query: {
      keepPreviousData: true,
      enabled: input.length > 0,
      select: ({ data = [] }) => data.filter(d => !terms.includes(d.term))
    }
  });

  const { data: related, queryKey: relatedKey } = useLoadRelated({ terms }, {
    query: {
      keepPreviousData: true,
      enabled: terms.length > 0,
      select: ({ data = [] }) => data.filter(d => !terms.includes(d.term))
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
    queryClient.removeQueries(typeaheadKey);
  };
 
  const handleClearTerms = () => {
    queryClient.removeQueries(relatedKey);
    if (selected) {
      setTerms(terms.map(term => term.replaceAll('~', '')));
    } else {
      setTerms([]);
    }
  };
  
  const handleSortTerms = () => {
    setSort(sort => sort === 'alpha' ? 'count' : 'alpha');
    const compareAlpha = (t1: string, t2: string) => t1.localeCompare(t2);
    const compareCount = (t1: string, t2: string) => (counts?.[t2] ?? 0) - (counts?.[t1] ?? 0);
    setTerms(terms.sort(sort === 'alpha' ? compareCount : compareAlpha));
  };
  
  return (
    <Flipper
      flipKey={JSON.stringify(terms)}
      handleEnterUpdateDelete={exitThenFlipAndEnter}
    >
      <Flipped flipId='search-container'>
        <SearchContainer ref={filterTermsRef}>
          <Flipped inverseFlipId='search-container'>
            <ChipContainer>
              <Flipped flipId='search-controls'>
                <Box display='flex' flexDirection='row'>
                  <SearchIcon>
                    <Search />
                  </SearchIcon>
                  {terms.length > 0 && (
                    <Tooltip title='sort terms'>
                      <IconButton
                        color='inherit'
                        onClick={handleSortTerms}
                      >
                        {sort === 'count'
                          ? <Sort />
                          : <SortByAlpha />
                        }
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              </Flipped>
              {terms.map(term => (
                <TermChip
                  key={term}
                  term={term.replaceAll('~', '')}
                  count={counts?.[term.replaceAll('~', '')]}
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
                suggestions={input
                  ? <TermsList
                    beta={beta}
                    input={input}
                    header='autocomplete'
                    filter={terms}
                    terms={typeahead}
                    onAddChip={handleAddChip}
                  />
                  : terms.length
                    ? <TermsList
                      beta={beta}
                      input={input}
                      header='related terms'
                      filter={terms}
                      terms={related}
                      onAddChip={handleAddChip}
                    />
                    : beta
                      ? <TermsPreset />
                      : null

                }
              />
            </ChipContainer>
          </Flipped>
          <Flipped flipId='search-clear'>
            <Tooltip title={selected ? 'clear selection' : 'clear all terms'}>
              <IconButton
                ref={clearTermsRef}
                color='inherit'
                onClick={handleClearTerms}
              >
                {selected
                  ? <HighlightOff />
                  : <ClearAll />
                }
              </IconButton>
            </Tooltip>
          </Flipped>
        </SearchContainer>
      </Flipped>
    </Flipper>
  );
};

export default TermsFilter;
