import { Box, Checkbox, styled, Typography } from '@material-ui/core';
import { format } from 'd3';
import { forwardRef } from 'react';

type RowStyles = {
  selected?: boolean;
  checkable?: boolean;
  nohover?: boolean;
}

export const Row = styled(Box)<RowStyles>(({ theme, checkable, selected, nohover }) => `
  cursor: pointer;
  display: grid;
  grid-template-columns: ${(checkable ? '[checkbox] 3em ' : '')
    + '[name] auto [count] 4em [amount] 4em'};
  border-bottom: 1px solid ${theme.palette.grey[200]};
  background-color: ${selected
    ? theme.palette.grey[300]
    : theme.palette.common.white};
  &:hover {
    background-color: ${nohover ? theme.palette.common.white : theme.palette.grey[100]};
  }
`);

type BoxStyles = {
  column: string
};

type TextStyles = {
  light: boolean
}

export const StyledBox = styled(Box)<BoxStyles>(({ theme, column }) => `
  height: 2.5em;
  grid-column: ${column};
  display: flex;
  align-items: center;
  padding: ${theme.spacing(0, 1)};
`);

export const NumberBox = styled(StyledBox)<BoxStyles & TextStyles>(({ theme, light }) => `
  color: ${light ? theme.palette.common.black : theme.palette.common.white};
`);

export type CellData = {
  name: string,
  value: number,
  fill?: string,
};

type RowProps = {
  id?: string
  selected?: boolean
  checkable?: boolean
  dataKey: string
  title: string
  cells: CellData[]
  header?: boolean
  onCheck?: (checked: boolean) => void
  onMouseOver?: (key: string) => void
  onMouseOut?: (key: string) => void
  checked?: boolean
}

const rgb2hsl = (hex?: string) => {
  if (hex === undefined) return 1;
  let [ r, g, b ] = /(\w{2})(\w{2})(\w{2})/.exec(hex)!.map(v => parseInt(v, 16)).slice(1);
  r /= 255, g /= 255, b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  return max + min / 2;
};

const DivisionRow = forwardRef((props: RowProps, ref) => (
  <Row
    id={props.id}
    checkable={props.checkable}
    ref={ref}
    selected={props.selected}
    onClick={() => props.onCheck?.(!props.checked)}
    onMouseOver={() => props.onMouseOver?.(props.dataKey)}
    onMouseOut={() => props.onMouseOut?.(props.dataKey)}
  >
    {props.onCheck && 
      <StyledBox column='checkbox'>
        <Checkbox checked={props.checked} />
      </StyledBox>
    }
    <StyledBox column='name'>
      <Typography variant={props.header ? 'h6' : undefined}>
        {props.title}
      </Typography>
    </StyledBox>
    {props.cells.map((c, idx) => (
      <NumberBox
        key={c.name}
        column={c.name}
        light={props.header || rgb2hsl(c.fill) > 0.9}
        style={{
          backgroundColor: props.header ? 'white' : c.fill
        }}
      >
        <Typography>
          {c.value === 0 
            ? '-'
            : c.name === 'count'
              ? c.value
              : format('$.2s')(c.value).replace(/G/, 'B')
          }
        </Typography>
      </NumberBox>
    ))}
  </Row>
));

export default DivisionRow;