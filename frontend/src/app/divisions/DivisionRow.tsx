import { MouseEvent } from 'react';
import { Box, Checkbox, styled, Typography } from '@material-ui/core';
import { format } from 'd3';
import { forwardRef, ReactNode } from 'react';
import { CheckboxState } from './DirectoryTableHead';
import { getNextCheckboxState } from './checkFSM';

type RowStyles = {
  tooltip?: boolean;
  selected?: boolean;
  checkable?: boolean;
  nohover?: boolean;
  scrollOffset?: number;
}

export const Row = styled(Box)<RowStyles>(({ theme, tooltip, checkable, selected, nohover, scrollOffset }) => `
  flex-grow: 1;
  cursor: pointer;
  display: grid;
  padding-right: ${scrollOffset ?? 0}px;
  grid-template-columns: ${(checkable ? '[checkbox] auto ' : '')
    + '[name] minmax(0, 1fr) [count] 4em [amount] 4em'};
  border-top: ${tooltip ? `1px solid ${theme.palette.grey[200]}` : 'none'};
  background-color: ${selected
    ? theme.palette.action.selected
    : 'white'};
  &:hover {
    background-color: ${nohover ? theme.palette.common.white : theme.palette.action.hover};
  }
`);

type ColumnStyles = {
  column: string
};

type TextStyles = {
  light: boolean
  backgroundColor?: string
}

export const Column = styled(Box)<ColumnStyles>(({ theme, column }) => `
  height: 3em;
  grid-column: ${column};
  display: flex;
  align-items: center;
  padding: ${column === 'checkbox' ? 0 : theme.spacing(0, 1)};
`);

export const NumberColumn = styled(Column)<ColumnStyles & TextStyles>(({ theme, light, backgroundColor }) => `
  color: ${light ? theme.palette.common.black : theme.palette.common.white};
  background-color: ${backgroundColor};
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
  onCheck?: (e: MouseEvent, key: string, checked: CheckboxState) => void
  onMouseOver?: (key: string) => void
  onMouseOut?: (key: string) => void
  checked?: CheckboxState
}

// return brightness of hex value to determine if text should be black or white to meet
// contrast ratio accessibility requirement
const rgb2hsl = (hex?: string) => {
  if (hex === undefined || hex === 'white') return 1;
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const [ r, g, b ] = /(\w{2})(\w{2})(\w{2})/.exec(hex)!
    .map(v => parseInt(v, 16))
    .slice(1)
    .map(v => v / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  return max + min / 2;
};

const formatColumn = (cell: CellData): string => {
  if (cell.value === 0) return '-';
  else if (cell.name === 'count') return cell.value.toString();
  else return format('$.2s')(cell.value).replace(/G/, 'B');
};

const DivisionRow = forwardRef((props: RowProps, ref) => (
  <Row
    ref={ref}
    id={props.id}
    checkable={props.checkable}
    scrollOffset={props.scrollOffset}
    selected={props.selected}
    tooltip={props.tooltip}
    onClick={(e) => props.onCheck?.(e, props.dataKey, getNextCheckboxState(props.checked))}
    onMouseOver={() => props.onMouseOver?.(props.dataKey)}
    onMouseOut={() => props.onMouseOut?.(props.dataKey)}
  >
    {props.onCheck && 
      <Column column='checkbox'>
        <Checkbox
          checked={props.checked === 'checked'}
          indeterminate={props.checked === 'indeterminate'}
        />
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
        backgroundColor={props.header ? 'white' : c.fill}
      >
        <Typography>
          {formatColumn(c)}
        </Typography>
      </NumberColumn>
    ))}
  </Row>
));

export default DivisionRow;