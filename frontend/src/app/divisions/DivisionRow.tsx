import { Box, Checkbox, styled, Typography } from '@material-ui/core';
import { format } from 'd3';
import { forwardRef } from 'react';

export const Row = styled(Box)(({ theme }) => `
  width: 100%;
  cursor: pointer;
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  border-bottom: 1px solid ${theme.palette.grey[200]};
  &:hover {
    background-color: ${theme.palette.grey[100]};
  }
`);

export const StyledBox = styled(Box)(({ theme }) => `
  height: 2.5em;
  display: flex;
  align-items: center;
  padding: ${theme.spacing(0, 1)};
`);

export const CheckBoxBox = styled(StyledBox)`
  width: 3em;
`;

export const NumberBox = styled(StyledBox)(({ theme }) => `
  display: flex;
  width: 4em;
  color: ${theme.palette.grey[100]};
`);

export type CellData = {
  name: string,
  value: number,
  fill?: string,
};

type RowProps = {
  dataKey: string
  title: string
  cells: CellData[]
  header?: boolean
  onCheck?: (checked: boolean) => void
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
    ref={ref}
    onClick={() => props.onCheck?.(!props.checked)}
  >
    {props.onCheck && 
      <CheckBoxBox>
        <Checkbox checked={props.checked} />
      </CheckBoxBox>
    }
    <StyledBox>
      <Typography variant={props.header ? 'h6' : undefined}>
        {props.title}
      </Typography>
    </StyledBox>
    {props.cells.map((c, idx) => (
      <NumberBox
        key={c.name}
        style={{
          marginLeft: idx === 0 ? 'auto' : 'initial',
          color: props.header ? 'black' : rgb2hsl(c.fill) < 0.9 ? 'white' : 'black',
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