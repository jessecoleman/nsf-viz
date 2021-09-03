import FlipMove from 'react-flip-move';
import { Box, Paper, styled } from '@material-ui/core';
import { TooltipProps } from 'recharts/types/component/Tooltip';
import DivisionRow, { CellData } from 'app/divisions/DivisionRow';
import { useAppSelector } from 'app/store';
import { getDivisionAggs, getDivisionsMap, getLegendFilters } from 'app/selectors';

const Container = styled(Paper)(({ theme }) => `
  margin: 3em;
  overflow-y: hidden;
`);

const ChartTooltip = (props: TooltipProps<number, string>) => {

  const { counts, amounts } = useAppSelector(getLegendFilters);
  const divisions = useAppSelector(getDivisionAggs);
  const divMap = useAppSelector(getDivisionsMap);
  let year = 0;
  const totals: CellData[] = [{ key: 'count', v: 0 }, { key: 'amount', v: 0 }];

  const rows: Record<string, CellData[]> = {};
  props.payload?.forEach(p => {
    console.log(p);
    if (!p.name || !p.value) return;
    year = p.payload.year;
    const [ key, group ] = p.name.split('-');
    if (!rows[key]) {
      rows[key] = [{
        key: group,
        v: p.value,
        fill: (p as any).fill,
      }];
      totals[0].v += p.value;
    } else {
      rows[key].push({
        key: group,
        v: p.value,
        fill: (p as any).fill,
      });
      totals[1].v += p.value;
    }
  });

  const divCounts = Object.fromEntries(divisions.map(d => [d.key, d.count]));
  const comparator = (a, b) => divCounts[b] - divCounts[a];

  const cells = totals.filter((t, i) => [counts, amounts][i]);

  return (
    <Container
      style={{ width: '30em' }}
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
};

export default ChartTooltip;