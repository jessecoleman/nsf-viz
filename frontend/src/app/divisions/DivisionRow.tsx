import { MouseEvent } from 'react';
import { Box, Checkbox, styled, Typography } from '@material-ui/core';
import { format } from 'd3';
import { forwardRef, ReactNode } from 'react';

type RowStyles = {
  selected?: boolean;
  checkable?: boolean;
  nohover?: boolean;
  scrollOffset?: number;
}

export const Row = styled(Box)<RowStyles>(({ theme, checkable, selected, nohover, scrollOffset }) => `
  cursor: pointer;
  display: grid;
  padding-right: ${scrollOffset ?? 0}px;
  grid-template-columns: ${(checkable ? '[checkbox] auto ' : '')
    + '[name] minmax(0, 1fr) [count] 4em [amount] 4em'};
  // border-bottom: 1px solid ${theme.palette.grey[200]};
  background-color: ${selected
    ? theme.palette.action.selected
    : 'default'};
  //&:hover {
  //  background-color: ${nohover ? theme.palette.common.white : theme.palette.action.hover};
  //}
`);

type ColumnStyles = {
  column: string
};

type TextStyles = {
  light: boolean
}

export const Column = styled(Box)<ColumnStyles>(({ theme, column }) => `
  height: 3em;
  grid-column: ${column};
  display: flex;
  align-items: center;
  padding: ${column === 'checkbox' ? 0 : theme.spacing(0, 1)};
`);

export const NumberColumn = styled(Column)<ColumnStyles & TextStyles>(({ theme, light }) => `
  color: ${light ? theme.palette.common.black : theme.palette.common.white};
`);

export type CellData = {
  name: string,
  value: number,
  fill?: string,
};

type RowProps = RowStyles & {
  id?: string
  dataKey: string
  name: string | ReactNode
  cells: CellData[]
  header?: boolean
  onCheck?: (e: MouseEvent, key: string, checked: boolean) => void
  onMouseOver?: (key: string) => void
  onMouseOut?: (key: string) => void
  checked?: boolean
}

const rgb2hsl = (hex?: string) => {
  if (hex === undefined || hex === 'white') return 1;
  let [ r, g, b ] = /(\w{2})(\w{2})(\w{2})/.exec(hex)!.map(v => parseInt(v, 16)).slice(1);
  r /= 255, g /= 255, b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  return max + min / 2;
};

const DivisionRow = forwardRef((props: RowProps, ref) => (
  <Row
    ref={ref}
    id={props.id}
    checkable={props.checkable}
    scrollOffset={props.scrollOffset}
    selected={props.selected}
    onClick={(e) => props.onCheck?.(e, props.dataKey, !props.checked)}
    onMouseOver={() => props.onMouseOver?.(props.dataKey)}
    onMouseOut={() => props.onMouseOut?.(props.dataKey)}
  >
    {props.onCheck && 
      <Column column='checkbox'>
        <Checkbox checked={props.checked} />
      </Column>
    }
    <Column column='name'>
      <Typography variant={props.header ? 'h6' : undefined}>
        {props.name}
      </Typography>
    </Column>
    {props.cells.map(c => (
      <NumberColumn
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
      </NumberColumn>
    ))}
  </Row>
));

export default DivisionRow;