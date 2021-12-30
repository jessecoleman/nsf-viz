import { FocusEvent, forwardRef, KeyboardEvent, useRef, useState } from 'react';
import { Flipper } from 'react-flip-toolkit';
import { Box, ClickAwayListener, Fade, InputBase, InputBaseProps, List, Paper, Popper, styled } from '@material-ui/core';
import TermsList from './TermsList';
import { useAppSelector } from 'app/store';
import { getRelated, getTerms, getTypeahead } from 'app/selectors';

const ChipInput = styled(InputBase)(({ theme }) => `
  color: 'inherit';
  & .MuiInputBase-input {
    color: ${theme.palette.common.white};
    transition: ${theme.transitions.create('width')};
    width: 100%;
    ${theme.breakpoints.up('sm')} {
      width: 10ch;
      &:focus {
        width: 20ch;
      }
    }
  }
`);

const Dropdown = styled(Paper)(({ theme }) => `
  right: 0;
  width: 100%;
  margin-top: ${theme.spacing(.5)};
  max-height: calc(100vh - 256px);
  overflow-y: auto;
  z-index: 3;
  ${theme.breakpoints.up('sm')} {
    width: 25em;
  }
`);

type TermsInputProps = {
  value: string
  onAddChip: (chips: string) => void
  onDeleteLastChip: () => void
  onClearInput: () => void
};

const TermsInput = forwardRef((props: InputBaseProps & TermsInputProps, ref) => {

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
        ?.parentElement
        ?.parentElement as HTMLElement);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
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
          ref={ref}
          placeholder='keywords'
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
                <Flipper flipKey={JSON.stringify([typeahead, related])}>
                  <List>
                    {props.value
                      ? <TermsList
                        input={props.value}
                        header='autocomplete'
                        filter={terms.map(t => t.term)}
                        terms={typeahead}
                        onAddChip={onAddChip}
                      />
                      : <TermsList
                        input={props.value}
                        header='related terms'
                        filter={terms.map(t => t.term)}
                        terms={related}
                        onAddChip={onAddChip}
                      />
                    }
                  </List>
                </Flipper>
              </Dropdown>
            </Fade>
          )}
        </Popper>
      </Box>
    </ClickAwayListener>
  );
});

export default TermsInput;