import { FocusEvent, KeyboardEvent, useRef, useState } from 'react';
import { Box, ClickAwayListener, Fade, InputBase, InputBaseProps, List, Paper, Popper, styled } from '@material-ui/core';
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
  onClearInput: () => void
};

const TermsInput = (props: InputBaseProps & TermsInputProps) => {

  const {
    onAddChip,
    onDeleteLastChip,
    onClearInput,
    ...inputProps
  } = props;
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [ focused, setFocused ] = useState(false);
  const [ anchorEl, setAnchorEl ] = useState<HTMLElement | null>(null);
  const terms = useAppSelector(getTerms);
  const typeahead = useAppSelector(getTypeahead);
  const related = useAppSelector(getRelated);

  const handleFocus = (e: FocusEvent) => {
    setFocused(true);
    if (e.currentTarget) {
      setAnchorEl(e.currentTarget
        .parentElement
        ?.parentElement
        ?.parentElement
        ?.parentElement as HTMLElement);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    console.log(e.key);
    switch(e.key) {
    case 'Enter':
      onAddChip(props.value);
      break;
    case 'Backspace':
      if (props.value.length === 0) {
        onDeleteLastChip();
      } else if (props.value.length === 1) {
        onClearInput();
      }
      break;
    case 'Escape':
      handleClickAway();
      break;
    }
  };

  const handleClickAway = () => {
    setFocused(false);
    inputRef.current?.blur();
  };

  return (
    <ClickAwayListener onClickAway={handleClickAway}>
      <Box flexGrow={1}>
        <ChipInput
          inputRef={inputRef}
          {...inputProps}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
        />
        <Popper
          open={focused}
          anchorEl={anchorEl}
          placement='bottom-end'
          transition
        >
          {({ TransitionProps }) => (
            <Fade {...TransitionProps} timeout={350}>
              <Dropdown>
                <List>
                  <TermsList
                    input={props.value}
                    header='autocomplete'
                    filter={terms.map(t => t.term)}
                    terms={typeahead}
                    onAddChip={onAddChip}
                  />
                  <Divider />
                  <TermsList
                    input={props.value}
                    header='related terms'
                    filter={terms.map(t => t.term)}
                    terms={related}
                    onAddChip={onAddChip}
                  />
                </List>
              </Dropdown>
            </Fade>
          )}
        </Popper>
      </Box>
    </ClickAwayListener>
  );
};

export default TermsInput;