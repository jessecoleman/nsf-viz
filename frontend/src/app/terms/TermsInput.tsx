import { FocusEvent, KeyboardEvent, useState } from 'react';
import { alpha, Box, ClickAwayListener, Collapse, InputBase, InputBaseProps, List, Paper, Popper, styled } from '@material-ui/core';
import TermsList from './TermsList';
import { Divider } from '@material-ui/core';
import { useAppSelector } from 'app/store';
import { getRelated, getTerms, getTypeahead } from 'app/selectors';

const ChipInput = styled(InputBase)(({ theme }) => `
  color: 'inherit';
  width: 100%;
  & .MuiInputBase-input {
    color: ${theme.palette.common.white};
    transition: ${theme.transitions.create('width')};
    ${theme.breakpoints.up('sm')}: {
      width: 120;
      &:focus {
        width: 200;
      }
    }
  }
`);

const Dropdown = styled(Paper)(({ theme }) => `
  right: 0;
  margin-top: ${theme.spacing(.5)};
  width: 25em;
  max-height: calc(100vh - 256px);
  overflow-y: auto;
  z-index: 3;
`);

type TermsInputProps = {
  value: string
  onAddChip: (chips: string) => void
  onDeleteLastChip: () => void
};

const TermsInput = (props: InputBaseProps & TermsInputProps) => {

  const [ focused, setFocused ] = useState(false);
  const [ anchorEl, setAnchorEl ] = useState<HTMLElement | null>(null);
  const terms = useAppSelector(getTerms);
  const typeahead = useAppSelector(getTypeahead);
  const related = useAppSelector(getRelated);

  const handleFocus = (e: FocusEvent) => {
    setFocused(true);
    console.log(e.currentTarget);
    if (e.currentTarget) {
      setAnchorEl(e.currentTarget as HTMLElement);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    console.log(e.key);
    switch(e.key) {
    case ',':
    case 'Enter':
      props.onAddChip(props.value);
      break;
    case 'Backspace':
      if (props.value.length === 0) {
        props.onDeleteLastChip();
      }
      break;
    }
  };

  const handleClickAway = () => {
    setFocused(false);
  };

  return (
    <ClickAwayListener onClickAway={handleClickAway}>
      <Box flexGrow={1}>
        <ChipInput
          {...props}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
        />
        <Popper
          open={focused}
          anchorEl={anchorEl}
          placement='bottom-end'
        >
          <Collapse in={focused}>
            {(related.length + typeahead.length) > 0 &&
            <Dropdown>
              <List>
                <TermsList
                  header='autocomplete'
                  filter={terms.map(t => t.term)}
                  terms={typeahead}
                  onAddChip={props.onAddChip}
                />
                <Divider />
                <TermsList
                  header='related terms'
                  filter={terms.map(t => t.term)}
                  terms={related}
                  onAddChip={props.onAddChip}
                />
              </List>
            </Dropdown>
            }
          </Collapse>
        </Popper>
      </Box>
    </ClickAwayListener>
  );
};

export default TermsInput;