// import FlipMove from 'react-flip-move';
import { Paper, styled } from '@material-ui/core';
import DivisionRow, { CellData } from 'app/divisions/DivisionRow';
import { useMeasure } from 'app/hooks';
import { useQuery } from 'app/query';
import { colorScales } from '../../theme';
import { Flipper, Flipped } from 'react-flip-toolkit';
import { useLoadDirectory, useSearch } from 'api';
import { stableSort } from 'app/sort';

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
  const [ query ] = useQuery();
  const { data: divisions } = useSearch(query, {
    query: {
      select: ({ data }) => stableSort(
        data.per_year.find(d => d.key === year)?.divisions ?? [],
        query.sort,
        query.direction
      )
    }
  });
  const { data: divMap } = useLoadDirectory(query.org, {
    query: {
      select: ({ data }) => Object.fromEntries(
        data.flatMap(dir => [[dir.abbr, dir.name]].concat(
          (dir?.departments ?? []).map(div => [div.abbr, div.name]))
        )
      )
    }
  });
  const legendFilter = { counts: true, amounts: true };
  const totals: CellData[] = [
    { name: 'count', value: 0 },
    { name: 'amount', value: 0 },
  ];

  const rows = divisions?.filter(d => query.divisions.includes(d.key) && d.count > 0).map((d): RowTuple => [
    d.key,
    ['count', 'amount'].map((field, i) => {
      totals[i].value += d[field];
      return {
        name: field,
        value: d[field],
        fill: colorScales[field](d.key),
      };
    })
  ]) ?? [];
  
  const cells = totals.filter((t, i) => [legendFilter.counts, legendFilter.amounts][i]);
  
  if (!divMap) return null;

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
                  name={divMap[key]}
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