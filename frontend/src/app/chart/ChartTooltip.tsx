import FlipMove from 'react-flip-move';
import { Paper, styled } from '@material-ui/core';
import DivisionRow, { CellData } from 'app/divisions/DivisionRow';
import { useAppSelector } from 'app/store';
import { getDivisionAggs, getDivisionsMap, getDivisionYear, getLegendFilters } from 'app/selectors';
import { useMeasure, useQuery } from 'app/hooks';
import { colorScales } from '../../theme';

export type TooltipProps = {
  dataKey?: string
  year?: number
}

const ScrollableDiv = styled('div')`
  max-height: 30em;
  overflow-y: auto;
`;

type RowTuple = [ string, CellData[] ];

const ChartTooltip = (props: TooltipProps) => {

  const [ widthRef, scrollOffset ] = useMeasure<HTMLDivElement>();
  const { dataKey, year } = props;
  const { divisions } = useQuery();
  const legendFilter = useAppSelector(getLegendFilters);
  // const divisionAggs = useAppSelector(state => getDivisionYear(state, year));
  const divisionAggs = useAppSelector(getDivisionAggs);
  const divMap = useAppSelector(getDivisionsMap);
  const totals: CellData[] = [
    { name: 'count', value: 0 },
    { name: 'amount', value: 0 },
  ];

  const rows = divisionAggs.filter(d => divisions.includes(d.key) && d.count > 0).map((d): RowTuple => [
    d.key,
    ['count', 'amount'].map((field, i) => {
      totals[i].value += d[field];
      return {
        name: field,
        value: d[field],
        fill: colorScales[field](d.key),
      };
    })
  ]);
  
  const cells = totals.filter((t, i) => [legendFilter.counts, legendFilter.amounts][i]);

  return (
    <Paper id='tooltip' elevation={5}>
      <DivisionRow
        scrollOffset={scrollOffset}
        dataKey='header'
        title={year?.toString() ?? ''}
        cells={cells}
        header
      />
      <ScrollableDiv>
        <div ref={widthRef} />
        <FlipMove
          delay={100}
          enterAnimation='fade'
          leaveAnimation='fade'
        >
          {rows.map(([ key, cells ]) => (
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