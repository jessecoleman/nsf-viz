import { alpha, Chip, CircularProgress } from '@material-ui/core';
import { styled } from '@material-ui/core/styles';
import { format } from 'd3';
import { Term } from 'app/filterReducer';
import { forwardRef, MouseEvent } from 'react';

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
  }
`);

const ChipContent = styled('span')(({ theme }) => `
  display: flex;
  flex-direction: row;
  align-items: center;
  & > span {
    color: ${theme.palette.text.primary};
    background-color: ${theme.palette.grey[400]};
    margin-left: -${theme.spacing(0.9)};
    margin-right: ${theme.spacing(1)};
    padding: ${theme.spacing(0.5)};
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 20px;
  };
`);

export type TermChipProps = {
  chip: Term,
  onClick?: (e: MouseEvent, key: string) => void
  onDelete?: () => void
  selected?: boolean
};

const TermChip = forwardRef<HTMLDivElement, TermChipProps>((props: TermChipProps, ref) => {

  const { selected, chip, onClick, onDelete } = props;

  return (
    <StyledChip
      ref={ref}
      variant='filled'
      color={selected ? 'secondary' : undefined}
      label={
        <ChipContent>
          <span> 
            {chip.count 
              ? format('.2s')(chip.count)
              : <CircularProgress style={{ width: '1em', height: '1em' }} />
            }
          </span>
          {props.chip.term}
        </ChipContent>
      }
      onClick={(e) => onClick?.(e, chip.term)}
      onDelete={onDelete}
    />
  );
});
 
export default TermChip;