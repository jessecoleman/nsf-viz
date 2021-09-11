import FlipMove from 'react-flip-move';
import { Box, Paper, styled } from '@material-ui/core';
import DivisionRow, { CellData } from 'app/divisions/DivisionRow';
import { useAppSelector } from 'app/store';
import { getDivisionAggs, getDivisionsMap, getDivisionYear, getLegendFilters } from 'app/selectors';
import { useMeasure, useQuery } from 'app/hooks';
import { deepPurpleScale, greenScale } from './Chart';

export type TooltipProps = {
  dataKey?: string
  year?: number
}

const ScrollableDiv = styled('div')`
  max-height: 30em;
  overflow-y: auto;
`;

const ChartTooltip = (props: TooltipProps) => {

  const [ widthRef, padding ] = useMeasure<HTMLDivElement>();
  const { dataKey, year } = props;
  const { divisions } = useQuery();
  const { counts, amounts } = useAppSelector(getLegendFilters);
  // const divisionAggs = useAppSelector(state => getDivisionYear(state, year));
  const divisionAggs = useAppSelector(getDivisionAggs);
  const divMap = useAppSelector(getDivisionsMap);
  const totals: CellData[] = [
    { name: 'count', value: 0 },
    { name: 'amount', value: 0 },
  ];

  const rows = Object.fromEntries(divisionAggs.filter(d => divisions.includes(d.key)).map(d => ([
    d.key,
    ['count', 'amount'].map((key, i) => {
      totals[i].value += d[key];
      return {
        name: key,
        value: d[key],
        fill: [deepPurpleScale, greenScale][i](d.key),
      };
    })
  ])));
  
  const divCounts = Object.fromEntries(divisionAggs.map(d => [d.key, d.count]));
  const comparator = (a, b) => divCounts[b] - divCounts[a];

  const cells = totals.filter((t, i) => [counts, amounts][i]);

  return (
    <Paper id='tooltip' elevation={5}>
      <Box paddingRight={padding}>
        <DivisionRow
          dataKey='header'
          title={year?.toString() ?? ''}
          cells={cells}
          header
        />
      </Box>
      <ScrollableDiv>
        <div ref={widthRef} />
        <FlipMove
          delay={100}
          enterAnimation='fade'
          leaveAnimation='fade'
        >
          {Object.entries(rows).sort(comparator).map(([ key, cells ]) => (
            <DivisionRow
              key={key}
              id={`${key}-tooltip`}
              selected={dataKey?.split('-')[0] === key}
              dataKey={key}
              title={divMap[key]}
              cells={cells}
            />
          ))}
        </FlipMove>
      </ScrollableDiv>
    </Paper>
  );
};

export default ChartTooltip;