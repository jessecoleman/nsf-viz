import { memo, MouseEvent } from 'react';
import { Flipped } from 'react-flip-toolkit';
import { Chip, CircularProgress } from '@material-ui/core';
import { alpha, styled } from '@material-ui/core/styles';
import { format } from 'd3';

const StyledChip = styled(Chip)(({ theme }) => `
  margin-right: ${theme.spacing(1)};
  margin-bottom: ${theme.spacing(1)};
  &.MuiChip-root {
    background-color: ${theme.palette.grey[300]};
    &:hover {
      background-color: ${theme.palette.grey[400]};
    }
  }
  &.MuiChip-colorSecondary {
    background-color: ${theme.palette.secondary.main};
    &:hover {
      background-color: ${theme.palette.secondary.dark};
    }
    & > span > span > span {
      background-color: ${alpha(theme.palette.common.white, 0.7)};
    }
  }
`);

const ChipContent = styled('span')(({ theme }) => `
  display: flex;
  flex-direction: row;
  align-items: center;
  // count
  & > span {
    ${theme.breakpoints.down('sm')} {
      display: none;
    }
    height: ${theme.spacing(3)};
    min-width: ${theme.spacing(3)};
    color: ${theme.palette.text.primary};
    background-color: ${alpha(theme.palette.common.black, 0.26)};
    margin-left: -${theme.spacing(0.9)};
    margin-right: ${theme.spacing(1)};
    padding: ${theme.spacing(0.25, 0.5)};
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: ${theme.spacing(1.5)};
  }
`);

export type TermChipProps = {
  term: string
  count?: number
  onClick?: (e: MouseEvent, key: string) => void
  onDelete?: () => void
  selected?: boolean
};

const TermChip = (props: TermChipProps) => (
  <Flipped flipId={props.term}>
    <StyledChip
      variant='filled'
      color={props.selected ? 'secondary' : undefined}
      label={
        <ChipContent>
          <span>
            {props.count
              ? format('.2s')(props.count)
              : <CircularProgress size='1.25em' color='secondary' />
            }
          </span>
          {props.term}
        </ChipContent>
      }
      onClick={(e) => props.onClick?.(e, props.term)}
      onDelete={props.onDelete}
    />
  </Flipped>
);
 
export default memo(TermChip);