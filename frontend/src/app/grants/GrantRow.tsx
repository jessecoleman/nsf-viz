import { CSSProperties } from 'react';
import { loadAbstract } from 'app/actions';
import { alpha, styled } from '@material-ui/core';
import { useAppDispatch, useAppSelector } from 'app/store';
import { getGrant } from 'app/selectors';
import { Grant } from 'api/models/Grant';
import { timeFormat, timeParse, format } from 'd3';
import { useQuery } from 'app/query';

type Column = {
  id: keyof Grant
  format: (s: any) => string,
  label: string,
}

export const cols: Column[] = [
  { id: 'title', format: t => t, label: 'Grant Title' },
  { id: 'date', format: d => timeFormat('%b %Y')(timeParse('%Y-%m-%d')(d)!), label: 'Date' },
  { id: 'amount', format: format('$,'), label: 'Amount' },
  { id: 'cat1_raw', format: d => d, label: 'Division' },
];

export const GrantListItem = styled('div')(({ theme }) => `
  display: grid;
  grid-template-columns: [title] auto [date] 8rem [amount] 8rem [cat1_raw] 20rem;
  cursor: pointer;
  padding-left: ${theme.spacing(3)};
  padding-right: ${theme.spacing(1)};
  border-bottom: 1px solid ${theme.palette.grey[300]};
  &:hover {
    background-color: ${alpha(theme.palette.grey[900], 0.05)};
  }
  ${theme.breakpoints.down('sm')} {
    grid-template-columns: [title] auto [date] 5em;
  }
`);

type ColumnStyles = {
  column: string
};

export const GrantColumn = styled('div')<ColumnStyles>(({ theme, column }) => `
  position: relative;
  grid-column: ${column};
  display: flex;
  align-items: center;
  ${theme.breakpoints.down('sm')} {
    display: ${['amount', 'division'].includes(column) ? 'none' : 'initial'};
  }
`);

type GrantRowProps = {
  index: number
  style: CSSProperties
}

const GrantRow = (props: GrantRowProps) => {

  const { index, style } = props;

  const [{ terms }] = useQuery();
  const dispatch = useAppDispatch();
  const grant = useAppSelector(state => getGrant(state, index));

  if (!grant) return null;

  const setSelectedGrant = () => {
    dispatch(loadAbstract({
      id: grant.id,
      terms: terms ?? [],
    }));
  };

  return (
    <GrantListItem 
      key={index}
      style={style}
      onClick={setSelectedGrant}
    >
      {cols.map(({ format, id }) => (
        <GrantColumn key={id} column={id}>
          {format(grant[id])}
        </GrantColumn>
      ))}
    </GrantListItem>
  );
};

export default GrantRow;
