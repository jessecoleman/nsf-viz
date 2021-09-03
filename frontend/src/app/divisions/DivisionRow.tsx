import { Box, styled, Typography } from '@material-ui/core';
import { format } from 'd3';
import { forwardRef } from 'react';

const StyledBox = styled(Box)(({ theme }) => `
  width: 26em;
  height: 2.5em;
  display: flex;
  align-items: center;
  padding: ${theme.spacing(0, 1)};
  border-bottom: 1px solid ${theme.palette.grey[200]}
`);

const NumberBox = styled(StyledBox)(({ theme }) => `
  width: 4em;
  color: ${theme.palette.grey[100]};
  background-color: ${props => props.fill};
`);

export type CellData = {
  key: string,
  v: number,
  fill?: string,
  color?: string,
};

type RowProps = {
  dataKey: string
  title: string
  cells: CellData[]
  header?: boolean
}

const DivisionRow = forwardRef((props: RowProps, ref) => (
  <Box
    ref={ref}
    display='flex'
    alignItems='center'
  >
    <StyledBox>
      <Typography variant={props.header ? 'h6' : undefined}>{props.title}</Typography>
    </StyledBox>
    {props.cells.map(c => (
      <NumberBox
        key={c.key}
        style={{
          color: props.header ? 'black' : c.color,
          backgroundColor: props.header ? 'inherit' : c.fill
        }}
      >
        <Typography>
          {c.key === 'count' ? c.v : format('$.2s')(c.v).replace(/G/, 'B')}
        </Typography>
      </NumberBox>
    ))}
  </Box>
));

export default DivisionRow;