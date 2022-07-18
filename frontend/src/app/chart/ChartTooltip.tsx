import { Paper, styled } from '@material-ui/core';
import DivisionRow, { CellData } from 'app/divisions/DivisionRow';
import { useMeasure } from 'app/hooks';
import { useDivisionsQuery, useQuery } from 'app/query';
import { colorScales } from '../../theme';
import { Flipper, Flipped } from 'react-flip-toolkit';
import { useSearch } from 'api';
import { stableSort } from 'app/sort';
import { useDirectory } from 'app/divisions/useDirectory';

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
  const [ divisions ] = useDivisionsQuery();
  const [ query ] = useQuery();
  const { data: divisionAggs } = useSearch(query, {
    query: {
      select: ({ data }) => stableSort(
        data.bars.find(d => d.key === year)?.divisions ?? [],
        query.sort,
        query.direction
      )
    }
  });
  const { divisionMap } = useDirectory();
  const legendFilter = { counts: true, amounts: true };
  const totals: CellData[] = [
    { name: 'count', value: 0 },
    { name: 'amount', value: 0 },
  ];

  const rows = divisionAggs
    ?.filter(d => divisions == null || (divisions.includes(d.key) && d.count > 0))
    ?.map((d): RowTuple => [
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
  
  if (!divisionMap || !rows) return null;

  return (
    <Paper id='tooltip' elevation={5}>
      <DivisionRow
        scrollOffset={scrollOffset}
        dataKey='header'
        name={year?.toString() ?? ''}
        cells={cells}
        header
      />
      <Flipper flipKey={props.year}>
        <ScrollableDiv>
          <div ref={widthRef} />
          {rows.map(([ key, cells ]) => (
            <Flipped key={key} flipId={key}>
              <div>
                <DivisionRow
                  tooltip
                  key={key}
                  id={`${key}-tooltip`}
                  selected={dataKey?.split('-')[0] === key}
                  dataKey={key}
                  name={divisionMap[key]?.name}
                  cells={cells}
                />
              </div>
            </Flipped>
          ))}
        </ScrollableDiv>
      </Flipper>
    </Paper>
  );
};

export default ChartTooltip;