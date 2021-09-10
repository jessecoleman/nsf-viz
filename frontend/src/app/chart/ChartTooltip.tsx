import FlipMove from 'react-flip-move';
import { Box, Paper, styled } from '@material-ui/core';
import DivisionRow, { CellData } from 'app/divisions/DivisionRow';
import { useAppSelector } from 'app/store';
import { getDivisionAggs, getDivisionsMap, getLegendFilters } from 'app/selectors';
import { forwardRef, Ref } from 'react';
import { useQuery } from 'app/hooks';

const Container = styled(Paper)(({ theme }) => `
  position: absolute;
  width: 30em;
  margin: 3em;
  top: 0;
  left: 0;
  overflow-y: hidden;
`);

export type TooltipProps = {
  key?: string
  year?: number
}

const ChartTooltip = forwardRef((props: TooltipProps, ref: Ref<HTMLDivElement>) => {

  const { counts, amounts } = useAppSelector(getLegendFilters);
  const { divisions } = useQuery();
  const divisionAggs = useAppSelector(getDivisionAggs);
  const divMap = useAppSelector(getDivisionsMap);
  const year = 0;
  const totals: CellData[] = [{ name: 'count', value: 0 }, { name: 'amount', value: 0 }];

  const rows: Record<string, CellData[]> = {};
  // const rows = {};
  // const rows = Object.fromEntries(divisionAggs.filter(d => divisions.includes(d.key)).map(d => ([
  //   d.key,
  //   ['count', 'amount'].map((key, i) => {
  //     totals[i].value += d[key];
  //     return {
  //       name: key,
  //       value: d[key],
  //       fill: '#ffffff', //(p as any).fill,
  //     };
  //   })
  // ])));
  
  const divCounts = Object.fromEntries(divisionAggs.map(d => [d.key, d.count]));
  const comparator = (a, b) => divCounts[b] - divCounts[a];

  const cells = totals.filter((t, i) => [counts, amounts][i]);

  return (
    <Container
      ref={ref}
      elevation={5}
    >
      <DivisionRow
        dataKey='header'
        title={year.toString()}
        cells={cells}
        header
      />
      <Box>
        <FlipMove
          delay={100}
          enterAnimation='fade'
          leaveAnimation='fade'
        >
          {Object.entries(rows).sort(comparator).map(([ key, cells ]) => (
            <DivisionRow
              key={key}
              dataKey={key}
              title={divMap[key]}
              cells={cells}
            />
          ))}
        </FlipMove>
      </Box>
    </Container>
  );
});

export default ChartTooltip;