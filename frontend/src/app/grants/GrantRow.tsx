import { CSSProperties } from 'react';
import { loadAbstract } from 'app/actions';
import { alpha, Grid, GridSize, styled } from '@material-ui/core';
import { useAppDispatch, useAppSelector } from 'app/store';
import { getGrant } from 'app/selectors';
import { Grant } from 'api/models/Grant';
import { timeFormat, timeParse, format } from 'd3';

type Column = {
  id: keyof Grant
  format: (s: any) => string,
  label: string,
  gridSize: GridSize,
}

export const cols: Column[] = [
  { id: 'title', format: t => t, label: 'Grant Title', gridSize: 7 },
  { id: 'date', format: d => timeFormat('%b %Y')(timeParse('%Y-%m-%d')(d)!), label: 'Date', gridSize: 1 },
  { id: 'amount', format: format('$,'), label: 'Amount', gridSize: 1 },
  { id: 'division', format: d => d, label: 'Division', gridSize: 3 },
];

const GrantListItem = styled(Grid)(({ theme }) => `
    cursor: pointer;
    padding-left: ${theme.spacing(3)};
    padding-right: ${theme.spacing(1)};
    border-bottom: 1px solid ${theme.palette.grey[300]};
    &:hover {
      background-color: ${alpha(theme.palette.grey[900], 0.05)};
    }
`);

type GrantRowProps = {
  index: number
  style: CSSProperties
}

const GrantRow = (props: GrantRowProps) => {

  const { index, style } = props;

  const dispatch = useAppDispatch();
  const grant = useAppSelector(state => getGrant(state, index));

  if (!grant) return null;

  const setSelectedGrant = () => {
    console.log(grant);
    dispatch(loadAbstract(grant.id));
  };

  return (
    <GrantListItem 
      container 
      key={index}
      direction='row' 
      alignItems='center' 
      style={style}
      onClick={setSelectedGrant}
    >
      {cols.map(({ gridSize, format, id }, idx: number) => (
        <Grid item xs={gridSize} key={idx}>
          {format(grant[id])}
        </Grid>
      ))}
    </GrantListItem>
  );
};

export default GrantRow;
