import {
  FocusEvent,
  KeyboardEvent,
  MouseEvent,
  forwardRef,
  useRef,
  useState,
} from 'react';
import { Flipped } from 'react-flip-toolkit';

import {
  Box,
  ClickAwayListener,
  Fade,
  InputBase,
  InputBaseProps,
  Paper,
  Popper,
  styled,
} from '@mui/material';

import { useQuery } from 'app/query';

const InputContainer = styled(Box)(
  ({ theme }) => `
  flex-grow: 1;
  cursor: text;
`
);

const ChipInput = styled(InputBase)(
  ({ theme }) => `
  padding: 0;
  color: 'inherit';
  & .MuiInputBase-input {
    color: ${theme.palette.common.white};
    // transition: ${theme.transitions.create('width')};
    width: 100%;
    padding-left: ${theme.spacing(1)};
    padding-bottom: ${theme.spacing(1.5)};
    ${theme.breakpoints.up('sm')} {
      width: 10ch;
      // &:focus {
      //   width: 20ch;
      // }
    }
  }
`
);

const Dropdown = styled(Paper)<{ topics: boolean }>(
  ({ theme, topics }) => `
  right: 0;
  width: 100%;
  margin-top: ${theme.spacing(0.5)};
  max-height: calc(100vh - 256px);
  overflow-x: hidden;
  overflow-y: auto;
  z-index: 3;
  ${theme.breakpoints.up('sm')} {
    width: ${topics ? '50em' : '25em'};
  }
`
);

type TermsInputProps = {
  value: string;
  suggestions: React.ReactElement | null;
  onAddChip: (chips: string) => void;
  onDeleteLastChip: () => void;
  onClearInput: () => void;
};

const TermsInput = forwardRef(
  (props: InputBaseProps & TermsInputProps, ref) => {
    const {
      suggestions,
      onAddChip,
      onDeleteLastChip,
      onClearInput,
      ...inputProps
    } = props;

    const inputRef = useRef<HTMLInputElement | null>(null);
    const [focused, setFocused] = useState(false);
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
    const [{ terms }] = useQuery();

    const handleClickFocus = (e: MouseEvent) => {
      inputRef.current?.focus();
      setFocused(true);
    };

    const handleFocus = (e: FocusEvent) => {
      setFocused(true);
      if (e.currentTarget) {
        setAnchorEl(
          e.currentTarget.parentElement?.parentElement?.parentElement
            ?.parentElement?.parentElement as HTMLElement
        );
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      console.log(e.key);
      switch (e.key) {
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
        case 'ArrowDown':
          console.log('down');
          break;
        case 'ArrowUp':
          console.log('down');
          break;
      }
    };

    const handleClickAway = () => {
      setFocused(false);
      inputRef.current?.blur();
    };

    return (
      <ClickAwayListener onClickAway={handleClickAway}>
        <InputContainer onClick={handleClickFocus}>
          <Flipped flipId='chip-input'>
            {(flipProps) => (
              <ChipInput
                componentsProps={{ root: flipProps as any }}
                ref={ref}
                placeholder='keywords'
                inputRef={inputRef}
                {...inputProps}
                onFocus={handleFocus}
                onKeyDown={handleKeyDown}
              />
            )}
          </Flipped>
          <Popper
            open={focused}
            anchorEl={anchorEl}
            placement='bottom-end'
            transition
          >
            {({ TransitionProps }) => (
              <Fade {...TransitionProps} timeout={350}>
                <Dropdown topics={!(props.value || terms.length)}>
                  {suggestions}
                </Dropdown>
              </Fade>
            )}
          </Popper>
        </InputContainer>
      </ClickAwayListener>
    );
  }
);

export default TermsInput;
